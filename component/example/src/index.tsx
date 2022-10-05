import './index.css'

import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if (!('process' in window)) {
  // @ts-ignore
  window.process = {}
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
