document.getElementById('copy-btn').addEventListener('click', async () => {
    const node = document.getElementById('preview-container');
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
    vscode.postMessage({
        command: 'capture',
        data: {
            imageBase64: dataUrl,
            action: 'copy'
        }
    });
});

document.getElementById('save-btn').addEventListener('click', async () => {
    const node = document.getElementById('preview-container');
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
    vscode.postMessage({
        command: 'capture',
        data: {
            imageBase64: dataUrl,
            action: 'save'
        }
    });
});
