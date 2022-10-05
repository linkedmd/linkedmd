# @linkedmd/component

> React component to embed Linked Markdown files

[![NPM](https://img.shields.io/npm/v/@linkedmd/component.svg)](https://www.npmjs.com/package/@linkedmd/component) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @linkedmd/component
```

or

```bash
yarn add @linkedmd/component
```

## Usage

```tsx
import React, { Component } from 'react'

import { LinkedMarkdownViewer } from '@linkedmd/component'
import '@linkedmd/component/dist/index.css'

class Example extends Component {
  render() {
    return
      <LinkedMarkdownViewer
        fileURI="ipfs://bafkreibrzdmvj3n3inklvyjp5c5wmqv4w6jnafz5paaxfyk27v47gjxmhe"
      />
  }
}
```

## License

MIT © [nation3](https://github.com/nation3)
