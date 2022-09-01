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
const IPFS_GATEWAY = 'ipfs.nftstorage.link'

type LinkedMarkdownFile = {
  imports: Array<Import> | []
  declarations: {
    imported: Object | any
    local: Object | any
    all: Object | any
  }
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

type Declarations = {
  [name: string]: Declaration
}

function error(message: string) {
  console.error(`LinkedMarkdown compiler: ${message}`)
}

async function fetchPackageVersion(uri: string): Promise<string> {
  const parsedURI = new URL(uri)
  uri =
    parsedURI.protocol === 'ipfs:'
      ? `https://${parsedURI.pathname.slice(2)}.${IPFS_GATEWAY}`
      : uri

  try {
    const req = await fetch(uri)
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
        if (!(namedImport.name in importedFile.data.declarations.all)) {
          error(
            `Cannot find ${namedImport.value} in ${unresolvedImport.fromModule}`
          )
          return
        }
        console.log(namedImport.value)
        // @ts-ignore
        importedDeclarations[namedImport.value] = {
          value: importedFile.data.declarations.all[namedImport.name].value,
          pkgVersionURI: unresolvedImport.fromModule,
        }
      })
      Object.keys(importedFile.data.declarations.all).map((name) => {
        // @ts-ignore
        importedDeclarations[`${unresolvedImport.fromModule}#${name}`] = {
          value: importedFile.data.declarations.all[name].value,
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

const LMLinkAction = ({ uri }: { uri: string }) =>
  `onClick="window.postMessage('${escape(
    JSON.stringify({
      lmURI: uri,
    })
  )}')"`

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

    const action =
      formatForTable &&
      (declarationPath.match(URL_REGEX) ||
        declarationPath.startsWith('ipfs://'))
        ? LMLinkAction({
            uri: declarationPath,
          })
        : `href="#Declaration/${declarationPath}"`

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `<a ${action} style="cursor: pointer" class="LM-dec" ${decTooltip} ${decError}>${name}</a>`
    )
  }
  return newContents
}

function createDeclarationsTable(
  name: string,
  declarations: Object | any,
  linkDeclarations?: boolean
) {
  let declarationTable: any = ''
  Object.keys(declarations).map((key) => {
    if (declarations[key].remoteScope) return

    declarationTable += `<tr id="Declaration/${formatDeclarationPath(
      key,
      declarations[key].pkgVersionURI
    )}"><td>${
      !linkDeclarations
        ? key
        : `<a style="cursor: pointer" ${LMLinkAction({
            uri: `${declarations[key].pkgVersionURI}#${key}`,
          })}>${key}</a>`
    }</td><td>${formatDeclarations(
      declarations,
      formatValue(declarations[key].value).toString(),
      declarations[key].pkgVersionURI,
      true
    )}</td></tr>`
  })
  return `<h4>${name} declarations</h4><table class="LM-table">
  ${declarationTable}</table>`
}

function addDeclarationsTables(
  declarations: Object | any,
  contents: string
): string {
  return `${
    Object.keys(declarations.imported).length > 0
      ? createDeclarationsTable('Imported', declarations.imported, true)
      : ''
  }${
    Object.keys(declarations.local).length > 0
      ? createDeclarationsTable('Local', declarations.local)
      : ''
  }${formatDeclarations(declarations.all, contents)}`
}

async function parse(file: string): Promise<LinkedMarkdownFile> {
  const splitFile = file.split(FILE_PART_DELIMITER)
  if (splitFile.length !== 3) {
    error("File doesn't have the required three sections")
    return {
      imports: [],
      declarations: { imported: [], local: [], all: [] },
      contents: '',
    }
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
    declarations: {
      imported: importedDeclarations,
      local: localDeclarations,
      all: declarations,
    },
    contents: splitFile[2],
  }
  return parsedFile
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
    return marked.parse(
      addDeclarationsTables(this.data.declarations, this.data.contents)
    )
  }
}
