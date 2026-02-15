# 📸 CodeShot — Full Agent Development Specification

---

# 🧭 Purpose

This document defines the **complete functional, technical, and architectural specification** for building the CodeShot VS Code extension.

You (implementation agent) are responsible for **development execution only**.
All product, UX, and architecture decisions are finalized here.

The extension must be:

* Lightweight
* Highly optimized
* Stable on low and high spec machines
* Fully internal to VS Code
* Easy and intuitive to use
* Free of crashes, freezes, or compatibility issues

---

# 🎯 Product Goal

Build a VS Code extension that:

1. Captures selected code from the editor
2. Displays a real-time preview in a split tab
3. Renders code inside a white A4 layout
4. Maintains real file line numbers
5. Generates a high-quality screenshot
6. Allows copying to clipboard
7. Allows saving via native Save dialog

---

# 🧑‍💻 User Experience Requirements

## Installation

Works immediately after install.

No onboarding
No configuration required

---

## Context Menu

When user right-clicks inside editor:

**Capture Code Screenshot**

---

## Keyboard Shortcut

```
Ctrl + Alt + J
```

Must be configurable via VS Code keybindings.

---

# 🪜 User Flow

1. User opens file
2. User selects code
3. User triggers command
4. Preview tab opens (split view)
5. A4 preview renders instantly
6. Preview updates in real time
7. User captures screenshot
8. User copies or saves

---

# 🖥️ Preview Behavior

## Layout

* White A4 sheet style
* Fixed width
* Dynamic height
* Centered content
* Consistent margins

---

## 📐 A4 Dimensions

Width ≈ **794px**
Height = dynamic based on lines

```
height = (lineCount × lineHeight) + padding
```

---

# 🔢 Line Numbers

Must:

* Match actual file lines
* Start from first selected line
* Never reset to 1
* Align perfectly

Example:

Selection starts at line 522 → preview shows 522, 523…

---

# ⚡ Real-Time Preview

Preview updates when:

* Selection changes
* File content changes
* Theme changes

Debounce updates ~120ms.

---

# 🧠 Performance Principles

The extension must:

* Never block UI thread
* Avoid heavy frameworks
* Lazy load preview engine
* Use minimal memory
* Handle large selections safely

Performance targets:

* Preview open < 100ms
* Render update < 16ms average

---

# 🧩 Technical Architecture

## Extension Host (TypeScript)

Responsibilities:

* Command registration
* Selection observation
* Data extraction
* Clipboard integration
* Save dialog
* Webview messaging

---

## Webview (Preview Panel)

Responsibilities:

* Render A4 layout
* Syntax highlight
* Line mapping
* Screenshot generation

Must run entirely inside VS Code sandbox.

---

# 🧠 Rendering Engine

## Syntax Highlight

Use **Shiki (embedded lightweight build)**

Reasons:

* Matches VS Code themes
* High fidelity
* Lightweight

---

## Screenshot Engine

Use **html-to-image (minimal build)**

Requirements:

* High DPI rendering
* Pixel accurate output
* No external services

---

# 📸 Image Quality Requirements

* Render at ≥2× devicePixelRatio
* Maintain font smoothing
* Preserve spacing
* Crisp when zoomed

---

# 💾 Save Screenshot Behavior

## Save Dialog

When user chooses save:

Open **native VS Code Save dialog**

User selects:

* File name
* Location
* Folder

---

## Default Values

Filename: `codeshot.png`

Location priority:

1. Last used folder
2. Workspace root
3. OS default

---

## Behavior Rules

✔ Cancel → no error
✔ Overwrite handled by OS
✔ Async operation
✔ Non-blocking

---

## Error Handling

If save fails:

* Show friendly error message
* Do not crash
* Allow retry

---

# 🧾 Data Contracts

## PreviewPayload

```
{
  code: string
  language: string
  startLine: number
  theme: string
}
```

## CaptureResult

```
{
  imageBase64: string
}
```

---

# 🧱 Folder Structure (Required)

```
codeshot/

extension/
  core/
    extension.ts
  commands/
  observers/
  services/
  preview/

webview/
  renderer/
  layout/
  capture/
  state/

assets/
  styles/
  fonts/

shared/
  types.ts
```

---

# 🔄 Event Flow

## Selection Update

1. Editor selection changes
2. Payload serialized
3. Sent to webview
4. Renderer updates preview

---

## Capture Flow

1. User triggers capture
2. DOM rendered final
3. Converted to image
4. Base64 returned
5. Clipboard or save

---

# ⚠️ Stability Requirements

The extension must:

* Work on low-spec machines
* Avoid CPU spikes
* Avoid memory leaks
* Avoid render loops
* Handle empty selections

---

# 🧪 Edge Cases

Handle safely:

* No selection
* Large selections
* Unsupported language
* Editor not focused
* Rapid selection changes
* No workspace open

---

# 🧩 Accessibility & Usability

Must ensure:

* Clear visual hierarchy
* Smooth updates
* No flickering
* Instant feedback
* Minimal user effort

---

# 🚀 MVP Scope

Must include:

* Command + context menu
* Keyboard shortcut
* Split preview
* A4 layout
* Real line numbers
* Real-time updates
* Screenshot capture
* Clipboard copy
* Native save dialog

---

# ❌ Out of Scope

* Export formats beyond PNG
* Settings UI
* Theme customization
* Cloud sync
* Multi-file capture

---

# 🧠 Definition of Done

The extension is complete when:

1. Preview visually matches editor
2. Line numbers are accurate
3. Screenshot is sharp
4. Save dialog works
5. Performance is smooth
6. No crashes or freezes
7. Works immediately after install

---

# 🏁 Final Principle

The extension must feel:

* Instant
* Native
* Reliable
* Effortless

If a technical decision risks performance or stability,
always choose the **simplest and most efficient solution**.

---

# ✅ End of Specification
