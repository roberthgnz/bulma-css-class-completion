import * as vscode from 'vscode'
import { globalClasses, classes } from './classes'

const cssDisposable: vscode.Disposable[] = []
const configuration = 'bulma-css-class-completion.enabled'
const completionTriggerChars = ['"', "'", ' ', '.']

function registerProvider(disposables: vscode.Disposable[]) {
  const provider = vscode.languages.registerCompletionItemProvider(
    'html',
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

function unregisterProvider(disposables: vscode.Disposable[]) {
  disposables.forEach((disposable) => disposable.dispose())
  disposables.length = 0
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const disposables: vscode.Disposable[] = []

  vscode.workspace.onDidChangeConfiguration(
    async (e) => {
      if (e.affectsConfiguration(configuration)) {
        const isEnabled = vscode.workspace.getConfiguration().get<string>(configuration)
        isEnabled ? registerProvider(cssDisposable) : unregisterProvider(cssDisposable)
      }
    },
    null,
    disposables
  )

  registerProvider(cssDisposable)

  context.subscriptions.push(...disposables)
}

export function deactivate(): void {
  unregisterProvider(cssDisposable)
}
