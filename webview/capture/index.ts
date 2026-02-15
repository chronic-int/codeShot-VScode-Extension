import * as htmlToImage from 'html-to-image';

const vscode = acquireVsCodeApi();

function initCapture() {
    console.log('[CodeShot] Capture script initializing...');

    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    const screenshotTarget = document.getElementById('screenshot-target');

    console.log('[CodeShot] Elements found:', {
        copyBtn: !!copyBtn,
        saveBtn: !!saveBtn,
        screenshotTarget: !!screenshotTarget
    });

    if (!copyBtn || !saveBtn || !screenshotTarget) {
        console.warn('[CodeShot] Required elements not found. Will retry in 100ms.');
        setTimeout(initCapture, 100);
        return;
    }

    copyBtn.addEventListener('click', async () => {
        console.log('[CodeShot] Copy button clicked');
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Capturing...';

        try {
            const dataUrl = await htmlToImage.toPng(screenshotTarget, { pixelRatio: 2 });
            console.log('[CodeShot] Capture successful, length:', dataUrl.length);

            // Try to copy to clipboard directly in webview
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                console.log('[CodeShot] Native clipboard write successful');
                vscode.postMessage({ command: 'notify', text: 'Image copied to clipboard!' });
            } catch (clipboardErr) {
                console.warn('[CodeShot] Webview clipboard API failed, falling back to extension:', clipboardErr);
                vscode.postMessage({
                    command: 'capture',
                    data: {
                        imageBase64: dataUrl,
                        action: 'copy'
                    }
                });
            }
        } catch (err) {
            console.error('[CodeShot] Capture error:', err);
            vscode.postMessage({ command: 'error', text: 'Failed to capture image: ' + (err as Error).message });
        } finally {
            copyBtn.innerText = originalText;
        }
    });

    saveBtn.addEventListener('click', async () => {
        console.log('[CodeShot] Save button clicked');
        const originalText = saveBtn.innerText;
        saveBtn.innerText = 'Preparing...';

        try {
            const dataUrl = await htmlToImage.toPng(screenshotTarget, { pixelRatio: 2 });
            console.log('[CodeShot] Capture successful, sending to extension. Size:', dataUrl.length);
            vscode.postMessage({
                command: 'capture',
                data: {
                    imageBase64: dataUrl,
                    action: 'save'
                }
            });
        } catch (err) {
            console.error('[CodeShot] Capture error:', err);
            vscode.postMessage({ command: 'error', text: 'Failed to capture image: ' + (err as Error).message });
        } finally {
            saveBtn.innerText = originalText;
        }
    });

    console.log('[CodeShot] Capture listeners attached successfully.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapture);
} else {
    initCapture();
}

declare function acquireVsCodeApi(): any;
