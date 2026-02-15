import * as vscode from 'vscode';
import { SelectionObserver } from '../observers/selectionObserver';
import { CodeShotPanel } from '../preview/codeShotPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeShot is now active!');

    const panelManager = new CodeShotPanel(context);
    const selectionObserver = new SelectionObserver(panelManager);

    let disposable = vscode.commands.registerCommand('codeshot.capture', () => {
        panelManager.createOrShow();
        selectionObserver.triggerUpdate();
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(selectionObserver);
}

export function deactivate() { }
