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
            console.log('Sending update to webview:', payload.language);
            this._panel.webview.postMessage({ command: 'update', payload });
        }
    }
    async _handleCapture(data) {
        console.log(`[CodeShot] _handleCapture action: ${data.action}, data length: ${data.imageBase64.length}`);
        const base64Data = data.imageBase64.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        console.log(`[CodeShot] Buffer length: ${buffer.length}`);
        if (data.action === 'copy') {
            try {
                // Since VS Code doesn't have a direct image clipboard API, 
                // and if the webview copy failed, we use a platform-specific fallback.
                // For Windows, we can use PowerShell.
                if (process.platform === 'win32') {
                    const tempPath = vscode.Uri.joinPath(this._context.globalStorageUri, 'temp_capture.png');
                    await vscode.workspace.fs.createDirectory(this._context.globalStorageUri);
                    await vscode.workspace.fs.writeFile(tempPath, buffer);
                    const cp = require('child_process');
                    // Ensure path is quoted and use a more robust script
                    const command = `PowerShell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${tempPath.fsPath.replace(/'/g, "''")}'))"`;
                    console.log('[CodeShot] Executing PowerShell copy...');
                    cp.exec(command, (err) => {
                        if (err) {
                            console.error('[CodeShot] PowerShell Copy failed:', err);
                            vscode.window.showErrorMessage('Failed to copy image to clipboard.');
                        }
                        else {
                            console.log('[CodeShot] PowerShell Copy successful');
                            vscode.window.showInformationMessage('Image copied to clipboard!');
                        }
                    });
                }
                else {
                    vscode.window.showWarningMessage('Copy to clipboard is only supported in the preview panel on this platform.');
                }
            }
            catch (err) {
                console.error('Copy process error:', err);
                vscode.window.showErrorMessage('Failed to process image for copy.');
            }
        }
        else if (data.action === 'save') {
            console.log('[CodeShot] Extension initiating save process');
            await this._saveImage(buffer);
        }
    }
    async _saveImage(buffer) {
        console.log('[CodeShot] _saveImage: Showing Save Dialog');
        const options = {
            defaultUri: vscode.Uri.file('codeshot.png'),
            filters: {
                'Images': ['png']
            },
            title: 'Save Code Screenshot'
        };
        const fileUri = await vscode.window.showSaveDialog(options);
        if (fileUri) {
            try {
                await vscode.workspace.fs.writeFile(fileUri, buffer);
                vscode.window.showInformationMessage(`Screenshot saved to ${fileUri.fsPath}`);
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to save screenshot: ${error}`);
            }
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