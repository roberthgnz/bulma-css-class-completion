import * as vscode from 'vscode'
import { globalClasses, classes } from './classes'

const htmlDisposables: vscode.Disposable[] = []
const jsDisposables: vscode.Disposable[] = []
const configuration = {
  html: 'bulma-css-class-completion.HTMLLanguages',
  js: 'bulma-css-class-completion.JavaScriptLanguages'
}

function registerProvider(disposables: vscode.Disposable[], language: string) {
  const provider = vscode.languages.registerCompletionItemProvider(
    language,
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const start: vscode.Position = new vscode.Position(position.line, 0)
        const range: vscode.Range = new vscode.Range(start, position)
        const text: string = document.getText(range)

        // Match with class or className
        const classMatchRegex = /[class|className]=["|']([\w\- ]*)["|']?$/

        // Check if the cursor is on a class attribute and retrieve all the css rules in this class attribute
        const rawClasses: RegExpMatchArray | null = text.match(classMatchRegex)
        if (!rawClasses || rawClasses.length === 1) {
          return []
        }

        const completions = new Map<string, vscode.CompletionItem>()

        const createSnippets = (key: string, list: string[]): string => {
          const parsed = [
            ...new Set(list.join('').replaceAll(`.${key}.`, '.').split('.').slice(1))
          ].join(',')
          return `${key} \${1|${parsed}|}`
        }

        const createCompletionsChilds = (targetClass: string): void => {
          const list = [...new Set(targetClass.split('.').slice(1))]
          list.forEach((item) => {
            if (!completions.has(item)) {
              const completion = new vscode.CompletionItem(item, vscode.CompletionItemKind.Variable)
              completions.set(item, completion)
            }
          })
        }

        const createCompletions = (targetClass: string) => {
          const rootCompletion =
            completions.get(targetClass) ||
            new vscode.CompletionItem(targetClass, vscode.CompletionItemKind.Variable)

          const modifiers = classes[targetClass]
          if (modifiers) {
            rootCompletion.filterText = targetClass
            rootCompletion.insertText = new vscode.SnippetString(
              createSnippets(targetClass, modifiers)
            )
            // Generate completions for each modifier
            modifiers.forEach((modifier) => {
              const hasChilds = modifier.split('.').length > 2
              if (hasChilds) {
                createCompletionsChilds(modifier)
              }
            })
          }

          completions.set(targetClass, rootCompletion)
        }

        globalClasses.forEach((key) => {
          const label = key.split('.')[1]
          createCompletions(label)
        })

        for (const key in classes) {
          createCompletions(key)
        }

        disposables.push(provider)

        return [...completions.values()]
      }
    },
    '\\w+|-'
  )
}

function unregisterProviders(disposables: vscode.Disposable[]) {
  disposables.forEach((disposable) => disposable.dispose())
  disposables.length = 0
}

function registerHTMLProviders(disposables: vscode.Disposable[]) {
  vscode.workspace
    .getConfiguration()
    .get<string[]>(configuration.html)
    .forEach((language) => {
      registerProvider(disposables, language)
    })
}

function registerJavascriptProviders(disposables: vscode.Disposable[]) {
  vscode.workspace
    .getConfiguration()
    .get<string[]>(configuration.js)
    .forEach((language) => {
      registerProvider(disposables, language)
    })
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const disposables: vscode.Disposable[] = []

  vscode.workspace.onDidChangeConfiguration(
    async (e) => {
      if (e.affectsConfiguration(configuration.html)) {
        unregisterProviders(htmlDisposables)
        registerHTMLProviders(htmlDisposables)
      }
      if (e.affectsConfiguration(configuration.js)) {
        unregisterProviders(jsDisposables)
        registerJavascriptProviders(jsDisposables)
      }
    },
    null,
    disposables
  )

  context.subscriptions.push(...disposables)

  registerHTMLProviders(htmlDisposables)
  registerJavascriptProviders(jsDisposables)
}

export function deactivate(): void {
  unregisterProviders(htmlDisposables)
  unregisterProviders(jsDisposables)
}
