// Must-have plugins
// @ts-ignore
import MarkdownItDefList from 'markdown-it-deflist'
// @ts-ignore
import MarkdownItAbbr from '@linkedmd/markdown-it-abbr'
import MarkdownItAttrs from 'markdown-it-attrs'
// @ts-ignore
import MarkdownItDirective from '@linkedmd/markdown-it-directive'

// Nice-to-have plugins
// @ts-ignore
import { markdownItFancyListPlugin } from 'markdown-it-fancy-lists'
// @ts-ignore
import MarkdownItFootnote from 'markdown-it-footnote'
// @ts-ignore
import MarkdownItAnchor from 'markdown-it-anchor'
// @ts-ignore
import MarkdownItTOC from 'markdown-it-toc-done-right'

export default [
  [MarkdownItDefList],
  [MarkdownItAbbr],
  [MarkdownItAttrs],
  [MarkdownItDirective],
  [markdownItFancyListPlugin],
  [MarkdownItFootnote],
  [
    MarkdownItAnchor,
    {
      permalink: MarkdownItAnchor.permalink.linkInsideHeader({
        symbol: '§',
        placement: 'before',
      }),
    },
  ],
  [MarkdownItTOC],
]
