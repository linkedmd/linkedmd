import fs from 'fs'
import LinkedMarkdown from './index.js'

const input = fs.readFileSync('./examples/CHARTER.md', 'utf8')

;(async () => {
  const lm = new LinkedMarkdown(input)
  await lm.parse()
  console.log(lm.toHTML())
})()
