import * as Prism from 'prismjs';

// Load languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

const vscode = acquireVsCodeApi();

function init() {
    console.log('Renderer initializing with PrismJS...');

    window.addEventListener('message', (event) => {
        const message = event.data;
        if (message.command === 'update') {
            const { code, language, startLine, theme } = message.payload;
            renderCode(code, language, startLine, theme);
        }
    });

    vscode.postMessage({ command: 'ready' });
}

function renderCode(code: string, language: string, startLine: number, theme: string) {
    const output = document.getElementById('code-output');
    if (!output) return;

    if (!code) {
        output.innerHTML = '<div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>';
        return;
    }

    try {
        // Map language name to Prism component name
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

        // Build line-by-line structure for line numbers and layout
        const lines = highlightedCode.split('\n');
        let finalHtml = `<pre class="language-${prismLang}"><code>`;

        lines.forEach((line, index) => {
            const currentLineNumber = startLine + index;
            const lineContent = line || ' ';
            finalHtml += `<div class="line" style="display: flex; align-items: flex-start;">
                <span class="line-number">${currentLineNumber}</span>
                <span class="line-content">${lineContent}</span>
            </div>`;
        });

        finalHtml += `</code></pre>`;
        output.innerHTML = finalHtml;

        console.log('Render complete (PrismJS)');
    } catch (err) {
        console.error('Render error:', err);
        output.innerText = code;
    }
}

init();

declare function acquireVsCodeApi(): any;
