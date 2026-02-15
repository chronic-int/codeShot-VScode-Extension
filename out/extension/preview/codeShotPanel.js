"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeShotPanel = void 0;
const vscode = __importStar(require("vscode"));
class CodeShotPanel {
    _context;
    static currentPanel;
    _panel;
    _disposables = [];
    _lastPayload;
    constructor(_context) {
        this._context = _context;
    }
    createOrShow() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (this._panel) {
            this._panel.reveal(column ? column + 1 : vscode.ViewColumn.Two);
            return;
        }
        this._panel = vscode.window.createWebviewPanel('codeshotPreview', 'CodeShot Preview', column ? column + 1 : vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'webview'),
                vscode.Uri.joinPath(this._context.extensionUri, 'assets')
            ]
        });
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(message => {
            console.log(`[CodeShot] Extension received command: ${message.command}`);
            switch (message.command) {
                case 'ready':
                    if (this._lastPayload) {
                        this.update(this._lastPayload);
                    }
                    break;
                case 'capture':
                    this._handleCapture(message.data);
                    break;
                case 'notify':
                    vscode.window.showInformationMessage(message.text);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message.text);
                    break;
            }
        }, null, this._disposables);
    }
    update(payload) {
        this._lastPayload = payload;
        if (this._panel) {
            this._panel.webview.postMessage({ command: 'update', payload });
        }
    }
    async _handleCapture(data) {
        console.log(`[CodeShot] _handleCapture received. Action: ${data.action}, Data length: ${data.imageBase64.length}`);
        const statusMessage = data.action === 'save' ? 'Converting image for saving...' : 'Converting image for copy...';
        const statusBar = vscode.window.setStatusBarMessage(`$(sync~spin) CodeShot: ${statusMessage}`);
        try {
            if (!data.imageBase64 || data.imageBase64.length < 50) {
                throw new Error('Image data from webview is invalid or empty.');
            }
            const base64Data = data.imageBase64.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            console.log(`[CodeShot] Buffer generated: ${buffer.length} bytes`);
            if (data.action === 'copy') {
                await this._handleCopyFallback(buffer);
            }
            else if (data.action === 'save') {
                await this._saveImage(buffer);
            }
        }
        catch (err) {
            console.error('[CodeShot] Capture handling failed:', err);
            vscode.window.showErrorMessage(`Capture process failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            statusBar.dispose();
        }
    }
    async _handleCopyFallback(buffer) {
        if (process.platform === 'win32') {
            try {
                const tempPath = vscode.Uri.joinPath(this._context.globalStorageUri, 'temp_clipboard.png');
                await vscode.workspace.fs.createDirectory(this._context.globalStorageUri);
                await vscode.workspace.fs.writeFile(tempPath, buffer);
                const cp = require('child_process');
                const command = `PowerShell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${tempPath.fsPath.replace(/'/g, "''")}'))"`;
                cp.exec(command, (err) => {
                    if (err) {
                        console.error('[CodeShot] PowerShell copy failed:', err);
                        vscode.window.showErrorMessage('Failed to copy to clipboard.');
                    }
                    else {
                        vscode.window.showInformationMessage('Screenshot copied to clipboard!');
                    }
                });
            }
            catch (err) {
                console.error('[CodeShot] Clipboard fallback preparation failed:', err);
                vscode.window.showErrorMessage('Failed to prepare clipboard data.');
            }
        }
        else {
            vscode.window.showWarningMessage('Clipboard fallback is currently only supported on Windows.');
        }
    }
    async _saveImage(buffer) {
        console.log('[CodeShot] Opening Save Dialog...');
        const options = {
            defaultUri: vscode.Uri.file('codeshot.png'),
            filters: {
                'Images': ['png']
            },
            title: 'Save Code Screenshot'
        };
        const fileUri = await vscode.window.showSaveDialog(options);
        if (!fileUri) {
            console.log('[CodeShot] Save dialog dismissed');
            return;
        }
        try {
            await vscode.workspace.fs.writeFile(fileUri, buffer);
            console.log('[CodeShot] Success: Image saved to', fileUri.fsPath);
            vscode.window.showInformationMessage(`Screenshot saved to ${fileUri.fsPath}`);
        }
        catch (error) {
            console.error('[CodeShot] Disk write failed:', error);
            vscode.window.showErrorMessage(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    _getHtmlForWebview(webview) {
        const layoutCss = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'layout', 'layout.css'));
        const rendererJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'renderer.js'));
        const captureJs = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'webview', 'dist', 'capture.js'));
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

    <div style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
        <button id="copy-btn">Copy to Clipboard</button>
        <button id="save-btn">Save as PNG</button>
    </div>

    <script src="${rendererJs}"></script>
    <script src="${captureJs}"></script>
</body>
</html>`;
    }
    dispose() {
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
exports.CodeShotPanel = CodeShotPanel;
//# sourceMappingURL=codeShotPanel.js.map