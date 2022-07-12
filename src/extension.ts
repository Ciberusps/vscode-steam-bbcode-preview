// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";

let webpanel: vscode.WebviewPanel | undefined;

const getFilePath = (
  extensionPath: string,
  relativePath: string,
  webview: vscode.Webview
) => {
  const diskPath = vscode.Uri.file(path.join(extensionPath, relativePath));
  return webview.asWebviewUri(diskPath).toString();
};

const getFileExtension = (fileName: string) => {
  return path.extname(path.basename(fileName).replace(".git", ""));
};

const isBBCode = (document: vscode.TextDocument): boolean => {
  const fileExtension = getFileExtension(document.fileName);
  return [".bb", ".bbcode"].includes(fileExtension);
};

const updatePreview = (
  context: vscode.ExtensionContext,
  document: vscode.TextDocument
) => {
  if (!webpanel || !webpanel?.webview) return;

  const body = document
    // vscode.window.activeTextEditor?.document
    .getText()
    .replace(/\n/g, "<br/>")
    .replace(/\[h2\]/g, "<h2>")
    .replace(/\[\/h2\]/g, "</h2>")
    .replace(/\[b\]/g, "<b>")
    .replace(/\[\/b\]/g, "</b>");

  const webview = webpanel.webview;

  const cssPath = getFilePath(context.extensionPath, "assets/steam.css", webview);

  webview.html = `
      <html>
        <head>
          <link rel="stylesheet" href="${cssPath}">
        </head>

        <body>
          ${body}
        </body>
      </html>
  `;
};

const showPreview =
  (context: vscode.ExtensionContext, document: vscode.TextDocument | undefined) =>
  (textEditor?: vscode.TextEditor) => {
    if (!document) {
      document = textEditor?.document;
      console.log("no document try ", document);
    }
    if (!document || !isBBCode(document)) {
      return;
    }

    console.log("rerender");

    if (!webpanel || !webpanel?.webview) {
      if (webpanel) {
        webpanel.dispose();
      }

      webpanel = vscode.window.createWebviewPanel(
        "vscode-steam-bbcode-preview",
        "Preview Steam BBCode",
        { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
        {
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "assets")),
          ],
          enableScripts: true,
        }
      );
    }

    updatePreview(context, document);

    webpanel.onDidDispose(
      () => {
        webpanel = undefined;
      },
      null,
      context.subscriptions
    );
  };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-steam-bbcode-preview" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length) {
        showPreview(context, event.document)();
      }
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      console.log("change active text editor");
      if (vscode.window.activeTextEditor?.document) {
        console.log("SHOW");
        updatePreview(context, vscode.window.activeTextEditor.document);
      }
    })
  );

  // context.subscriptions.push(
  //   vscode.workspace.onDidOpenTextDocument((document) => {
  //     console.log("SHOW PREVIEW 3");
  //     showPreview(context, document)();
  //   })
  // );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "vscode-steam-bbcode-preview.show-preview",
      showPreview(context, undefined)
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
