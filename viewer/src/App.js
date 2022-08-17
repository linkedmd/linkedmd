import './App.css'
import { useState, useEffect } from 'react'
import { LinkedMarkdown } from 'linked-markdown-parser'

function App() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const parser = new LinkedMarkdown(input)
  useEffect(() => {
    parser.parse().then(() => {
      setOutput(parser.toHTML())
    })
    input !== '' && localStorage.setItem('saved-input', input)
  }, [input])

  useEffect(() => {
    const savedInput = localStorage.getItem('saved-input')
    savedInput !== '' && setInput(savedInput)
  }, [])

  const handleInput = (e) => {
    setInput(e.target.value)
  }

  return (
    <div className="App">
      <h1>
        Write and preview{' '}
        <a
          href="https://github.com/nation3/linked-markdown"
          rel="noreferrer"
          target="_blank"
        >
          Linked Markdown
        </a>
      </h1>
      <div className="split-screen">
        <textarea className="input" onChange={handleInput} value={input} />
        <div className="output" dangerouslySetInnerHTML={{ __html: output }} />
      </div>
    </div>
  )
}

export default App
