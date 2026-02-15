# 🧩 CodeShot — Output Pipeline & Large Page Scroll Fix

## 🎯 Objective

Fix the screenshot export pipeline and improve usability when the A4 page becomes very large.

The user must be able to:

* Save PNG reliably
* Copy image to clipboard
* Scroll when preview is larger than viewport

---

# 🐞 Current Issues

1. Save as PNG button does not save file
2. Copy to Clipboard does not copy image
3. Large A4 pages overflow without proper scroll

---

# ✅ 1️⃣ Fix Save as PNG Pipeline

## Required Flow

1. User clicks **Save as PNG**
2. Webview captures A4 container
3. PNG base64 generated
4. Message sent to extension
5. Extension opens Save dialog
6. File written successfully

---

## Implementation Requirements

### Webview

* Ensure capture function returns image
* Use `postMessage({ type: "save", image })`

### Extension Host

Must handle message:

```
if (message.type === "save") {
  const uri = await vscode.window.showSaveDialog(...)
  await vscode.workspace.fs.writeFile(uri, buffer)
}
```

---

## Critical Checks

✔ Ensure image string is not empty
✔ Ensure message listener exists
✔ Ensure async write is awaited
✔ Add error logs

---

# ✅ 2️⃣ Fix Copy to Clipboard

## Expected Behavior

Clicking copy must place PNG image into system clipboard.

---

## Implementation

Must be handled in Extension Host (not Webview):

```
vscode.env.clipboard.writeBuffer(buffer)
```

Webview sends:

```
postMessage({ type: "copy", image })
```

---

## Important

Do NOT use:

❌ navigator.clipboard

It does not support binary image reliably in Webviews.

---

# ✅ 3️⃣ Large Page Scroll Behavior

When A4 page becomes larger than viewport:

The preview container must allow scrolling.

---

## Layout Rules

Outer container:

```
height: 100vh;
overflow: auto;
```

A4 page remains centered.

This ensures:

✔ Smooth navigation
✔ No layout break
✔ Screenshot still captures full page

---

# 🧪 Validation Checklist

After fixes:

✔ Save dialog opens
✔ PNG saved successfully
✔ Clipboard paste inserts image
✔ Large previews scroll smoothly
✔ Screenshot includes full page
✔ No console errors

---

# 🏁 Final Requirement

Exporting and copying screenshots must feel instant, reliable, and seamless.

No clicks should fail silently.

---

# End Task
