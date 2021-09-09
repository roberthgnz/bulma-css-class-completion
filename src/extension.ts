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

        // const createCompletions = (key: string, modifiers: string[]): void => {
        //   modifiers.forEach((className) => {
        //     const list = className
        //       .replaceAll(`.${key}.`, ".")
        //       .split(".")
        //       .slice(1);
        //     list.forEach((item) => {
        //       // prevent creating a completion that already exists
        //       const completion = new vscode.CompletionItem(
        //         item,
        //         vscode.CompletionItemKind.Variable
        //       );
        //       completions.push(completion);
        //     });
        //   });
        // };

        // globalClasses.forEach((key) => {
        //   const completion = new vscode.CompletionItem(
        //     key.replace(".", ""),
        //     vscode.CompletionItemKind.Variable
        //   );
        //   completions.push(completion);
        // });

        // create root class completions
        for (const key in classes) {
          const rootCompletion = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Variable
          );
          completions.set(key, rootCompletion);
        }

        // check if it's a root class exists, return the last part of the class name
        const className = rawClasses[1].split(" ").pop();

        if (!className.length) {
          return [];
        }

        // targetClass if the key with more coincidences in the class attribute
        const targetClass = Object.keys(classes).find((key) => {
          const classes = rawClasses[1].split(" ");
          // if the classes has more than one class, check if the class name is in the list
          if (classes.length > 1) {
            const prev = classes[classes.length - 1];
            return key.startsWith(className) && key !== prev;
          }
          return key.startsWith(className);
        });

        if (targetClass) {
          const modifiers: string[] = classes[targetClass];
          const rootCompletion = completions.get(targetClass);

          // a completion item that inserts its text as snippet,
          // the `insertText`-property is a `SnippetString` which will be honored by the editor.
          rootCompletion.insertText = new vscode.SnippetString(
            createSnippets(targetClass, modifiers)
          );

          // set the updated completion item
          completions.set(targetClass, rootCompletion);

          // if (modifiers.length) {
          //   createCompletions(className, classes[className]);
          // }
        }

        // for (const key in classes) {
        //   const modifiers: string[] = classes[key];
        //   const rootCompletion = new vscode.CompletionItem(
        //     key,
        //     vscode.CompletionItemKind.Variable
        //   );

        //   // a completion item that inserts its text as snippet,
        //   // the `insertText`-property is a `SnippetString` which will be honored by the editor.
        //   rootCompletion.insertText = new vscode.SnippetString(
        //     createSnippets(key.replace(".", ""), modifiers)
        //   );
        //   completions.push(rootCompletion);

        //   // create completions for class modifiers
        //   if (modifiers.length) {
        //     createCompletions(key, modifiers);
        //   }
        // }

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
