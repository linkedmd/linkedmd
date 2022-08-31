import React, { useState, useEffect } from 'react'
import { LinkedMarkdown } from '@linkedmd/parser'
import './styles.css'

interface Props {
  fileUrl: string
}

const fetchAndParse = async (fileUrl: string) => {
  const data = await fetch(fileUrl)
  const file = await data.text()
  const parser = new LinkedMarkdown(file)
  await parser.parse()
  return { file, parser }
}

export const LinkedMarkdownViewer = ({ fileUrl }: Props) => {
  const [fileStack, setFileStack] = useState<string[]>([])
  const [output, setOutput] = useState('')

  useEffect(() => {
    fetchAndParse(fileUrl).then(({ parser }: { parser: any }) => {
      setFileStack(fileStack.concat([fileUrl]))
      setOutput(parser.toHTML() || '')
    })
  }, [])

  return (
    <div className="LM-output" dangerouslySetInnerHTML={{ __html: output }} />
  )
}

export const LinkedMarkdownEditor = ({ fileUrl }: Props) => {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState('')

  useEffect(() => {
    fetchAndParse(fileUrl).then(
      ({ file, parser }: { file: string; parser: any }) => {
        setInput(file || '')
        setOutput(parser.toHTML() || '')
        !!file && localStorage.setItem('saved-input', file)
      }
    )
  }, [])

  useEffect(() => {
    const parser = new LinkedMarkdown(input)
    parser.parse().then(() => {
      setOutput(parser.toHTML())
    })
    input !== '' && localStorage.setItem('saved-input', input)
  }, [input])

  useEffect(() => {
    const savedInput = localStorage.getItem('saved-input')
    !!savedInput && setInput(savedInput || '')
  }, [])

  const handleInput = (e: React.SyntheticEvent) => {
    const target = e.target as typeof e.target & {
      value: string
    }

    setInput(target.value)
  }

  return (
    <div className="LM-split-screen">
      <textarea className="LM-input" onChange={handleInput} value={input} />
      <div className="LM-output" dangerouslySetInnerHTML={{ __html: output }} />
    </div>
  )
}
