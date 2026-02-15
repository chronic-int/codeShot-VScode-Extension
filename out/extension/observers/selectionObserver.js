"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectionObserver = void 0;
const vscode = __importStar(require("vscode"));
class SelectionObserver {
    _panelManager;
    _disposables = [];
    _debounceTimer;
    _debounceDelay = 120; // ms
    constructor(_panelManager) {
        this._panelManager = _panelManager;
        vscode.window.onDidChangeTextEditorSelection(this._onSelectionChange, this, this._disposables);
        vscode.workspace.onDidChangeTextDocument(this._onSelectionChange, this, this._disposables);
    }
    _onSelectionChange() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            this.triggerUpdate();
        }, this._debounceDelay);
    }
    triggerUpdate() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
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
    dispose() {
        this._disposables.forEach(d => d.dispose());
    }
}
exports.SelectionObserver = SelectionObserver;
//# sourceMappingURL=selectionObserver.js.map