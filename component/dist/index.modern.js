import React, { useState, useEffect } from 'react';
import { LinkedMarkdown } from '@linkedmd/parser';

const IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs';

const fetchAndParse = async fileURI => {
  const ipfsURI = fileURI.startsWith('ipfs://') ? `${IPFS_GATEWAY}/${fileURI.split('ipfs://')[1]}` : false;
  const data = await fetch(ipfsURI ? ipfsURI : fileURI);
  const file = await data.text();
  const parser = new LinkedMarkdown(file);
  await parser.parse();
  return {
    file,
    parser
  };
};

const LinkedMarkdownViewer = ({
  fileURI,
  onFileURIChange
}) => {
  const [fileStack, setFileStack] = useState([]);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAndSet = async (newFileURI, addToStack) => {
    setLoading(true);
    const {
      parser
    } = await fetchAndParse(newFileURI);
    setOutput(parser.toHTML() || '');
    addToStack && setFileStack(fileStack => [...fileStack, newFileURI]);
    onFileURIChange && onFileURIChange(newFileURI);
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSet(fileURI, true);
    window.addEventListener('message', event => {
      if (event.origin !== window.location.origin) return;

      try {
        const newFileURI = JSON.parse(unescape(event.data)).lmURI;
        console.log(newFileURI);
        fetchAndSet(newFileURI, true);
      } catch (e) {}
    }, false);
  }, []);

  async function goBack() {
    await fetchAndSet(fileStack[fileStack.length - 2], false);
    setFileStack(fileStack.slice(0, -1));
  }

  return React.createElement("div", null, fileStack.length > 1 && React.createElement("a", {
    onClick: goBack,
    style: {
      cursor: 'pointer'
    }
  }, "\u2190 Back"), loading && fileStack.length > 1 && ' | ', loading && React.createElement("span", null, "Loading"), React.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  }));
};
const LinkedMarkdownEditor = ({
  fileURI
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const fetchAndSet = newFileURI => {
    fetchAndParse(newFileURI).then(({
      file,
      parser
    }) => {
      setInput(file || '');
      setOutput(parser.toHTML() || '');
      !!file && localStorage.setItem('saved-input', file);
    });
  };

  useEffect(() => {
    fetchAndSet(fileURI);
  }, [fileURI]);
  useEffect(() => {
    const parser = new LinkedMarkdown(input);
    parser.parse().then(() => {
      setOutput(parser.toHTML());
    });
    input !== '' && localStorage.setItem('saved-input', input);
  }, [input]);
  useEffect(() => {
    fetchAndSet(fileURI);
    const savedInput = localStorage.getItem('saved-input');
    !!savedInput && setInput(savedInput || '');
  }, []);

  const handleInput = e => {
    const target = e.target;
    setInput(target.value);
  };

  return React.createElement("div", {
    className: "LM-split-screen"
  }, React.createElement("textarea", {
    className: "LM-input",
    onChange: handleInput,
    value: input
  }), React.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  }));
};

export { LinkedMarkdownEditor, LinkedMarkdownViewer };
//# sourceMappingURL=index.modern.js.map
