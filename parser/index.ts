// @ts-ignore
import parseImports from 'parse-es6-imports'
// @ts-ignore
import yaml from 'js-yaml'
import { marked } from 'marked'

const FILE_PART_DELIMITER = '---'
// Safari doesn't support look behind (<=)
// const REFERENCE_REGEX = /(?<=\[\[)([^\[\]]*)(?=\]\])/g
const DECLARATION_REGEX = /(?:\[\[)([^\[\]]*)(?=\]\])/g
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const DOMAIN_REGEX =
  /^(((?!\-))(xn\-\-)?[a-z0-9\-_]{0,61}[a-z0-9]{1,1}\.)*(xn\-\-)?([a-z0-9\-]{1,61}|[a-z0-9\-]{1,30})\.[a-z]{2,}$/
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
const IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs'

type LinkedMarkdownFile = {
  imports: Array<Import> | []
  declarations: Object | any
  contents: string
}

type Import = {
  defaultImport?: string
  namedImports?: Array<{
    name: string
    value: string
  }>
  fromModule: string
}

type Declaration = {
  value: string
  pkgVersionURI?: string
  remoteScope?: boolean
}

function error(message: string) {
  console.error(`LinkedMarkdown compiler: ${message}`)
}

async function fetchPackageVersion(uri: string): Promise<string> {
  const ipfsURI = uri.startsWith('ipfs://')
    ? `${IPFS_GATEWAY}/${uri.split('ipfs://')[1]}`
    : false

  try {
    const req = await fetch(ipfsURI || uri)
    const file = await req.text()
    return file
  } catch (e) {
    error(`Fetching package version was impossible (URI ${uri})`)
    return ''
  }
}

async function resolveImports(code: string): Promise<any> {
  const imports = parseImports(code)
  const importedDeclarations = {}
  await Promise.all(
    imports.map(async (unresolvedImport: Import) => {
      const file = await fetchPackageVersion(unresolvedImport.fromModule)
      const importedFile = new LinkedMarkdown(file)
      await importedFile.parse()
      unresolvedImport.namedImports?.map((namedImport: any) => {
        if (!(namedImport.name in importedFile.data.declarations)) {
          error(
            `Cannot find ${namedImport.value} in ${unresolvedImport.fromModule}`
          )
          return
        }
        // @ts-ignore
        importedDeclarations[namedImport.value] = {
          value: importedFile.data.declarations[namedImport.name].value,
          pkgVersionURI: unresolvedImport.fromModule,
        }
      })
      Object.keys(importedFile.data.declarations).map((name) => {
        // @ts-ignore
        importedDeclarations[`${unresolvedImport.fromModule}#${name}`] = {
          value: importedFile.data.declarations[name].value,
          pkgVersionURI: unresolvedImport.fromModule,
          remoteScope: true,
        }
      })
    })
  )
  return importedDeclarations
}

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

function formatDeclarationPath(name: string, pkgVersionURI?: string) {
  return pkgVersionURI ? `${pkgVersionURI}#${name}` : name
}

function enrichDeclarations(
  declarations: Object | any,
  input: string,
  pkgVersionURI?: string
) {
  const matches = Array.from(input.matchAll(DECLARATION_REGEX))
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]
    const declarationPath = formatDeclarationPath(name, pkgVersionURI)

    if (!declarations[declarationPath]) {
      error(`Declaration ${declarationPath} not found`)
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
  pkgVersionURI?: string,
  formatForTable?: boolean
): string {
  const matches = Array.from(input.matchAll(DECLARATION_REGEX))
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]
    let declarationPath = formatDeclarationPath(name, pkgVersionURI)
    const declaration = declarations[declarationPath]
    if (declaration?.pkgVersionURI) {
      declarationPath = formatDeclarationPath(name, declaration.pkgVersionURI)
    }
    const decError = !declaration && `style="color: red"`
    decError && error(`Declaration ${name} not found`)

    const decTooltip = !decError
      ? `data-tooltip="${enrichDeclarations(
          declarations,
          declaration.value,
          pkgVersionURI || declaration?.pkgVersionURI
        )}"`
      : `data-tooltip="Declaration ${name} not found"`

    const declarationHref =
      formatForTable &&
      (declarationPath.match(URL_REGEX) ||
        declarationPath.startsWith('ipfs://'))
        ? `#LinkedMD-URI=${declarationPath}`
        : `#Declaration/${declarationPath}`

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `<a href="${declarationHref}" class="LM-dec" ${decTooltip} ${decError}>${name}</a>`
    )
  }
  return newContents
}

function addDeclarationsTable(
  declarations: Object | any,
  contents: string
): string {
  let declarationMap: any = ''
  Object.keys(declarations).map((key) => {
    if (declarations[key].remoteScope) return

    console.log(declarations[key])

    declarationMap += `<tr id="Declaration/${formatDeclarationPath(
      key,
      declarations[key].pkgVersionURI
    )}"><td>${key}</td><td>${formatDeclarations(
      declarations,
      formatValue(declarations[key].value).toString(),
      declarations[key].pkgVersionURI,
      true
    )}</td></tr>`
  })
  declarationMap = `<table id="LinkedMarkdown-Declarations">${declarationMap}</table>`
  let newContents = formatDeclarations(declarations, contents)
  return `${declarationMap}${newContents}`
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
    imports: parseImports(splitFile[0]),
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
    console.log(this.data.declarations)
    return marked.parse(
      addDeclarationsTable(this.data.declarations, this.data.contents)
    )
  }
}
