import React, { useState, useEffect } from 'react';
import { LinkedMarkdown } from '@linkedmd/parser';

var IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs';

var fetchAndParse = function fetchAndParse(fileURI) {
  try {
    var ipfsURI = fileURI.startsWith('ipfs://') ? IPFS_GATEWAY + "/" + fileURI.split('ipfs://')[1] : false;
    return Promise.resolve(fetch(ipfsURI ? ipfsURI : fileURI)).then(function (data) {
      return Promise.resolve(data.text()).then(function (file) {
        var parser = new LinkedMarkdown(file);
        return Promise.resolve(parser.parse()).then(function () {
          return {
            file: file,
            parser: parser
          };
        });
      });
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

var LinkedMarkdownViewer = function LinkedMarkdownViewer(_ref) {
  var goBack = function goBack() {
    try {
      return Promise.resolve(fetchAndSet(fileStack[fileStack.length - 2], false)).then(function () {
        setFileStack(fileStack.slice(0, -1));
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  var fileURI = _ref.fileURI,
      onFileURIChange = _ref.onFileURIChange;

  var _useState = useState([]),
      fileStack = _useState[0],
      setFileStack = _useState[1];

  var _useState2 = useState(''),
      output = _useState2[0],
      setOutput = _useState2[1];

  var _useState3 = useState(false),
      loading = _useState3[0],
      setLoading = _useState3[1];

  var fetchAndSet = function fetchAndSet(newFileURI, addToStack) {
    try {
      setLoading(true);
      return Promise.resolve(fetchAndParse(newFileURI)).then(function (_ref2) {
        var parser = _ref2.parser;
        setOutput(parser.toHTML() || '');
        addToStack && setFileStack(function (fileStack) {
          return [].concat(fileStack, [newFileURI]);
        });
        onFileURIChange && onFileURIChange(newFileURI);
        setLoading(false);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  useEffect(function () {
    fetchAndSet(fileURI, true);
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin) return;

      try {
        var newFileURI = JSON.parse(unescape(event.data)).lmURI;
        fetchAndSet(newFileURI, true);
      } catch (e) {}
    }, false);
  }, []);
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
var LinkedMarkdownEditor = function LinkedMarkdownEditor(_ref3) {
  var fileURI = _ref3.fileURI;

  var _useState4 = useState(''),
      input = _useState4[0],
      setInput = _useState4[1];

  var _useState5 = useState(''),
      output = _useState5[0],
      setOutput = _useState5[1];

  var fetchAndSet = function fetchAndSet(newFileURI) {
    fetchAndParse(newFileURI).then(function (_ref4) {
      var file = _ref4.file,
          parser = _ref4.parser;
      setInput(file || '');
      setOutput(parser.toHTML() || '');
      !!file && localStorage.setItem('saved-input', file);
    });
  };

  useEffect(function () {
    fetchAndSet(fileURI);
  }, [fileURI]);
  useEffect(function () {
    var parser = new LinkedMarkdown(input);
    parser.parse().then(function () {
      setOutput(parser.toHTML());
    });
    input !== '' && localStorage.setItem('saved-input', input);
  }, [input]);
  useEffect(function () {
    fetchAndSet(fileURI);
    var savedInput = localStorage.getItem('saved-input');
    !!savedInput && setInput(savedInput || '');
  }, []);

  var handleInput = function handleInput(e) {
    var target = e.target;
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
