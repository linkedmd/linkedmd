import React, { useState } from 'react'
import { LinkedMarkdownViewer, LinkedMarkdownEditor } from '@linkedmd/component'
import './index.css'
import '@linkedmd/component/dist/index.css'

const App = () => {
  const startFileURI =
    'https://raw.githubusercontent.com/nation3/linked-md/main/examples/DomainEscrow.linked.md'
  const [edit, setEdit] = useState(false)
  const [fileURI, setFileURI] = useState(startFileURI)

  return (
    <>
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
