"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shiki_1 = require("shiki");
const vscode = acquireVsCodeApi();
async function init() {
    console.log('Renderer initializing (bundled)...');
    try {
        const highlighter = await (0, shiki_1.getHighlighter)({
            theme: 'github-dark',
            langs: ['javascript', 'typescript', 'html', 'css', 'json', 'python', 'go', 'rust', 'csharp', 'cpp', 'java', 'php', 'ruby', 'shell', 'yaml', 'markdown']
        });
        console.log('Highlighter ready');
        window.addEventListener('message', async (event) => {
            const message = event.data;
            if (message.command === 'update') {
                const { code, language, startLine, theme } = message.payload;
                renderCode(highlighter, code, language, startLine, theme);
            }
        });
        vscode.postMessage({ command: 'ready' });
    }
    catch (err) {
        console.error('Failed to init highlighter:', err);
        const output = document.getElementById('code-output');
        if (output)
            output.innerText = 'Error initializing renderer: ' + err.message;
    }
}
function renderCode(highlighter, code, language, startLine, theme) {
    const output = document.getElementById('code-output');
    if (!output)
        return;
    if (!code) {
        output.innerHTML = '<div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>';
        return;
    }
    try {
        const shikiTheme = theme === '2' ? 'github-dark' : 'github-light';
        const highlightedCode = highlighter.codeToHtml(code, {
            lang: language || 'text',
            theme: shikiTheme
        });
        output.innerHTML = highlightedCode;
        const pre = output.querySelector('pre');
        if (!pre)
            return;
        const codeTag = pre.querySelector('code');
        if (!codeTag)
            return;
        const highlightedLines = codeTag.innerHTML.split('\n');
        let finalHtml = '';
        highlightedLines.forEach((line, index) => {
            const currentLineNumber = startLine + index;
            const lineContent = line || ' ';
            finalHtml += `<div class="line" style="display: flex; align-items: flex-start;">
                <span class="line-number">${currentLineNumber}</span>
                <span class="line-content">${lineContent}</span>
            </div>`;
        });
        codeTag.innerHTML = finalHtml;
        console.log('Render complete');
    }
    catch (err) {
        console.error('Render error:', err);
        output.innerText = code;
    }
}
init();
//# sourceMappingURL=index.js.map