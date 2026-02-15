# 🛠️ CodeShot — Fix & Enhancement Prompt

## 🎯 Objective

Resolve rendering and preview issues so that the CodeShot preview accurately reflects the selected code exactly as it appears in the VS Code editor.

The preview must be reliable, visually accurate, and ready for high-quality screenshots intended for insertion into Word documents.

---

# 🐞 Current Issues to Fix

1. The code is not displayed in the preview panel
2. Selecting code does not update the preview
3. Live preview remains blank after selection
4. Code formatting does not match the editor
5. Theme colors are not applied
6. Code is not rendered with consistent font size

---

# ✅ Expected Behavior

## 1️⃣ Accurate Code Rendering

The preview must display the selected code:

* Exactly as it appears in the editor
* Preserving indentation
* Preserving spacing
* Preserving line breaks

No transformations or formatting changes.

---

## 2️⃣ Real-Time Preview Update

When the user:

* Selects code
* Changes selection
* Edits the code

The preview must update automatically (debounced ~120ms).

---

## 3️⃣ Theme Synchronization

The preview must use the **active VS Code theme colors**.

This includes:

* Syntax highlight tokens
* Background tone
* Foreground colors

Use the same color mapping used by the editor.

---

## 4️⃣ Font Requirements

The preview must render code with:

* Monospaced font stack
* Font size **12pt equivalent**

Implementation detail:

Use CSS font size that visually matches **Word size 12**
(≈ 16px in most environments, adjust if needed for visual parity).

This is critical for screenshots used in academic documents.

---

## 5️⃣ Line Structure Integrity

The layout must:

* Align line numbers perfectly
* Keep vertical spacing consistent
* Match editor line height as closely as possible

---

# 🧠 Technical Implementation Notes

## Data Flow Validation

Ensure:

1. SelectionObserver correctly captures text
2. Payload is sent to Webview
3. Webview receives message
4. Renderer updates DOM

Add temporary logs if needed to confirm message flow.

---

## Rendering Engine

Confirm that:

* Syntax highlighting engine is initialized
* Language is correctly detected
* Tokens are applied before render

---

## Fallback Behavior

If highlighting fails:

Render plain text (never blank).

---

# 🧪 Acceptance Criteria

The task is complete when:

✔ Selecting code immediately shows it in preview
✔ Preview matches editor structure exactly
✔ Theme colors are visible
✔ Font visually equals size 12 in Word
✔ Live preview updates reliably
✔ No blank preview states occur

---

# 🏁 Final Requirement

The preview must feel **pixel-faithful to the editor**,
so that screenshots can be used directly in documentation without adjustments.

---

# End of Prompt
