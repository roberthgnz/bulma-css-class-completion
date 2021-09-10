import * as vscode from "vscode";
import { globalClasses, classes } from "./classes";

const cssDisposable: vscode.Disposable[] = [];
const configuration = "bulma-css-class-completion.enabled";
const completionTriggerChars = ['"', "'", " ", "."];

function registerProvider(disposables: vscode.Disposable[]) {
  const provider = vscode.languages.registerCompletionItemProvider(
    "html",
    {
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

        const completions = new Map<string, vscode.CompletionItem>();

        const createCompletionsChilds = (
          key: string,
          modifiers: string[]
        ): void => {
          modifiers.forEach((className) => {
            const list = className
              .replaceAll(`.${key}.`, ".")
              .split(".")
              .slice(1);
            list.forEach((item) => {
              // prevent creating a completion that already exists
              const completion = new vscode.CompletionItem(
                item,
                vscode.CompletionItemKind.Variable
              );
              completions.set(item, completion);
            });
          });
        };

        const createCompletions = (
          targetClass: string,
          onlyChild: boolean = false
        ) => {
          if (onlyChild) {
            const modifiers: string[] = classes[targetClass];
            createCompletionsChilds(targetClass, modifiers);
          } else {
            const modifiers: string[] = classes[targetClass];
            const rootCompletion = completions.get(targetClass);

            rootCompletion.insertText = new vscode.SnippetString(
              createSnippets(targetClass, modifiers)
            );

            completions.set(targetClass, rootCompletion);
          }
        };

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

        globalClasses.forEach((key) => {
          const completion = new vscode.CompletionItem(
            key.replace(".", ""),
            vscode.CompletionItemKind.Variable
          );
          completions.set(key.replace(".", ""), completion);
        });

        // create root class completions
        for (const key in classes) {
          const rootCompletion = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Variable
          );
          completions.set(key, rootCompletion);
        }

        const className = rawClasses[1].split(" ").pop();

        if (!className.length) {
          return [];
        }

        // check if the class contains a -, if so, we need to filter the classes
        if (className.match(/[a-z]{1,}-{1}/)) {
          // create root class completions
          const rootClass = className
            .match(/[a-z]{1,}-{1}/)[0]
            .replace("-", "");

          createCompletions(rootClass, true);

          disposables.push(provider);

          return [...completions.values()];
        }

        const targetClass = Object.keys(classes).find((key) => {
          return key.startsWith(className);
        });

        createCompletions(targetClass);

        disposables.push(provider);

        return [...completions.values()];
      },
    },
    ...completionTriggerChars
  );
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
