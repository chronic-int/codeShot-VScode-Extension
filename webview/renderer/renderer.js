const vscode = acquireVsCodeApi();

async function init() {
    console.log('Renderer initializing...');
    try {
        const highlighter = await shiki.getHighlighter({
            theme: 'github-dark', // Initial theme
            langs: ['javascript', 'typescript', 'html', 'css', 'json', 'python', 'go', 'rust', 'csharp', 'cpp', 'java', 'php', 'ruby', 'shell', 'yaml', 'markdown']
        });
        console.log('Highlighter ready');

        window.addEventListener('message', async (event) => {
            const message = event.data;
            console.log('Message received in webview:', message.command);
            if (message.command === 'update') {
                const { code, language, startLine, theme } = message.payload;
                console.log('Updating preview with language:', language, 'and lines:', code.split('\n').length);
                renderCode(highlighter, code, language, startLine, theme);
            }
        });

        // Signal that we are ready
        vscode.postMessage({ command: 'ready' });
    } catch (err) {
        console.error('Failed to init highlighter:', err);
        document.getElementById('code-output').innerText = 'Error initializing renderer: ' + err.message;
    }
}

function renderCode(highlighter, code, language, startLine, theme) {
    const output = document.getElementById('code-output');

    if (!code) {
        output.innerHTML = '<div style="color: #666; font-style: italic;">Select code in the editor to see preview...</div>';
        return;
    }

    try {
        // Try to sync theme if possible, otherwise fallback
        const shikiTheme = theme === '2' ? 'github-dark' : 'github-light';

        const highlightedCode = highlighter.codeToHtml(code, {
            lang: language || 'text',
            theme: shikiTheme
        });

        output.innerHTML = highlightedCode;

        const pre = output.querySelector('pre');
        if (!pre) return;

        const codeTag = pre.querySelector('code');
        if (!codeTag) return;

        const highlightedLines = codeTag.innerHTML.split('\n');
        let finalHtml = '';

        highlightedLines.forEach((line, index) => {
            const currentLineNumber = startLine + index;
            // Ensure line content is at least a space if empty to maintain height
            const lineContent = line || ' ';
            finalHtml += `<div class="line" style="display: flex; align-items: flex-start;">
                <span class="line-number">${currentLineNumber}</span>
                <span class="line-content">${lineContent}</span>
            </div>`;
        });

        codeTag.innerHTML = finalHtml;
        console.log('Render complete');
    } catch (err) {
        console.error('Render error:', err);
        output.innerText = code; // Fallback to plain text
    }
}

init();
