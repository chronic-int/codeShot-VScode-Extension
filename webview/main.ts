import * as htmlToImage from 'html-to-image';

// SINGLE CALL TO acquireVsCodeApi()
const vscode = acquireVsCodeApi();

// --- RENDERER LOGIC ---

function displayCode(html: string) {
    const output = document.getElementById('code-output');
    if (!output) return;

    if (!html) {
        output.innerHTML = '<div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>';
        return;
    }

    output.innerHTML = html;
    console.log('[CodeShot] Content updated (Host-rendered HTML)');
}

// --- CAPTURE LOGIC ---

async function captureScreenshot(): Promise<string | null> {
    const target = document.getElementById('screenshot-target');
    if (!target) {
        vscode.postMessage({ type: 'error', text: 'Critical Error: Capture target not found.' });
        return null;
    }

    try {
        vscode.postMessage({ type: 'notify', text: 'CodeShot: Capture starting...' });
        const dataUrl = await htmlToImage.toPng(target, {
            pixelRatio: 2,
            skipAutoScale: true,
            cacheBust: true
        });

        if (!dataUrl || dataUrl.length < 100) throw new Error('Invalid image data');

        vscode.postMessage({ type: 'notify', text: `CodeShot: Image generated (${Math.round(dataUrl.length / 1024)} KB)` });
        return dataUrl;
    } catch (err) {
        vscode.postMessage({ type: 'error', text: 'Capture failed: ' + (err as Error).message });
        return null;
    }
}

async function handleSave() {
    const btn = document.getElementById('save-btn') as HTMLButtonElement;
    if (!btn) return;
    btn.disabled = true;
    try {
        const dataUrl = await captureScreenshot();
        if (dataUrl) {
            vscode.postMessage({ type: 'save', image: dataUrl });
        }
    } finally {
        btn.disabled = false;
    }
}

async function handleCopy() {
    const btn = document.getElementById('copy-btn') as HTMLButtonElement;
    if (!btn) return;
    btn.disabled = true;
    try {
        const dataUrl = await captureScreenshot();
        if (dataUrl) {
            vscode.postMessage({ type: 'copy', image: dataUrl });
        }
    } finally {
        btn.disabled = false;
    }
}

// --- INITIALIZATION ---

function init() {
    console.log('[CodeShot] main.ts initializing v0.1.2 (Host-rendered)...');

    // Message Listener for pre-rendered HTML
    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.command === 'update') {
            displayCode(message.html);
        }
    });

    // Button Listeners
    const copyBtn = document.getElementById('copy-btn');
    const saveBtn = document.getElementById('save-btn');
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (saveBtn) saveBtn.addEventListener('click', handleSave);

    // Shortcuts
    window.addEventListener('keydown', (e) => {
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === 's') { e.preventDefault(); handleSave(); }
        else if (isMod && e.key === 'c' && !window.getSelection()?.toString()) { e.preventDefault(); handleCopy(); }
    });

    vscode.postMessage({ command: 'ready' });
    vscode.postMessage({ type: 'notify', text: 'CodeShot: Display Module Ready (v0.1.2)' });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

declare function acquireVsCodeApi(): any;
