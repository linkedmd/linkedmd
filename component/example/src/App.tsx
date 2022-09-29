import React, { useState } from 'react'
import { marked } from 'marked'
import {
  LinkedMarkdownViewer,
  LinkedMarkdownEditor,
} from '@linkedmd/components'
import './index.css'
import '@linkedmd/components/dist/index.css'

const App = () => {
  const startFileURI =
    'http://localhost:8000/examples/DomainAgreement.linked.md'
  const [edit, setEdit] = useState(false)
  const [fileURI, setFileURI] = useState(startFileURI)

  function getMarkdownText() {
    const rawMarkup = marked.parse(`

# Linked Markdown

Linked Markdown is a superset of [Markdown](https://daringfireball.net/projects/markdown/syntax) that provides support for declaring variables, referencing them and importing them from remote sources.

This is an example Linked Markdown document:


A Linked Markdown document has 3 sections:

- A first section with the data it imports, using [ES6 imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).
- A second section declaring the variables that the rest of the document will consume, using [YAML](https://yaml.org).
- A third section with its content, in Markdown.

## Uses

The main intended use is writing legal agreements and law. Linked Markdown provides powerful features for such a use case, because it allows to:

- Import data and definitions from other documents, reducing the need to repeat a definition and the risk of omitting it, which in turn increases precision of language.
- Quickly create sound agreements by importing existing definitions from other documents. An open-source approach to law.
  - There's a [work in progress repository for Linked Markdown documents](https://repo.linked.md)
- Clearly define data at the beginning of a document, avoiding subjective definitions and loose ends.
- Reference such data in the document and know at a glance the value of the references.

This below is a Linked Markdown document, go play with it!
      `)
    return { __html: rawMarkup }
  }

  return (
    <>
      <div style={{ maxWidth: '768px', margin: 'auto' }}>
        <h1>⍈</h1>
        <div dangerouslySetInnerHTML={getMarkdownText()}></div>
      </div>
      <h3 style={{ textAlign: 'center' }}>
        <a
          onClick={() => {
            setEdit(false)
          }}
          style={{ cursor: 'pointer' }}
        >
          View
        </a>{' '}
        |{' '}
        <a
          onClick={() => {
            setEdit(true)
          }}
          style={{ cursor: 'pointer' }}
        >
          Edit
        </a>
      </h3>
      {edit ? (
        <div style={{ maxWidth: '1280px', margin: 'auto' }}>
          <LinkedMarkdownEditor fileURI={startFileURI} />
        </div>
      ) : (
        <div style={{ maxWidth: '768px', margin: 'auto' }}>
          <LinkedMarkdownViewer
            fileURI={fileURI}
            onFileURIChange={(newFileURI) => {
              console.log(newFileURI)
              setFileURI(newFileURI)
            }}
          />
        </div>
      )}
    </>
  )
}

export default App
