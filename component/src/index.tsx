import React, { useState, useEffect } from 'react'
import { LinkedMarkdown } from '@linkedmd/parser'
import './styles.css'

const IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs'

const fetchAndParse = async (fileURI: string) => {
  const ipfsURI = fileURI.startsWith('ipfs://')
    ? `${IPFS_GATEWAY}/${fileURI.split('ipfs://')[1]}`
    : false
  const data = await fetch(ipfsURI ? ipfsURI : fileURI)
  const file = await data.text()
  const parser = new LinkedMarkdown(file)
  await parser.parse()
  return { file, parser }
}

const getUrlParams = (search: string) => {
  let hashes = search.slice(search.indexOf('#') + 1).split('&')
  return hashes.reduce((params, hash) => {
    let [key, val] = hash.split('=')
    return Object.assign(params, { [key]: decodeURIComponent(val) })
  }, {})
}

type FileURICallback = (newFileURI: string) => any

interface Props {
  fileURI: string
  onFileURIChange?: FileURICallback
}

export const LinkedMarkdownViewer = ({ fileURI, onFileURIChange }: Props) => {
  const [fileStack, setFileStack] = useState<string[]>([])
  const [output, setOutput] = useState('')

  const fetchAndSet = (newFileURI: string) => {
    fetchAndParse(newFileURI).then(({ parser }: { parser: any }) => {
      setFileStack(fileStack.concat([newFileURI]))
      setOutput(parser.toHTML() || '')
      console.log(newFileURI)
      onFileURIChange && onFileURIChange(newFileURI)
    })
  }

  useEffect(() => {
    fetchAndSet(fileURI)
  }, [])

  window.addEventListener('hashchange', () => {
    const params = getUrlParams(window.location.hash)
    const newFileURI = params['LinkedMD-URI']
    newFileURI && fetchAndSet(newFileURI)
  })

  return (
    <div className="LM-output" dangerouslySetInnerHTML={{ __html: output }} />
  )
}

export const LinkedMarkdownEditor = ({ fileURI }: Props) => {
  const [input, setInput] = useState<string>('')
  const [output, setOutput] = useState('')

  const fetchAndSet = (newFileURI: string) => {
    fetchAndParse(newFileURI).then(
      ({ file, parser }: { file: string; parser: any }) => {
        setInput(file || '')
        setOutput(parser.toHTML() || '')
        !!file && localStorage.setItem('saved-input', file)
      }
    )
  }

  useEffect(() => {
    fetchAndSet(fileURI)
  }, [fileURI])

  useEffect(() => {
    const parser = new LinkedMarkdown(input)
    parser.parse().then(() => {
      setOutput(parser.toHTML())
    })
    input !== '' && localStorage.setItem('saved-input', input)
  }, [input])

  useEffect(() => {
    fetchAndSet(fileURI)
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
