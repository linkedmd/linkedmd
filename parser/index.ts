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
  definitions: {
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

type Definition = {
  value: string
  pkgVersionURI?: string
  remoteScope?: boolean
}

type Definitions = {
  [name: string]: Definition
}

function error(message: string) {
  console.error(`LinkedMarkdown compiler: ${message}`)
}

async function fetchPackageVersion(uri: string): Promise<string> {
  const parsedURI = new URL(uri)

  // Blink, Gecko and WebKit parse URLs differently
  let fetchURI = uri

  if (parsedURI.protocol === 'ipfs:') {
    const cid =
      parsedURI.hostname !== ''
        ? parsedURI.hostname
        : parsedURI.pathname.slice(2)
    fetchURI = `https://${cid}.${IPFS_GATEWAY}`
  }

  try {
    const req = await fetch(fetchURI)
    const file = await req.text()
    return file
  } catch (e) {
    error(`Fetching package version was impossible (URI ${uri})`)
    return ''
  }
}

async function resolveImports(code: string): Promise<any> {
  const imports = parseImports(code)
  const importedDefinitions = {}
  await Promise.all(
    imports.map(async (unresolvedImport: Import) => {
      const file = await fetchPackageVersion(unresolvedImport.fromModule)
      const importedFile = new LinkedMarkdown(file)
      await importedFile.parse()
      unresolvedImport.namedImports?.map((namedImport: any) => {
        if (!(namedImport.name in importedFile.data.definitions.all)) {
          error(
            `Cannot find ${namedImport.value} in ${unresolvedImport.fromModule}`
          )
          return
        }
        // @ts-ignore
        importedDefinitions[namedImport.value] = {
          value: importedFile.data.definitions.all[namedImport.name].value,
          pkgVersionURI: unresolvedImport.fromModule,
        }
      })
      Object.keys(importedFile.data.definitions.all).map((name) => {
        // @ts-ignore
        importedDefinitions[`${unresolvedImport.fromModule}#${name}`] = {
          value: importedFile.data.definitions.all[name].value,
          pkgVersionURI: unresolvedImport.fromModule,
          remoteScope: true,
        }
      })
    })
  )
  return importedDefinitions
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

function formatDefinitionPath(name: string, pkgVersionURI?: string) {
  return pkgVersionURI ? `${pkgVersionURI}#${name}` : name
}

function discoverDefinition(
  definitions: Object | any,
  name: string,
  pkgVersionURI?: string
) {
  let definitionPath = formatDefinitionPath(name, pkgVersionURI)
  let definition = definitions[definitionPath]

  if (definition?.pkgVersionURI) {
    definitionPath = formatDefinitionPath(name, definition.pkgVersionURI)
    definition = definitions[definitionPath]
  }

  return { definition, definitionPath }
}

function enrichDefinitions(
  definitions: Object | any,
  input: string,
  pkgVersionURI?: string
) {
  const matches = Array.from(input.matchAll(DECLARATION_REGEX))
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]

    let { definition, definitionPath } = discoverDefinition(
      definitions,
      name,
      pkgVersionURI
    )

    if (!definitions[definitionPath]) {
      error(`Definition ${definitionPath} not found`)
      continue
    }

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `${name} (${enrichDefinitions(
        definitions,
        definitions[definitionPath].value,
        pkgVersionURI || definition?.pkgVersionURI
      )})`
    )
  }
  return newContents
}

function formatDefinitions(
  definitions: Object | any,
  input: string,
  pkgVersionURI?: string,
  formatForTable?: boolean
): string {
  const matches = Array.from(input.matchAll(DECLARATION_REGEX))
  let newContents = input
  for (const decl of matches) {
    const name = decl[1]
    let { definition, definitionPath } = discoverDefinition(
      definitions,
      name,
      pkgVersionURI
    )

    const decError = !definition && `style="color: red"`
    decError && error(`Definition ${name} not found`)

    const decTooltip = !decError
      ? `data-tooltip="${enrichDefinitions(
          definitions,
          definition.value,
          pkgVersionURI || definition?.pkgVersionURI
        )}"`
      : `data-tooltip="Definition ${name} not found"`

    const action =
      formatForTable &&
      (definitionPath.match(URL_REGEX) || definitionPath.startsWith('ipfs://'))
        ? LMLinkAction({
            uri: definitionPath,
          })
        : `href="#Definition/${definitionPath}"`

    newContents = newContents.replaceAll(
      `[[${name}]]`,
      `<a ${action} style="cursor: pointer" class="LM-dec" ${decTooltip} ${decError}>${name}</a>`
    )
  }
  return newContents
}

function createDefinitionsTable(
  name: string,
  definitions: Object | any,
  linkDefinitions?: boolean
) {
  let definitionTable: any = ''
  Object.keys(definitions).map((key) => {
    if (definitions[key].remoteScope || key === 'LinkedMarkdown') return

    definitionTable += `<tr id="Definition/${formatDefinitionPath(
      key,
      definitions[key].pkgVersionURI
    )}"><td>${
      !linkDefinitions
        ? key
        : `<a style="cursor: pointer" ${LMLinkAction({
            uri: `${definitions[key].pkgVersionURI}#${key}`,
          })}>${key}</a>`
    }</td><td>${formatDefinitions(
      definitions,
      formatValue(definitions[key].value).toString(),
      definitions[key].pkgVersionURI,
      true
    )}</td></tr>`
  })
  return `<h4>${name} definitions</h4><table class="LM-table">
  ${definitionTable}</table>`
}

function wrap(definitions: Object | any, contents: string): string {
  return `${
    Object.keys(definitions.imported).length > 0
      ? createDefinitionsTable('Imported', definitions.imported, true)
      : ''
  }${
    Object.keys(definitions.local).length > 0
      ? createDefinitionsTable('Local', definitions.local)
      : ''
  }${formatDefinitions(definitions.all, contents)}`
}

async function parse(file: string): Promise<LinkedMarkdownFile> {
  const splitFile = file.split(FILE_PART_DELIMITER)
  if (splitFile.length !== 3) {
    error("File doesn't have the required three sections")
    return {
      imports: [],
      definitions: { imported: [], local: [], all: [] },
      contents: '',
    }
  }
  const importedDefinitions = await resolveImports(splitFile[0])
  const rawLocalDefinitions: any = yaml.load(splitFile[1])
  const localDefinitions: Definitions = {}
  Object.keys(rawLocalDefinitions).map((name: string) => {
    localDefinitions[name] = { value: rawLocalDefinitions[name] }
  })
  const definitions = Object.assign(localDefinitions, importedDefinitions)
  const parsedFile: LinkedMarkdownFile = {
    imports: parseImports(splitFile[0]),
    definitions: {
      imported: importedDefinitions,
      local: localDefinitions,
      all: definitions,
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
    return marked.parse(wrap(this.data.definitions, this.data.contents))
  }
}
