import * as vscode from "vscode";

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

      const buttonClasses = [
        "button",
        "is-white",
        "is-light",
        "is-dark",
        "is-black",
        "is-text",
        "is-ghost",
        "is-primary",
        "is-link",
        "is-info",
        "is-success",
        "is-warning",
        "is-danger",
        "is-small",
        "is-normal",
        "is-medium",
        "is-large",
        "is-fullwidth",
        "is-outlined",
        "is-inverted",
        "is-rounded",
        "is-hovered",
        "is-focused",
        "is-active",
        "is-loading",
        "is-static",
      ];

      const buttonCompletions = buttonClasses.map((buttonClass) => {
        const completion = new vscode.CompletionItem(
          buttonClass,
          vscode.CompletionItemKind.Variable
        );
        return completion;
      });

      return [...buttonCompletions];
    },
  });

  context.subscriptions.push(provider);
}
