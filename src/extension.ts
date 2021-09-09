import * as vscode from "vscode";
import classes from "./classes";

export function activate(context: vscode.ExtensionContext) {
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

    
      const completions: vscode.CompletionItem[] = [];

      for (const key in classes) {
        const modifiers: string[] = classes[key];
        const rootCompletion = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Variable
        );
        // a completion item that inserts its text as snippet,
        // the `insertText`-property is a `SnippetString` which will be honored by the editor.
        rootCompletion.insertText = new vscode.SnippetString(
          `${key} \${1|${modifiers.join(",")}\|}`
        );
        completions.push(rootCompletion);
        // create completions for class modifiers
        modifiers.forEach((modifier) => {
          const completion = new vscode.CompletionItem(
            modifier,
            vscode.CompletionItemKind.Variable
          );
          completions.push(completion);
        });
      }

      return [...completions];
    },
  });

  context.subscriptions.push(provider);
}
