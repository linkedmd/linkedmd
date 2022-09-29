var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const VARIABLE_REGEX = /\[%(.*?)\]/g;
const IPFS_GATEWAY = 'ipfs.nftstorage.link';
const BASIC_CSS = '<meta charset="UTF-8"><style> @import "https://unpkg.com/style.css/style.css"; @import "https://unpkg.com/css-tooltip"; dt:target a { outline: 2px solid yellow }</style>';
import fetch from 'cross-fetch';
import MarkdownIt from 'markdown-it';
// @ts-ignore
import MarkdownItDefList from 'markdown-it-deflist';
// @ts-ignore
import MarkdownItAbbr from 'markdown-it-abbr';
import MarkdownItAttrs from 'markdown-it-attrs';
// @ts-ignore
import MarkdownItDirective from 'markdown-it-directive';
import { markdownItFancyListPlugin } from 'markdown-it-fancy-lists';
const arrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => (Object.assign(Object.assign({}, obj), { [item[key]]: item })), initialValue);
};
const replaceVariables = (text, definitions) => {
    if (!text)
        return '';
    for (const match of text === null || text === void 0 ? void 0 : text.matchAll(VARIABLE_REGEX)) {
        if (!definitions[match[1]])
            continue;
        text = text.replaceAll(match[0], definitions[match[1]]);
    }
    return text;
};
function fetchPackageVersion(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedURI = new URL(uri);
        if (parsedURI.protocol === 'ipfs:') {
            // Blink, Gecko and WebKit parse URLs differently
            const cid = parsedURI.hostname !== ''
                ? parsedURI.hostname
                : parsedURI.pathname.slice(2);
            uri = `https://${cid}.${IPFS_GATEWAY}`;
        }
        try {
            return (yield fetch(uri)).text();
        }
        catch (e) {
            Error(`Fetching package version was impossible (URI ${uri})`);
            return '';
        }
    });
}
export class LinkedMarkdown {
    constructor(input) {
        this.input = input;
        this.imports = [];
        this.definitions = {};
        this.remoteDefinitions = {};
    }
    parse() {
        return __awaiter(this, void 0, void 0, function* () {
            // Parses definitions into [{ key, value }]
            let definitionsArray = this.input
                .split('---')[0]
                .split('\n\n')
                .map((definitionBlock) => {
                let [name, value] = definitionBlock.split('\n: ');
                return { name, value };
            })
                .filter(({ name, value }) => name && value);
            // Parses imports (with nested parsing)
            this.imports = yield Promise.all(definitionsArray.map(({ name, value }) => __awaiter(this, void 0, void 0, function* () {
                if (!value.startsWith('Import '))
                    return;
                let importObj = {};
                if (value.startsWith('Import definitions ')) {
                    let named = name.split(', ').map((nameBlock) => {
                        const names = nameBlock.split(' as ');
                        return {
                            localName: names[1] || nameBlock,
                            remoteName: names[0] || nameBlock,
                        };
                    });
                    importObj = {
                        named,
                        from: value.replace('Import definitions ', ''),
                    };
                }
                else if (value.startsWith('Import ')) {
                    importObj = {
                        default: name,
                        from: value.replace('Import ', ''),
                    };
                }
                const file = yield fetchPackageVersion(importObj.from);
                importObj.lm = new LinkedMarkdown(file);
                yield importObj.lm.parse();
                return importObj;
            })));
            // Filters out undefined imports
            this.imports = this.imports.filter((imports) => imports);
            // Converts array to object
            definitionsArray
                .filter(({ value }) => !value.startsWith('Import '))
                .map(({ name, value }) => (this.definitions[name] = value));
            // Takes imported definitions locally and saves remote ones too
            this.imports.map((importObj) => {
                if (!importObj.named)
                    return;
                importObj.named.map((namedImport) => {
                    this.definitions[namedImport.localName] =
                        importObj.lm.definitions[namedImport.remoteName];
                });
                Object.keys(importObj.lm.definitions).map((key) => {
                    this.remoteDefinitions[key] = {
                        value: importObj.lm.definitions[key],
                        from: importObj.from,
                    };
                });
            });
            // Substitutes variables with their value
            Object.keys(this.definitions).map((name) => {
                this.definitions[name] = replaceVariables(this.definitions[name], this.definitions);
            });
        });
    }
    toMarkdown(overrideDefinitions) {
        if (overrideDefinitions) {
            this.definitions = Object.assign(this.definitions, overrideDefinitions);
        }
        let defList = '';
        let abbrList = '';
        Object.keys(this.definitions).map((name) => {
            defList += `${name} {#${encodeURI(name)}}\n: ${this.definitions[name]}\n\n`;
            abbrList += `*[${name}]: ${this.definitions[name]}\n`;
        });
        Object.keys(this.remoteDefinitions).map((name) => {
            abbrList += `*[${name}]: ${this.remoteDefinitions[name].value} | ${this.remoteDefinitions[name].from}\n`;
        });
        defList += '---\n';
        const content = replaceVariables(this.input.split('---')[1], this.definitions);
        if (overrideDefinitions && overrideDefinitions['Definitions'] !== 'true')
            defList = '';
        return defList + abbrList + content;
    }
    toHTML(overrideDefinitions) {
        const md = new MarkdownIt({
            html: false,
            xhtmlOut: false,
            linkify: true,
            typographer: true,
            quotes: '“”‘’',
        });
        md.use(MarkdownItDefList)
            .use(MarkdownItAbbr)
            .use(MarkdownItAttrs)
            .use(MarkdownItDirective)
            // @ts-ignore
            .use(markdownItFancyListPlugin)
            .use((md) => {
            md.inlineDirectives['include'] = (state, content, dests, attrs) => {
                const token = state.push('html_inline', '', 0);
                token.content = arrayToObject(this.imports, 'default')[content].lm.toHTML(attrs);
            };
        });
        return BASIC_CSS + md.render(this.toMarkdown(overrideDefinitions));
    }
}
