// @ts-ignore
import parseStaticImports from 'parse-static-imports'
import yaml from 'js-yaml'
import { marked } from 'marked'

const FILE_PART_DELIMITER = '---'
// Safari doesn't support look behind (<=)
// const REFERENCE_REGEX = /(?<=\[\[)([^\[\]]*)(?=\]\])/g
const REFERENCE_REGEX = /(?:\[\[)([^\[\]]*)(?=\]\])/g
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const DOMAIN_REGEX =
  /^(((?!\-))(xn\-\-)?[a-z0-9\-_]{0,61}[a-z0-9]{1,1}\.)*(xn\-\-)?([a-z0-9\-]{1,61}|[a-z0-9\-]{1,30})\.[a-z]{2,}$/
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/

type LinkedMarkdownFile = {
  imports: Array<Import> | []
  declarations: Object | any
  contents: string
}

type Import = {
  defaultImport?: string
  namedImports?: Array<{
    name: string
    alias: string
  }>
  moduleName: string
}

type Declaration = {
  value: string
  packageName?: any
  remoteScope?: boolean
}

function error(message: string) {
  console.error(`LinkedMarkdown compiler: ${message}`)
}

async function resolveImports(code: string): Promise<any> {
  const imports = parseStaticImports(code)
  const importedDeclarations = {}
  await Promise.all(
    imports.map(async (unresolvedImport: Import) => {
      /*const package = await fetch(unresolvedImport.packageURI)
      const file = await package.text()*/
      const importedFile = new LinkedMarkdown(importNATION)
      await importedFile.parse()
      unresolvedImport.namedImports?.map((namedImport: any) => {
        // @ts-ignore
        importedDeclarations[namedImport.alias] = {
          value: importedFile.data.declarations[namedImport.name].value,
          packageName: unresolvedImport.moduleName,
        }
      })
      Object.keys(importedFile.data.declarations).map((name) => {
        // @ts-ignore
        importedDeclarations[`${unresolvedImport.moduleName}/${name}`] = {
          value: importedFile.data.declarations[name].value,
          packageName: unresolvedImport.moduleName,
          remoteScope: true,
        }
      })
    })
  )
  return importedDeclarations
}

const importNATION = `
---
NATION: ERC20 token living in the Ethereum blockchain at [[Address]]
Address: '0x333A4823466879eeF910A04D473505da62142069'
---
`

const Link = ({ href, text }: { href: string; text: string }) =>
  `<a href="${href}" rel="noreferrer" target="_blank">${text}</a>`

function formatValue(value: string | number | Date): string | number | Date {
  if (typeof value === 'string') {
    if (
      value.match(ETH_ADDRESS_REGEX) ||
      (value.match(DOMAIN_REGEX) && value.endsWith('.eth'))
    ) {
      return Link({
        href: `https://etherscan.io/address/${value}`,
        text: value,
      })
    } else if (value.match(DOMAIN_REGEX)) {
      return Link({ href: `https://${value}`, text: value })
    } else if (value.match(URL_REGEX)) {
      return Link({ href: value, text: value })
    }
  } else if (value instanceof Date) {
    return value.toUTCString()
  }
  return value
}

function enrichDeclarations(
  declarations: Object | any,
  input: string,
  packageName?: string
) {
  const matches = [...input.matchAll(REFERENCE_REGEX)]
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]
    const declarationPath = packageName ? `${packageName}/${name}` : name

    if (!declarations[declarationPath]) {
      error(`Reference ${declarationPath} not found`)
      return newContents
    }

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `${name} (${declarations[declarationPath].value})`
    )
  }
  return newContents
}

function formatDeclarations(
  declarations: Object | any,
  input: string,
  packageName?: string
): string {
  const matches = [...input.matchAll(REFERENCE_REGEX)]
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]
    const declarationPath = packageName ? `${packageName}/${name}` : name
    const declaration = declarations[declarationPath]
    const refError = !declaration && `style="color: red"`
    refError && error(`Reference ${name} not found`)

    const refTooltip = !refError
      ? `data-tooltip="${enrichDeclarations(
          declarations,
          declaration.value,
          packageName || declaration.packageName
        )}"`
      : `data-tooltip="Reference ${name} not found"`

    const escapedPath = packageName ? `${packageName}/${escape(name)}` : name

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `<a href="#Ref/${escapedPath}" class="LM-ref" ${refTooltip} ${refError}>${name}</a>`
    )
  }
  return newContents
}

function addDeclarationsTable(
  declarations: Object | any,
  contents: string
): string {
  let referenceMap: any = ''
  Object.keys(declarations).map((key) => {
    if (declarations[key].remoteScope) return

    referenceMap += `<tr id="Ref/${escape(
      key
    )}"><td>${key}</td><td>${formatDeclarations(
      declarations,
      formatValue(declarations[key].value).toString(),
      declarations[key].packageName
    )}</td></tr>`
  })
  referenceMap = `<table id="LinkedMarkdown-References">${referenceMap}</table>`
  let newContents = formatDeclarations(declarations, contents)
  return `${referenceMap}${newContents}`
}

type Declarations = {
  [name: string]: Declaration
}

async function parse(file: string): Promise<LinkedMarkdownFile> {
  const splitFile = file.split(FILE_PART_DELIMITER)
  if (splitFile.length !== 3) {
    error("File doesn't have the required three sections")
    return { imports: [], declarations: [], contents: '' }
  }
  const importedDeclarations = await resolveImports(splitFile[0])
  const rawLocalDeclarations: any = yaml.load(splitFile[1])
  const localDeclarations: Declarations = {}
  Object.keys(rawLocalDeclarations).map((name: string) => {
    localDeclarations[name] = { value: rawLocalDeclarations[name] }
  })
  const declarations = Object.assign(localDeclarations, importedDeclarations)
  const parsedFile: LinkedMarkdownFile = {
    imports: parseStaticImports(splitFile[0]),
    declarations,
    contents: splitFile[2],
  }
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

// getInput().then(parse).catch(console.error)

export class LinkedMarkdown {
  input: string
  data!: LinkedMarkdownFile

  constructor(input: string) {
    this.input = input
  }

  async parse(): Promise<LinkedMarkdownFile> {
    this.data = await parse(this.input)
    return this.data
  }

  toHTML() {
    return marked.parse(
      addDeclarationsTable(this.data.declarations, this.data.contents)
    )
  }
}
