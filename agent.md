# 🧩 CodeShot — A4 Layout & Save Pipeline Fix

## 🎯 Objective

Restore the A4 document layout and ensure screenshot saving works reliably.

The preview must look like a printable document, not an editor panel.

---

# 🐞 Current Problems

1. The A4 sheet is not visible (background is dark)
2. Preview looks like editor instead of document
3. Long lines scroll but A4 does not expand
4. Save as PNG button does not trigger save dialog

---

# ✅ 1️⃣ Restore A4 Document Layout

## Requirements

The preview must have 2 layers:

1. VS Code background (outer container)
2. White A4 page (inner container)

---

## A4 Container CSS

```
.a4-page {
  background: #ffffff;
  width: 794px;
  margin: 24px auto;
  padding: 40px;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.08);
}
```

The page must always be white regardless of theme.

---

# ✅ 2️⃣ Dynamic Page Expansion

If code is long:

### Vertical

Page grows automatically

### Horizontal

Page width expands to fit longest line

Implementation:

```
width: fit-content;
min-width: 794px;
```

This ensures:

✔ No line clipping
✔ No forced wrapping
✔ Screenshot matches content

---

# ✅ 3️⃣ Code Container Rules

Inside A4:

```
white-space: pre;
overflow: visible;
```

The page itself handles size.

---

# ✅ 4️⃣ Fix Save as PNG

## Expected Flow

Click Save →

1. Capture DOM
2. Convert to PNG
3. Send base64 to extension
4. Open save dialog
5. Write file

---

## Debug Checklist

Confirm:

* Capture function returns image
* postMessage sent with image
* Extension receives message
* showSaveDialog executes
* File write completes

Add logging at each step.

---

# ✅ 5️⃣ Screenshot Target

Important:

Capture ONLY the A4 container
NOT the whole webview

---

# 🧪 Acceptance Criteria

✔ White A4 page visible
✔ Code sits inside document layout
✔ Page expands with long lines
✔ No wrapping
✔ Save dialog opens
✔ PNG saved correctly
✔ Screenshot matches preview

---

# 🏁 Final Requirement

The preview must look like a printable code document ready for export.

---

# End Task
