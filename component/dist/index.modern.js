import React, { useState, useEffect } from 'react';
import { LinkedMarkdown } from '@linkedmd/parser';

var fetchAndParse = function fetchAndParse(fileUrl) {
  try {
    return Promise.resolve(fetch(fileUrl)).then(function (data) {
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
  var fileUrl = _ref.fileUrl;

  var _useState = useState([]),
      fileStack = _useState[0],
      setFileStack = _useState[1];

  var _useState2 = useState(''),
      output = _useState2[0],
      setOutput = _useState2[1];

  useEffect(function () {
    fetchAndParse(fileUrl).then(function (_ref2) {
      var parser = _ref2.parser;
      setFileStack(fileStack.concat([fileUrl]));
      setOutput(parser.toHTML() || '');
    });
  }, []);
  return React.createElement("div", {
    className: "LM-output",
    dangerouslySetInnerHTML: {
      __html: output
    }
  });
};
var LinkedMarkdownEditor = function LinkedMarkdownEditor(_ref3) {
  var fileUrl = _ref3.fileUrl;

  var _useState3 = useState(''),
      input = _useState3[0],
      setInput = _useState3[1];

  var _useState4 = useState(''),
      output = _useState4[0],
      setOutput = _useState4[1];

  useEffect(function () {
    fetchAndParse(fileUrl).then(function (_ref4) {
      var file = _ref4.file,
          parser = _ref4.parser;
      setInput(file || '');
      setOutput(parser.toHTML() || '');
      !!file && localStorage.setItem('saved-input', file);
    });
  }, []);
  useEffect(function () {
    var parser = new LinkedMarkdown(input);
    parser.parse().then(function () {
      setOutput(parser.toHTML());
    });
    input !== '' && localStorage.setItem('saved-input', input);
  }, [input]);
  useEffect(function () {
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
