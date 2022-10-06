const VARIABLE_REGEX = /\[%(.*?)\]/g
const IPFS_GATEWAY = 'ipfs.nftstorage.link'
const CSS = '<style>dt:target a { outline: 2px solid yellow }</style>'

import fetch from 'cross-fetch'
import MarkdownIt from 'markdown-it'
// @ts-ignore
import MarkdownItDefList from 'markdown-it-deflist'
// @ts-ignore
import MarkdownItAbbr from '@linkedmd/markdown-it-abbr'
import MarkdownItAttrs from 'markdown-it-attrs'
// @ts-ignore
import MarkdownItDirective from '@linkedmd/markdown-it-directive'
import { markdownItFancyListPlugin } from 'markdown-it-fancy-lists'

const arrayToObject = (array: Array<any>, key: string): any => {
  const initialValue = {}
  return array.reduce(
    (obj: Object, item: any) => ({ ...obj, [item[key]]: item }),
    initialValue
  )
}

const replaceVariables = (text: string, definitions: any): string => {
  if (!text) return ''
  for (const match of text?.matchAll(VARIABLE_REGEX)) {
    if (!definitions[match[1]]) continue
    text = text.replaceAll(match[0], definitions[match[1]])
  }
  return text
}

async function fetchPackageVersion(uri: string): Promise<string> {
  const parsedURI = new URL(uri)
  if (parsedURI.protocol === 'ipfs:') {
    // Blink, Gecko and WebKit parse URLs differently
    const cid =
      parsedURI.hostname !== ''
        ? parsedURI.hostname
        : parsedURI.pathname.slice(2)
    uri = `https://${cid}.${IPFS_GATEWAY}`
  }

  try {
    return (await fetch(uri)).text()
  } catch (e) {
    Error(`Fetching package version was impossible (URI ${uri})`)
    return ''
  }
}

type Import = {
  default?: string
  named?: Array<{
    localName: string
    remoteName: string
  }>
  from: string
  lm: LinkedMarkdown | any
}

type Definitions = {
  [name: string]: string
}

type RemoteDefinitions = {
  [name: string]: { value: string; from: string }
}

export class LinkedMarkdown {
  input: string
  imports: Import[]
  definitions: Definitions
  remoteDefinitions: RemoteDefinitions

  constructor(input: string) {
    this.input = input
    this.imports = [] as Import[]
    this.definitions = {}
    this.remoteDefinitions = {} as RemoteDefinitions
  }

  async parse() {
    // Parses definitions into [{ key, value }]
    let definitionsArray = this.input
      .split('---')[0]
      .split('\n\n')
      .map((definitionBlock) => {
        let [name, value] = definitionBlock.split('\n: ')
        return { name, value }
      })
      .filter(({ name, value }) => name && value)

    // Parses imports (with nested parsing)
    this.imports = await Promise.all(
      definitionsArray.map(async ({ name, value }) => {
        if (!value.startsWith('Import ')) return
        let importObj: any = {}
        if (value.startsWith('Import definitions ')) {
          let named = name.split(', ').map((nameBlock) => {
            const names = nameBlock.split(' as ')
            return {
              localName: names[1] || nameBlock,
              remoteName: names[0] || nameBlock,
            }
          })
          importObj = {
            named,
            from: value.replace('Import definitions ', ''),
          }
        } else if (value.startsWith('Import ')) {
          importObj = {
            default: name,
            from: value.replace('Import ', ''),
          }
        }
        const file = await fetchPackageVersion(importObj.from)
        importObj.lm = new LinkedMarkdown(file)
        await importObj.lm.parse()
        return importObj
      })
    )

    // Filters out undefined imports
    this.imports = this.imports.filter((imports) => imports)

    // Converts array to object
    definitionsArray
      .filter(({ value }) => !value.startsWith('Import '))
      .map(({ name, value }) => (this.definitions[name] = value))

    // Takes imported definitions locally and saves remote ones too
    this.imports.map((importObj: Import) => {
      if (!importObj.named) return
      importObj.named.map((namedImport: any) => {
        this.definitions[namedImport.localName] =
          importObj.lm.definitions[namedImport.remoteName]
      })
      Object.keys(importObj.lm.definitions).map((key: string) => {
        this.remoteDefinitions[key] = {
          value: importObj.lm.definitions[key],
          from: importObj.from,
        }
      })
    })

    // Substitutes variables with their value
    Object.keys(this.definitions).map((name: any) => {
      this.definitions[name] = replaceVariables(
        this.definitions[name],
        this.definitions
      )
    })
  }

  toMarkdown(overrideDefinitions?: Definitions) {
    if (overrideDefinitions) {
      this.definitions = Object.assign(this.definitions, overrideDefinitions)
    }

    let defList = ''
    let abbrList = ''
    Object.keys(this.definitions).map((name) => {
      defList += `${name} {#${encodeURI(name)}}\n: ${
        this.definitions[name]
      }\n\n`
      abbrList += `*[${name}]: ${this.definitions[name]}\n`
    })
    Object.keys(this.remoteDefinitions).map((name) => {
      abbrList += `*[${name}]: ${this.remoteDefinitions[name].value} | ${this.remoteDefinitions[name].from}\n`
    })
    defList += '---\n'

    const content = replaceVariables(
      this.input.split('---')[1],
      this.definitions
    )

    if (overrideDefinitions && overrideDefinitions['Definitions'] !== 'true')
      defList = ''

    return defList + abbrList + content
  }

  toHTML(overrideDefinitions?: Definitions) {
    const md = new MarkdownIt({
      html: false,
      xhtmlOut: false,
      linkify: true,
      typographer: true,
      quotes: '“”‘’',
    })
    md.use(MarkdownItDefList)
      .use(MarkdownItAbbr)
      .use(MarkdownItAttrs)
      .use(MarkdownItDirective)
      // @ts-ignore
      .use(markdownItFancyListPlugin)
      .use((md: any) => {
        md.inlineDirectives['include'] = (
          state: any,
          content: any,
          dests: any,
          attrs: any
        ) => {
          const token = state.push('html_inline', '', 0)
          token.content = arrayToObject(this.imports, 'default')[
            content
          ].lm.toHTML(attrs)
        }
      })
    return CSS + md.render(this.toMarkdown(overrideDefinitions))
  }
}
