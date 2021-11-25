import * as vscode from 'vscode'
import { globalClasses, classes } from './classes'

const htmlDisposables: vscode.Disposable[] = []
const jsDisposables: vscode.Disposable[] = []
const configuration = {
  html: 'bulma-css-class-completion.HTMLLanguages',
  js: 'bulma-css-class-completion.JavaScriptLanguages'
}
const completionTriggerChars = ['"', "'", ' ', '.']

function registerProvider(disposables: vscode.Disposable[], language: string) {
  const provider = vscode.languages.registerCompletionItemProvider(
    language,
    {
      provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
        const start: vscode.Position = new vscode.Position(position.line, 0)
        const range: vscode.Range = new vscode.Range(start, position)
        const text: string = document.getText(range)

        // Match with class or className
        const classMatchRegex = /[class|className]=["|']([\w- ]*$)/

        // Check if the cursor is on a class attribute and retrieve all the css rules in this class attribute
        const rawClasses: RegExpMatchArray | null = text.match(classMatchRegex)
        if (!rawClasses || rawClasses.length === 1) {
          return []
        }

        const completions = new Map<string, vscode.CompletionItem>()

        const createCompletionsChilds = (modifiers: string[]): void => {
          modifiers.forEach((className) => {
            const list = className.split('.').slice(1)
            /* 
            TODO: if class it's .card-header-title.is-centered
            * a snippet is created for card-header-title
            * otherwise just register the completion 
            * */
            list.forEach((item) => {
              const completion = new vscode.CompletionItem(item, vscode.CompletionItemKind.Variable)
              completions.set(item, completion)
            })
          })
        }

        const createCompletions = (targetClass: string, onlyChilds = false) => {
          const modifiers: string[] = classes[targetClass]
          if (onlyChilds) {
            createCompletionsChilds(modifiers)
          } else {
            const rootCompletion = completions.get(targetClass)

            rootCompletion.insertText = new vscode.SnippetString(
              createSnippets(targetClass, modifiers)
            )

            completions.set(targetClass, rootCompletion)
          }
        }

        const createSnippets = (key: string, list: string[]): string => {
          const parsed = [
            ...new Set(list.join('').replaceAll(`.${key}.`, '.').split('.').slice(1))
          ].join(',')
          return `${key} \${1|${parsed}|}`
        }

        globalClasses.forEach((key) => {
          const keyClasses = key.split('.').slice(1)
          keyClasses.forEach((kc) => {
            if (!completions.has(kc)) {
              const completion = new vscode.CompletionItem(kc, vscode.CompletionItemKind.Variable)
              completions.set(kc, completion)
            }
          })
        })

        // create root class completions
        for (const key in classes) {
          const rootCompletion = new vscode.CompletionItem(key, vscode.CompletionItemKind.Variable)
          completions.set(key, rootCompletion)
        }

        const className = rawClasses[1].split(' ').pop()

        // check if the class contains a -, if so, we need to filter the classes
        if (className.match(/[a-z]{1,}-{1}/)) {
          // create root class completions
          const rootClass = className.match(/[a-z]{1,}-{1}/)[0].replace('-', '')

          createCompletions(rootClass, true)

          disposables.push(provider)

          return [...completions.values()]
        }

        const targetClass = Object.keys(classes).find((key) => {
          return key.startsWith(className)
        })

        createCompletions(targetClass)

        disposables.push(provider)

        return [...completions.values()]
      }
    },
    ...completionTriggerChars
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
