# 🛠️ Fix Renderer Initialization — Shiki Not Defined

## 🎯 Problem

The preview renderer fails to initialize with the error:

```
shiki is not defined
```

This occurs because VS Code Webviews run in a browser-like sandbox and cannot directly use Node-style imports unless properly bundled.

---

# ✅ Goal

Ensure the syntax highlighting engine loads correctly inside the Webview environment without runtime errors.

---

# 🧠 Root Cause

Shiki is currently being referenced as a global or Node import, but:

* Webviews do not support Node resolution
* Dependencies must be bundled for browser execution
* The renderer script is likely not compiled/bundled

---

# 🛠️ Required Fix

## 1️⃣ Bundle the Webview Renderer

Use a bundler (recommended: **esbuild**) to produce a browser-compatible script.

The renderer entry file (example):

```
webview/renderer/index.ts
```

Must be bundled into:

```
webview/dist/renderer.js
```

---

## 2️⃣ Install Dependencies

```
npm install shiki
npm install -D esbuild
```

---

## 3️⃣ Create Build Script

Add script:

```
"build:webview": "esbuild webview/renderer/index.ts --bundle --platform=browser --outfile=webview/dist/renderer.js"
```

---

## 4️⃣ Load Script in Webview HTML

Ensure the Webview HTML references the bundled file:

```
<script src="renderer.js"></script>
```

Use `webview.asWebviewUri` when constructing the path.

---

## 5️⃣ Initialize Shiki Properly

Inside renderer:

```
import { getHighlighter } from "shiki"

const highlighter = await getHighlighter({
  theme: "vscode-dark"
})
```

Do not rely on global variables.

---

## 6️⃣ Add Fallback

If highlighter fails:

Render plain text to avoid blank preview.

---

# 🧪 Validation Steps

1. Open preview panel
2. Check DevTools console (Webview)
3. Confirm no “shiki not defined” error
4. Confirm highlighted code appears

---

# 🏁 Acceptance Criteria

✔ Renderer loads without errors
✔ Shiki initializes successfully
✔ Preview renders highlighted code
✔ No global undefined references

---

# End of Fix Instruction
