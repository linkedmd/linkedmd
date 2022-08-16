import parseImports from 'parse-imports'
import yaml from 'js-yaml'
import { marked } from 'marked'

const FILE_PART_DELIMITER = '---'
const REFERENCE_REGEX = /(?<=\[\[)([^\[\]]*)(?=\]\])/g

type LinkedMarkdownFile = {
  imports: Array<Import>
  inputs: Object | any
  contents: string
}

type Import = {
  default?: string
  named?: Array<string>
  packageURI: string
}

function splitFileParts(file: string): Array<string> {
  return file.split(FILE_PART_DELIMITER)
}

async function formatImports(code: string): Promise<Array<Import>> {
  const imports = []
  for (const parsedImport of await parseImports(code)) {
    const formattedImport: Import = {
      default: parsedImport.importClause?.default,
      named:
        parsedImport.importClause?.named &&
        parsedImport.importClause?.named.map(
          (namedImport) => namedImport.specifier
        ),
      packageURI: parsedImport.moduleSpecifier.value || '',
    }
    imports.push(formattedImport)
  }
  return imports
}

function addReferences(inputs: Object | any, contents: string): string {
  let referenceMap: any = ''
  Object.keys(inputs).map(
    (key) =>
      (referenceMap += `<tr id="Ref/${escape(key)}"><td>${key}</td><td>${
        inputs[key]
      }</td></tr>`)
  )
  referenceMap = `<table id="LinkedMarkdown-References">${referenceMap}</table>`
  const references = contents.matchAll(REFERENCE_REGEX)
  const array = [...contents.matchAll(REFERENCE_REGEX)]
  let newContents = contents
  for (const ref of array) {
    const refName = ref[0]
    newContents = newContents.replaceAll(
      `[[${refName}]]`,
      `[${refName}](#Ref/${escape(refName)} "${inputs[refName]}")`
    )
  }
  return `${referenceMap}${newContents}`
}

async function parse(file: string): Promise<LinkedMarkdownFile> {
  const splitFile = splitFileParts(file)
  const parsedFile: LinkedMarkdownFile = {
    imports: await formatImports(splitFile[0]),
    inputs: yaml.load(splitFile[1]),
    contents: splitFile[2],
  }
  console.log(
    marked.parse(addReferences(parsedFile.inputs, parsedFile.contents))
  )
  return parsedFile
}

function getInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    let data = ''
    stdin.setEncoding('utf8')
    stdin.on('data', (chunk) => (data += chunk))
    stdin.on('end', () => resolve(data))
    stdin.on('error', reject)
  })
}

getInput().then(parse).catch(console.error)
