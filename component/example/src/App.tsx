import React from 'react'

import { LinkedMarkdownViewer, LinkedMarkdownEditor } from '@linkedmd/component'
import '@linkedmd/component/dist/index.css'

const App = () => {
  return (
    <>
      <h3 style={{textAlign: 'center'}}>Viewer</h3>
      <div style={{maxWidth: '768px', margin: 'auto'}}>
        <LinkedMarkdownViewer fileUrl="https://bafkreif3ki3rqeuyykthcfpxc5cif2oeu3nrk3ijb35ta6ebk342t3yn3y.ipfs.nftstorage.link/" />
      </div>
      <h3 style={{textAlign: 'center'}}>Editor</h3>
      <div style={{maxWidth: '1280px', margin: 'auto'}}>
        <LinkedMarkdownEditor fileUrl="https://bafkreif3ki3rqeuyykthcfpxc5cif2oeu3nrk3ijb35ta6ebk342t3yn3y.ipfs.nftstorage.link/" />
      </div>
    </>
  )
}

export default App
