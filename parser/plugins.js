// Must-have plugins
import MarkdownItCollapsible from 'markdown-it-collapsible'
import MarkdownItDefList from 'markdown-it-deflist'
import MarkdownItAbbr from '@linkedmd/markdown-it-abbr'
import MarkdownItAttrs from 'markdown-it-attrs'
import MarkdownItDirective from '@linkedmd/markdown-it-directive'

// Nice-to-have plugins
import { markdownItFancyListPlugin } from 'markdown-it-fancy-lists'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItTOC from 'markdown-it-toc-done-right'

export default [
  [MarkdownItCollapsible],
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
        placement: 'after',
      }),
      level: 2,
    },
  ],
  [MarkdownItTOC, { level: 2 }],
]
