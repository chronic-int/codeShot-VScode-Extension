import * as Prism from 'prismjs';
import * as htmlToImage from 'html-to-image';

// Load languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

// SINGLE CALL TO acquireVsCodeApi()
const vscode = acquireVsCodeApi();

// --- RENDERER LOGIC ---

function renderCode(code: string, language: string, startLine: number, theme: string) {
    const output = document.getElementById('code-output');
    if (!output) return;

    if (!code) {
        output.innerHTML = '<div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>';
        return;
    }

    try {
        const langMap: { [key: string]: string } = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'sh': 'bash',
            'md': 'markdown'
        };
        const prismLang = langMap[language] || language || 'javascript';
        const grammar = Prism.languages[prismLang] || Prism.languages.javascript;

        const highlightedCode = Prism.highlight(code, grammar, prismLang);
        const lines = highlightedCode.split('\n');
        let finalHtml = `<pre class="language-${prismLang}"><code>`;

        lines.forEach((line, index) => {
            const currentLineNumber = startLine + index;
            const lineContent = line || '&nbsp;';
            finalHtml += `<div class="line">
                <span class="line-number">${currentLineNumber}</span>
                <span class="line-content">${lineContent}</span>
            </div>`;
        });

        finalHtml += `</code></pre>`;
        output.innerHTML = finalHtml;
        console.log('[CodeShot] Render complete');
    } catch (err) {
        console.error('[CodeShot] Render error:', err);
        output.innerText = code;
    }
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
    console.log('[CodeShot] main.ts initializing v0.1.0...');

    // Message Listener for Updates
    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.command === 'update') {
            const { code, language, startLine, theme } = message.payload;
            renderCode(code, language, startLine, theme);
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
    vscode.postMessage({ type: 'notify', text: 'CodeShot: Unified Module Ready (v0.1.0)' });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

declare function acquireVsCodeApi(): any;
