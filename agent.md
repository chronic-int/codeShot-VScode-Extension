# 🎨 CodeShot — Syntax Color Fidelity Fix (Shiki)

## 🎯 Objective

Ensure all programming languages render with fully visible and distinct syntax colors so screenshots remain readable and visually consistent.

Currently some tokens (e.g. strings, CSS values, attributes) appear gray and low contrast, making them hard to see in exported PNG files.

---

# 🐞 Problem

Shiki is rendering certain tokens with neutral or gray colors because:

* Theme is not fully applied
* Token styles are missing
* Foreground color fallback is overriding token colors

This results in low visibility in screenshots.

---

# ✅ Expected Result

All code must display with:

* Distinct token colors
* Visible strings (e.g. yellow or orange)
* Visible keywords (e.g. blue)
* Visible attributes and values
* Proper contrast against background

The output should visually match VS Code editor highlighting.

---

# 🛠️ Implementation Fix

## 1️⃣ Ensure Theme is Loaded Explicitly

Do NOT rely on default theme.

Initialize highlighter with explicit theme:

```
const highlighter = await getHighlighter({
  theme: "github-dark" // or vscode-dark-plus equivalent
})
```

---

## 2️⃣ Force Token Color Application

When inserting highlighted HTML, ensure no CSS overrides:

```
.code-container span {
  color: inherit;
}
```

Remove any rule that sets a global color on code.

---

## 3️⃣ Apply Background and Foreground from Theme

Container must use:

```
background: #ffffff;  // A4 requirement
color: #000000;
```

Tokens will override this with inline styles from Shiki.

---

## 4️⃣ Add Fallback for Missing Token Colors

If token has no color:

Apply readable default:

```
.token {
  color: #333333;
}
```

This prevents invisible text.

---

## 5️⃣ Verify Language Detection

Ensure correct language is passed to Shiki:

```
highlighter.codeToHtml(code, { lang })
```

If language is incorrect, tokens become gray.

---

# 🧪 Validation Checklist

✔ Strings appear colored (not gray)
✔ Keywords are distinct
✔ CSS properties visible
✔ HTML attributes visible
✔ No text blends into background
✔ PNG output matches preview

---

# 🏁 Final Requirement

Every language must remain fully readable and visually rich when exported as PNG.

No syntax element should appear faded or invisible.

---

# End Task
