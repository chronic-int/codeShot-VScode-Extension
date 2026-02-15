import * as htmlToImage from 'html-to-image';

const vscode = acquireVsCodeApi();

/**
 * Captures the screenshot target and returns the DataURL.
 * Includes explicit error handling and status updates.
 */
async function captureScreenshot(): Promise<string | null> {
    const target = document.getElementById('screenshot-target');
    if (!target) {
        console.error('[CodeShot] Screenshot target #screenshot-target not found');
        vscode.postMessage({ command: 'error', text: 'Critical Error: Capture target not found.' });
        return null;
    }

    // Ensure dimensions are valid
    if (target.offsetWidth === 0 || target.offsetHeight === 0) {
        console.warn('[CodeShot] Target has 0 dimensions. Code might not be rendered yet.');
        return null;
    }

    try {
        console.log('[CodeShot] Starting capture...', {
            width: target.offsetWidth,
            height: target.offsetHeight
        });

        const dataUrl = await htmlToImage.toPng(target, {
            pixelRatio: 2,
            skipAutoScale: true,
            cacheBust: true
        });

        if (!dataUrl || dataUrl.length < 100) {
            throw new Error('Generated image data is empty or invalid.');
        }

        console.log('[CodeShot] Capture successful. Data size:', dataUrl.length);
        return dataUrl;
    } catch (err) {
        console.error('[CodeShot] html-to-image failed:', err);
        vscode.postMessage({ command: 'error', text: 'Image capture failed: ' + (err as Error).message });
        return null;
    }
}

async function handleSave() {
    const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    if (!saveBtn) return;

    const originalText = saveBtn.innerText;
    saveBtn.innerText = 'Preparing...';
    saveBtn.disabled = true;

    try {
        const dataUrl = await captureScreenshot();
        if (dataUrl) {
            vscode.postMessage({
                command: 'capture',
                data: {
                    imageBase64: dataUrl,
                    action: 'save'
                }
            });
        }
    } finally {
        saveBtn.innerText = originalText;
        saveBtn.disabled = false;
    }
}

async function handleCopy() {
    const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
    if (!copyBtn) return;

    const originalText = copyBtn.innerText;
    copyBtn.innerText = 'Capturing...';
    copyBtn.disabled = true;

    try {
        const dataUrl = await captureScreenshot();
        if (dataUrl) {
            // Try native clipboard first (fastest)
            try {
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                console.log('[CodeShot] Native clipboard write successful');
                vscode.postMessage({ command: 'notify', text: 'Image copied to clipboard!' });
            } catch (err) {
                console.warn('[CodeShot] Native clipboard failed, falling back to extension:', err);
                vscode.postMessage({
                    command: 'capture',
                    data: {
                        imageBase64: dataUrl,
                        action: 'copy'
                    }
                });
            }
        }
    } finally {
        copyBtn.innerText = originalText;
        copyBtn.disabled = false;
    }
}

function init() {
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');

    if (!copyBtn || !saveBtn) {
        console.warn('[CodeShot] Buttons not found, retrying...');
        setTimeout(init, 100);
        return;
    }

    copyBtn.addEventListener('click', handleCopy);
    saveBtn.addEventListener('click', handleSave);

    // Shortcuts
    window.addEventListener('keydown', (e) => {
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === 's') {
            e.preventDefault();
            handleSave();
        } else if (isMod && e.key === 'c') {
            if (window.getSelection()?.toString() === '') {
                e.preventDefault();
                handleCopy();
            }
        }
    });

    console.log('[CodeShot] Capture module initialized (v0.0.5)');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

declare function acquireVsCodeApi(): any;
