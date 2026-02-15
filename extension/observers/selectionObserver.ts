import * as vscode from 'vscode';
import { CodeShotPanel } from '../preview/codeShotPanel';

export class SelectionObserver {
    private _disposables: vscode.Disposable[] = [];
    private _debounceTimer: NodeJS.Timeout | undefined;
    private readonly _debounceDelay = 120; // ms

    constructor(private _panelManager: CodeShotPanel) {
        vscode.window.onDidChangeTextEditorSelection(
            this._onSelectionChange,
            this,
            this._disposables
        );
        vscode.workspace.onDidChangeTextDocument(
            this._onSelectionChange,
            this,
            this._disposables
        );
    }

    private _onSelectionChange() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            this.triggerUpdate();
        }, this._debounceDelay);
    }

    public triggerUpdate() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        const language = editor.document.languageId;
        const startLine = selection.start.line + 1; // 1-indexed

        this._panelManager.update({
            code,
            language,
            startLine,
            theme: vscode.window.activeColorTheme.kind.toString()
        });
    }

    public dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
