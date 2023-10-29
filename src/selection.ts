import { MarkdownString, TextDocument, Position } from 'vscode'
import parserCSS from 'prettier/parser-postcss'
import prettier from 'prettier/standalone'

import { getBulmaCSSContent, getDeclaration, getStringFromCSS, isValidSelector } from './utils'

export function registerSelectionStyle(document: TextDocument, position: Position) {
  const range = document.getWordRangeAtPosition(position)
  const selector = document.getText(range).trim()

  if (!selector) return

  const bulma = getBulmaCSSContent()
  const isSelector = isValidSelector(bulma, selector)

  if (!isSelector) return

  const declaration = getDeclaration(bulma, selector)

  const css = getStringFromCSS(declaration)

  const prettified = prettier.format(css, {
    parser: 'css',
    plugins: [parserCSS]
  })

  return [new MarkdownString(`\`\`\`css\n${prettified.trim()}\n\`\`\``)]
}
