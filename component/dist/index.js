function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var parser = require('@linkedmd/parser');

var IPFS_GATEWAY = 'https://cf-ipfs.com/ipfs';

var fetchAndParse = function fetchAndParse(fileURI) {
  try {
    var ipfsURI = fileURI.startsWith('ipfs://') ? IPFS_GATEWAY + "/" + fileURI.split('ipfs://')[1] : false;
    return Promise.resolve(fetch(ipfsURI ? ipfsURI : fileURI)).then(function (data) {
      return Promise.resolve(data.text()).then(function (file) {
        var parser$1 = new parser.LinkedMarkdown(file);
        return Promise.resolve(parser$1.parse()).then(function () {
          return {
            file: file,
            parser: parser$1
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

  var _useState = React.useState([]),
      fileStack = _useState[0],
      setFileStack = _useState[1];

  var _useState2 = React.useState(''),
      output = _useState2[0],
      setOutput = _useState2[1];

  var _useState3 = React.useState(false),
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

  React.useEffect(function () {
    fetchAndSet(fileURI, true);
    window.addEventListener('message', function (event) {
      if (event.origin !== window.location.origin) return;

      try {
        var newFileURI = JSON.parse(unescape(event.data)).lmURI;
        fetchAndSet(newFileURI, true);
      } catch (e) {}
    }, false);
  }, []);
  return React__default.createElement("div", null, fileStack.length > 1 && React__default.createElement("a", {
    onClick: goBack,
    style: {
      cursor: 'pointer'
    }
  }, "\u2190 Back"), loading && fileStack.length > 1 && ' | ', loading && React__default.createElement("span", null, "Loading"), React__default.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  }));
};
var LinkedMarkdownEditor = function LinkedMarkdownEditor(_ref3) {
  var fileURI = _ref3.fileURI;

  var _useState4 = React.useState(''),
      input = _useState4[0],
      setInput = _useState4[1];

  var _useState5 = React.useState(''),
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

  React.useEffect(function () {
    fetchAndSet(fileURI);
  }, [fileURI]);
  React.useEffect(function () {
    var parser$1 = new parser.LinkedMarkdown(input);
    parser$1.parse().then(function () {
      setOutput(parser$1.toHTML());
    });
    input !== '' && localStorage.setItem('saved-input', input);
  }, [input]);
  React.useEffect(function () {
    fetchAndSet(fileURI);
    var savedInput = localStorage.getItem('saved-input');
    !!savedInput && setInput(savedInput || '');
  }, []);

  var handleInput = function handleInput(e) {
    var target = e.target;
    setInput(target.value);
  };

  return React__default.createElement("div", {
    className: "LM-split-screen"
  }, React__default.createElement("textarea", {
    className: "LM-input",
    onChange: handleInput,
    value: input
  }), React__default.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  }));
};

exports.LinkedMarkdownEditor = LinkedMarkdownEditor;
exports.LinkedMarkdownViewer = LinkedMarkdownViewer;
//# sourceMappingURL=index.js.map
