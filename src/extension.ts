import * as vscode from "vscode";
import { globalClasses, classes } from "./classes";

const cssDisposable: vscode.Disposable[] = [];
const configuration = "bulma-css-class-completion.enabled";

function registerProvider(disposables: vscode.Disposable[]) {
  const provider = vscode.languages.registerCompletionItemProvider("html", {
    provideCompletionItems(
      document: vscode.TextDocument,
      position: vscode.Position
    ) {
      const start: vscode.Position = new vscode.Position(position.line, 0);
      const range: vscode.Range = new vscode.Range(start, position);
      const text: string = document.getText(range);

      const classMatchRegex = /class=["|']([\w- ]*$)/;

      // Check if the cursor is on a class attribute and retrieve all the css rules in this class attribute
      const rawClasses: RegExpMatchArray | null = text.match(classMatchRegex);
      if (!rawClasses || rawClasses.length === 1) {
        return [];
      }

      const usedClass = new Set();

      const completions: vscode.CompletionItem[] = [];

      const createSnippets = (key: string, list: string[]): string => {
        // remove root class name, create snippet options and return unique selectors
        const parsed = [
          ...new Set(
            list
              .join("")
              .replaceAll(`.${key}.`, ".")
              .replaceAll(".", ",")
              .slice(1)
              .split(",")
          ).values(),
        ];
        return `${key} \${1|${parsed}\|}`;
      };

      const createCompletions = (key: string, modifiers: string[]): void => {
        modifiers.forEach((className) => {
          const list = className
            .replaceAll(`.${key}.`, ".")
            .split(".")
            .slice(1);
          list.forEach((item) => {
            // prevent creating a completion that already exists
            if (!usedClass.has(item)) {
              const completion = new vscode.CompletionItem(
                item,
                vscode.CompletionItemKind.Variable
              );
              completions.push(completion);
            } else usedClass.add(item);
          });
        });
      };

      globalClasses.forEach((key) => {
        const completion = new vscode.CompletionItem(
          key.replace(".", ""),
          vscode.CompletionItemKind.Variable
        );
        completions.push(completion);
      });

      for (const key in classes) {
        const modifiers: string[] = classes[key];
        const rootCompletion = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Variable
        );

        // a completion item that inserts its text as snippet,
        // the `insertText`-property is a `SnippetString` which will be honored by the editor.
        rootCompletion.insertText = new vscode.SnippetString(
          createSnippets(key.replace(".", ""), modifiers)
        );
        completions.push(rootCompletion);

        // create completions for class modifiers
        if (modifiers.length) {
          createCompletions(key, modifiers);
        }
      }

      disposables.push(provider);

      return [...completions];
    },
  });
}

function unregisterProvider(disposables: vscode.Disposable[]) {
  disposables.forEach((disposable) => disposable.dispose());
  disposables.length = 0;
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const disposables: vscode.Disposable[] = [];

  vscode.workspace.onDidChangeConfiguration(
    async (e) => {
      if (e.affectsConfiguration(configuration)) {
        const isEnabled = vscode.workspace
          .getConfiguration()
          .get<string>(configuration);
        isEnabled
          ? registerProvider(cssDisposable)
          : unregisterProvider(cssDisposable);
      }
    },
    null,
    disposables
  );

  registerProvider(cssDisposable);

  context.subscriptions.push(...disposables);
}

export function deactivate(): void {
  unregisterProvider(cssDisposable);
}
