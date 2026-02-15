import * as htmlToImage from 'html-to-image';

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
        } catch (err) {
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
        } catch (err) {
            console.error('Capture error:', err);
        }
    });
}

declare function acquireVsCodeApi(): any;
