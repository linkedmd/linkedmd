import React, { useState } from 'react'
import { LinkedMarkdownViewer, LinkedMarkdownEditor } from '@linkedmd/component'
import './index.css'
import '@linkedmd/component/dist/index.css'

const App = () => {
  const [edit, setEdit] = useState(false)
  const [fileURI, setFileURI] = useState(
    'https://raw.githubusercontent.com/nation3/linked-md/main/examples/DomainEscrow.linked.md'
  )

  console.log(fileURI)

  return (
    <>
      <h3 style={{ textAlign: 'center' }}>
        <a
          onClick={() => {
            setEdit(false)
          }}
          style={{ cursor: 'pointer' }}
        >
          Viewer
        </a>{' '}
        |{' '}
        <a
          onClick={() => {
            setEdit(true)
          }}
          style={{ cursor: 'pointer' }}
        >
          Editor
        </a>
      </h3>
      {edit ? (
        <div style={{ maxWidth: '1280px', margin: 'auto' }}>
          <LinkedMarkdownEditor fileURI={fileURI} />
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
