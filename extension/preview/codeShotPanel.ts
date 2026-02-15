import * as vscode from 'vscode';
import { PreviewPayload } from '../../shared/types';

export class CodeShotPanel {
    public static currentPanel: CodeShotPanel | undefined;
    private _panel: vscode.WebviewPanel | undefined;
    private _disposables: vscode.Disposable[] = [];
    private _lastPayload: PreviewPayload | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) { }

    public createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this._panel) {
            this._panel.reveal(column ? column + 1 : vscode.ViewColumn.Two);
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            'codeshotPreview',
            'CodeShot Preview',
            column ? column + 1 : vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this._context.extensionUri, 'webview'),
                    vscode.Uri.joinPath(this._context.extensionUri, 'assets')
                ]
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                console.log('Extension received message:', message.command);
                switch (message.command) {
                    case 'ready':
                        console.log('Webview is ready, resending last payload');
                        if (this._lastPayload) {
                            this.update(this._lastPayload);
                        }
                        break;
                    case 'capture':
                        this._handleCapture(message.data);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public update(payload: PreviewPayload) {
        this._lastPayload = payload;
        if (this._panel) {
            console.log('Sending update to webview:', payload.language);
            this._panel.webview.postMessage({ command: 'update', payload });
        }
    }

    private _handleCapture(data: { imageBase64: string, action: 'copy' | 'save' }) {
        const base64Data = data.imageBase64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        if (data.action === 'copy') {
            // VS Code doesn't have a direct "write image to clipboard" API in typical extensions
            // but we can try to use standard clipboard if available, or just notify.
            // For now, we'll focus on the Save action and notify about Copy limit.
            vscode.window.showInformationMessage('Screenshot generated! (Save action is recommended)');
        } else if (data.action === 'save') {
            this._saveImage(buffer);
        }
    }

    private async _saveImage(buffer: Buffer) {
        const options: vscode.SaveDialogOptions = {
            defaultUri: vscode.Uri.file('codeshot.png'),
            filters: {
                'Images': ['png']
            }
        };

        const fileUri = await vscode.window.showSaveDialog(options);
        if (fileUri) {
            try {
                await vscode.workspace.fs.writeFile(fileUri, buffer);
                vscode.window.showInformationMessage(`Screenshot saved to ${fileUri.fsPath}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save screenshot: ${error}`);
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const layoutCss = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'layout', 'layout.css'));
        const rendererJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'renderer.js'));
        const captureJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'capture.js'));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval';">
    <title>CodeShot Preview</title>
    <link rel="stylesheet" href="${layoutCss}">
    <style>
        /* Embedded Shiki styles or overrides */
        .shiki { padding: 0 !important; margin: 0 !important; background-color: transparent !important; }
        .shiki code { background-color: transparent !important; }
    </style>
</head>
<body>
    <div id="preview-container">
        <div class="code-wrapper" id="code-output">
            <div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>
        </div>
    </div>

    <div style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
        <button id="copy-btn">Copy to Clipboard</button>
        <button id="save-btn">Save as PNG</button>
    </div>

    <script src="${rendererJs}"></script>
    <script src="${captureJs}"></script>
</body>
</html>`;
    }

    public dispose() {
        this._panel?.dispose();
        this._panel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
