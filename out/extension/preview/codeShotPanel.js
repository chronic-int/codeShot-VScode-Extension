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
            const type = message.type || message.command;
            console.log(`[CodeShot] Extension received command: ${type}`);
            // v0.0.7 Diagnostics: Immediate confirmation
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
                case 'capture':
                    this._handleCapture(message.data.imageBase64, message.data.action);
                    break;
                default:
                    console.warn('[CodeShot] Unknown message type:', message);
            }
        }, null, this._disposables);
    }
    update(payload) {
        this._lastPayload = payload;
        if (this._panel) {
            this._panel.webview.postMessage({ command: 'update', payload });
        }
    }
    async _handleCapture(image, action) {
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
            }
            else {
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
                // v0.0.7: IO Hardening - Explicit Uint8Array
                await vscode.workspace.fs.writeFile(tempPath, new Uint8Array(buffer));
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
            vscode.window.showWarningMessage('Clipboard image copy is currently optimized for Windows.');
        }
    }
    async _saveImage(buffer) {
        // v0.0.7 Diagnostics: Opening Save Dialog
        vscode.window.showInformationMessage('CodeShot: Opening Save Dialog...');
        const options = {
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
            }
            catch (error) {
                console.error('[CodeShot] File write failed:', error);
                vscode.window.showErrorMessage(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        else {
            console.log('[CodeShot] Save dialog was cancelled.');
            vscode.window.showInformationMessage('CodeShot: Save cancelled.');
        }
    }
    _getHtmlForWebview(webview) {
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