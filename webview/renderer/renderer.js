const vscode = acquireVsCodeApi();

async function init() {
    const highlighter = await shiki.getHighlighter({
        theme: 'nord', // Default theme, will be updated
        langs: ['javascript', 'typescript', 'html', 'css', 'json', 'python', 'go', 'rust']
    });

    window.addEventListener('message', async (event) => {
        const message = event.data;
        if (message.command === 'update') {
            const { code, language, startLine, theme } = message.payload;
            renderCode(highlighter, code, language, startLine, theme);
        }
    });
}

function renderCode(highlighter, code, language, startLine, theme) {
    const output = document.getElementById('code-output');

    // Simple line numbering logic combined with Shiki
    const lines = code.split('\n');
    const highlightedCode = highlighter.codeToHtml(code, { lang: language });

    // Wrap lines with line numbers
    // This is a simplified approach, a more robust one would parse the Shiki output
    // but for MVP this might suffice if we inject line numbers.
    output.innerHTML = highlightedCode;

    const pre = output.querySelector('pre');
    const codeTag = pre.querySelector('code');
    const highlightedLines = codeTag.innerHTML.split('\n');

    let finalHtml = '';
    highlightedLines.forEach((line, index) => {
        const currentLineNumber = startLine + index;
        finalHtml += `<div class="line"><span class="line-number">${currentLineNumber}</span>${line}</div>`;
    });

    codeTag.innerHTML = finalHtml;
}

init();
