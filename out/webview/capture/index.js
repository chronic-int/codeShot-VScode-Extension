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
const htmlToImage = __importStar(require("html-to-image"));
const vscode = acquireVsCodeApi();
const copyBtn = document.getElementById('copy-btn');
const saveBtn = document.getElementById('save-btn');
const previewContainer = document.getElementById('preview-container');
if (copyBtn && previewContainer) {
    copyBtn.addEventListener('click', async () => {
        try {
            const dataUrl = await htmlToImage.toPng(previewContainer, { pixelRatio: 2 });
            vscode.postMessage({
                command: 'capture',
                data: {
                    imageBase64: dataUrl,
                    action: 'copy'
                }
            });
        }
        catch (err) {
            console.error('Capture error:', err);
        }
    });
}
if (saveBtn && previewContainer) {
    saveBtn.addEventListener('click', async () => {
        try {
            const dataUrl = await htmlToImage.toPng(previewContainer, { pixelRatio: 2 });
            vscode.postMessage({
                command: 'capture',
                data: {
                    imageBase64: dataUrl,
                    action: 'save'
                }
            });
        }
        catch (err) {
            console.error('Capture error:', err);
        }
    });
}
//# sourceMappingURL=index.js.map