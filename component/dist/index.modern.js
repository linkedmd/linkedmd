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

const getUrlParams = search => {
  let hashes = search.slice(search.indexOf('#') + 1).split('&');
  return hashes.reduce((params, hash) => {
    let [key, val] = hash.split('=');
    return Object.assign(params, {
      [key]: decodeURIComponent(val)
    });
  }, {});
};

const LinkedMarkdownViewer = ({
  fileURI,
  onFileURIChange
}) => {
  const [fileStack, setFileStack] = useState([]);
  const [output, setOutput] = useState('');

  const fetchAndSet = newFileURI => {
    fetchAndParse(newFileURI).then(({
      parser
    }) => {
      setFileStack(fileStack.concat([newFileURI]));
      setOutput(parser.toHTML() || '');
      console.log(newFileURI);
      onFileURIChange && onFileURIChange(newFileURI);
    });
  };

  useEffect(() => {
    fetchAndSet(fileURI);
  }, []);
  window.addEventListener('hashchange', () => {
    const params = getUrlParams(window.location.hash);
    const newFileURI = params['LinkedMD-URI'];
    newFileURI && fetchAndSet(newFileURI);
  });
  return React.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  });
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
