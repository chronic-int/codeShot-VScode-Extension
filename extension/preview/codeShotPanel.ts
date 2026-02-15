import * as vscode from 'vscode';
import { getHighlighter, Highlighter } from 'shiki';
import { PreviewPayload } from '../../shared/types';

export class CodeShotPanel {
    public static currentPanel: CodeShotPanel | undefined;
    private _panel: vscode.WebviewPanel | undefined;
    private _disposables: vscode.Disposable[] = [];
    private _lastPayload: PreviewPayload | undefined;
    private _highlighter: Highlighter | undefined;

    constructor(private readonly _context: vscode.ExtensionContext) { }

    private async _getHighlighter(): Promise<Highlighter> {
        if (!this._highlighter) {
            this._highlighter = await getHighlighter({
                theme: 'light-plus',
                langs: [
                    'javascript', 'typescript', 'css', 'json',
                    'python', 'bash', 'markdown', 'html',
                    'cpp', 'java', 'go', 'rust', 'sql', 'yaml'
                ]
            });
        }
        return this._highlighter;
    }

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
                const type = message.type || message.command;
                console.log(`[CodeShot] Extension received command: ${type}`);

                if (type !== 'notify' && type !== 'ready') {
                    vscode.window.showInformationMessage(`CodeShot: Extension received '${type}' command.`);
                }

                switch (type) {
                    case 'ready':
                        if (this._lastPayload) {
                            this.update(this._lastPayload);
                        }
                        break;
                    case 'save':
                        this._handleCapture(message.image, 'save');
                        break;
                    case 'copy':
                        this._handleCapture(message.image, 'copy');
                        break;
                    case 'notify':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        break;
                    default:
                        console.warn('[CodeShot] Unknown message type:', message);
                }
            },
            null,
            this._disposables
        );
    }

    public async update(payload: PreviewPayload) {
        this._lastPayload = payload;
        if (this._panel) {
            const html = await this._renderCodeToHtml(payload.code, payload.language, payload.startLine);
            this._panel.webview.postMessage({ command: 'update', html });
        }
    }

    private async _renderCodeToHtml(code: string, language: string, startLine: number): Promise<string> {
        try {
            const highlighter = await this._getHighlighter();
            const langMap: { [key: string]: string } = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'sh': 'bash',
                'md': 'markdown',
                'yml': 'yaml'
            };
            const lang = langMap[language] || language || 'javascript';

            const tokenLines = highlighter.codeToThemedTokens(code, lang);

            let finalHtml = `<pre class="shiki" style="background-color: transparent !important; margin: 0; padding: 0;"><code>`;

            tokenLines.forEach((line, index) => {
                const currentLineNumber = startLine + index;

                let lineContent = '';
                if (line.length === 0) {
                    lineContent = '&nbsp;';
                } else {
                    line.forEach(token => {
                        const style = token.color ? `style="color: ${token.color}"` : '';
                        const content = token.content
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                        lineContent += `<span ${style}>${content}</span>`;
                    });
                }

                finalHtml += `<div class="line">
                    <span class="line-number">${currentLineNumber}</span>
                    <span class="line-content">${lineContent}</span>
                </div>`;
            });

            finalHtml += `</code></pre>`;
            return finalHtml;
        } catch (err) {
            console.error('[CodeShot] Render error:', err);
            return `<pre><code>${code}</code></pre>`;
        }
    }

    private async _handleCapture(image: string, action: 'copy' | 'save') {
        if (!image) {
            vscode.window.showErrorMessage('Capture failed: No image data received.');
            return;
        }

        console.log(`[CodeShot] _handleCapture received. Action: ${action}, Data length: ${image.length}`);

        const statusMessage = action === 'save' ? 'Processing image for saving...' : 'Processing image for copy...';
        const statusBar = vscode.window.setStatusBarMessage(`$(sync~spin) CodeShot: ${statusMessage}`);

        try {
            // v0.0.7 Diagnostics: Buffer creation
            const base64Data = image.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            vscode.window.showInformationMessage(`CodeShot: Buffer created (${Math.round(buffer.length / 1024)} KB).`);

            if (action === 'copy') {
                await this._handleCopyFallback(buffer);
            } else {
                await this._saveImage(buffer);
            }
        } catch (err) {
            console.error('[CodeShot] Capture handling failed:', err);
            vscode.window.showErrorMessage(`Capture process failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            statusBar.dispose();
        }
    }

    private async _handleCopyFallback(buffer: Buffer) {
        if (process.platform === 'win32') {
            try {
                const tempPath = vscode.Uri.joinPath(this._context.globalStorageUri, 'temp_clipboard.png');
                await vscode.workspace.fs.createDirectory(this._context.globalStorageUri);

                // v0.0.7: IO Hardening - Explicit Uint8Array
                await vscode.workspace.fs.writeFile(tempPath, new Uint8Array(buffer));

                const cp = require('child_process');
                const command = `PowerShell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${tempPath.fsPath.replace(/'/g, "''")}'))"`;

                cp.exec(command, (err: any) => {
                    if (err) {
                        console.error('[CodeShot] PowerShell copy failed:', err);
                        vscode.window.showErrorMessage('Failed to copy to clipboard.');
                    } else {
                        vscode.window.showInformationMessage('Screenshot copied to clipboard!');
                    }
                });
            } catch (err) {
                console.error('[CodeShot] Clipboard fallback preparation failed:', err);
                vscode.window.showErrorMessage('Failed to prepare clipboard data.');
            }
        } else {
            vscode.window.showWarningMessage('Clipboard image copy is currently optimized for Windows.');
        }
    }

    private async _saveImage(buffer: Buffer) {
        // v0.0.7 Diagnostics: Opening Save Dialog
        vscode.window.showInformationMessage('CodeShot: Opening Save Dialog...');

        const options: vscode.SaveDialogOptions = {
            defaultUri: vscode.Uri.file('codeshot.png'),
            filters: { 'Images': ['png'] },
            title: 'Save Code Screenshot'
        };

        const fileUri = await vscode.window.showSaveDialog(options);

        if (fileUri) {
            try {
                // v0.0.7: IO Hardening - Explicit Uint8Array
                const uint8 = new Uint8Array(buffer);
                vscode.window.showInformationMessage(`CodeShot: Writing ${Math.round(uint8.length / 1024)} KB to disk...`);

                await vscode.workspace.fs.writeFile(fileUri, uint8);
                vscode.window.showInformationMessage(`Screenshot saved to ${fileUri.fsPath}`);
            } catch (error) {
                console.error('[CodeShot] File write failed:', error);
                vscode.window.showErrorMessage(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            console.log('[CodeShot] Save dialog was cancelled.');
            vscode.window.showInformationMessage('CodeShot: Save cancelled.');
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const layoutCss = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'layout', 'layout.css'));
        const mainJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'main.js'));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-eval';">
    <title>CodeShot Preview</title>
    <link rel="stylesheet" href="${layoutCss}">
</head>
<body>
    <div id="preview-container">
        <div class="a4-page" id="screenshot-target">
            <div class="code-wrapper" id="code-output">
                <div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>
            </div>
        </div>
    </div>

    <div id="action-bar">
        <button id="copy-btn" class="btn btn-secondary">Copy to Clipboard</button>
        <button id="save-btn" class="btn btn-primary">Save as PNG</button>
    </div>

    <script src="${mainJs}"></script>
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
