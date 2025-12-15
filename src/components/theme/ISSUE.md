# Theme System - Known Issues & Troubleshooting

## Table of Contents

1. [Known Issues](#known-issues)
2. [Common Problems](#common-problems)
3. [Browser Compatibility](#browser-compatibility)
4. [Performance Issues](#performance-issues)
5. [Color & Contrast Problems](#color--contrast-problems)
6. [Import/Export Issues](#importexport-issues)
7. [State Management Issues](#state-management-issues)
8. [Debugging Guide](#debugging-guide)
9. [FAQ](#faq)

---

## Known Issues

### 1. FOUC (Flash of Unstyled Content) on Initial Load

**Status**: Known limitation
**Severity**: Low
**Affects**: First page load only

**Problem**:
Brief flash of default theme before user's saved theme loads from localStorage.

**Cause**:
React hydration happens after initial HTML render. Theme CSS variables are injected client-side.

**Workaround**:

```tsx
// In app/layout.tsx, add inline script BEFORE body
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const stored = localStorage.getItem('theme-editor-storage');
        if (stored) {
          const data = JSON.parse(stored);
          const mode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          const styles = data.state?.themeState?.styles?.[mode];
          if (styles) {
            Object.entries(styles).forEach(([key, value]) => {
              document.documentElement.style.setProperty('--' + key, value);
            });
          }
        }
      } catch (e) {}
    `,
  }}
/>
```

**Status**: Planned improvement in v2.1

---

### 2. Safari Color Rendering Differences

**Status**: Browser limitation
**Severity**: Medium
**Affects**: Safari 15.x and older

**Problem**:
OKLCH colors may render slightly differently in Safari compared to Chrome/Firefox.

**Cause**:
Safari's color space conversion algorithms differ from other browsers.

**Workaround**:

- Use Safari's Color Sync utility to test
- Consider providing sRGB fallbacks for critical colors

```css
/* Example fallback pattern */
.my-element {
  background: oklch(0.5 0.2 200);
  background: color(display-p3 0.3 0.5 0.8); /* Safari fallback */
}
```

**Reference**: [WebKit Color Spaces](https://webkit.org/blog/10042/wide-gamut-color-in-css-with-display-p3/)

---

### 3. Preset Import Race Condition

**Status**: Fixed in v2.0
**Severity**: Low
**Affects**: Theme provider initialization

**Problem**:
Preset gallery shows "No presets available" briefly on first render.

**Cause**:
Theme provider registers presets asynchronously.

**Solution**:
Added retry mechanism in `usePresetThemes()` hook (100ms delay).

```tsx
// Already implemented in use-theme.ts
if (presetsArray.length === 0) {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const retryPresets = Object.values(presetStore.getAllPresets())
  setPresets(retryPresets)
}
```

---

### 4. Contrast Calculation Accuracy

**Status**: Acceptable limitation
**Severity**: Low
**Affects**: Edge cases with very low chroma colors

**Problem**:
OKLCH to sRGB conversion introduces minor rounding errors (~0.1 contrast ratio difference).

**Impact**:
Colors that are borderline WCAG AA (4.49:1) might show as passing when they should fail.

**Mitigation**:
Add 0.1 buffer to target contrast ratios in production code.

```tsx
// Instead of 4.5, use 4.6 for safety margin
const adjusted = ensureContrast(foreground, background, 4.6)
```

---

## Common Problems

### Problem 1: Theme Not Applying After Switch

**Symptoms**:

- Click preset theme but UI doesn't update
- Some components update, others don't

**Common Causes**:

#### A. Component Using Hardcoded Colors

```tsx
// ❌ This component won't respond to theme changes
<div className="bg-white dark:bg-gray-900">

// ✅ Fix: Use semantic tokens
<div className="bg-background">
```

**Solution**: Search for hardcoded colors in your component:

```bash
# Find hardcoded Tailwind colors
grep -r "bg-white\|bg-gray-\|text-black" src/components/
```

#### B. Stale CSS Variables in Browser Cache

```tsx
// Clear CSS variables and reload
localStorage.removeItem("theme-editor-storage")
localStorage.removeItem("editor-storage")
location.reload()
```

**Solution**: Add cache-busting meta tag:

```html
<meta
  http-equiv="Cache-Control"
  content="no-cache, no-store, must-revalidate"
/>
```

#### C. Zustand State Out of Sync

**Solution**: Reset Zustand store:

```tsx
import { useEditorStore } from "@/store/theme-editor-store"

// In your component
const resetTheme = () => {
  useEditorStore.getState().resetToCurrentPreset()
}
```

---

### Problem 2: Imported Theme Colors Look Wrong

**Symptoms**:

- Imported theme has incorrect colors
- Theme preview doesn't match exported version

**Causes**:

#### A. OKLCH Format Mismatch

Exported theme might use different OKLCH format.

**Solution**: Validate OKLCH strings on import:

```tsx
import { parseOKLCH } from "@/lib/theme-utils"

// Validate each color
Object.values(importedTheme.styles.light).forEach((color) => {
  if (!parseOKLCH(color)) {
    throw new Error(`Invalid OKLCH color: ${color}`)
  }
})
```

#### B. Missing Required Tokens

Imported theme missing some semantic tokens.

**Solution**: Merge with default theme:

```tsx
import {
  defaultDarkThemeStyles,
  defaultLightThemeStyles,
} from "@/components/theme/config"

const safeImport = {
  light: { ...defaultLightThemeStyles, ...importedTheme.light },
  dark: { ...defaultDarkThemeStyles, ...importedTheme.dark },
}
```

#### C. Incorrect Color Space

Theme exported from another tool using HSL/RGB instead of OKLCH.

**Solution**: Convert on import (not yet implemented - manual conversion needed).

---

### Problem 3: Contrast Warnings for Accessible Themes

**Symptoms**:

- Theme passes WCAG checkers but fails our validation
- Contrast ratio lower than expected

**Causes**:

#### A. Different Calculation Methods

Our implementation uses WCAG 2.1 relative luminance formula. Some tools use approximations.

**Solution**: Use our built-in checker as source of truth:

```tsx
import { checkContrast } from "@/lib/theme-utils"

const result = checkContrast(foreground, background)
console.log("Actual ratio:", result.ratio)
console.log("WCAG level:", result.level)
```

#### B. Alpha Channel Not Considered

Colors with transparency may have different effective contrast.

**Solution**: Flatten alpha channel before checking:

```tsx
// For semi-transparent foreground on solid background
const effectiveColor = "oklch(...)" // Calculate blended color
const result = checkContrast(effectiveColor, background)
```

---

### Problem 4: Dark Mode Colors Too Similar to Light Mode

**Symptoms**:

- Dark mode looks washed out
- Insufficient contrast in dark mode

**Cause**:
Light mode colors directly inverted without adjusting chroma/lightness.

**Solution**: Use proper dark mode color adjustments:

```tsx
// ❌ Bad: Direct inversion
light: {
  primary: "oklch(0.3 0.2 200)"
}
dark: {
  primary: "oklch(0.7 0.2 200)"
} // Same chroma

// ✅ Good: Adjust chroma and lightness
light: {
  primary: "oklch(0.3 0.25 200)"
} // Higher chroma for light
dark: {
  primary: "oklch(0.75 0.15 200)"
} // Lower chroma for dark
```

**Guidelines**:

- **Light mode**: L: 0.2-0.6, C: 0.15-0.25
- **Dark mode**: L: 0.7-0.9, C: 0.08-0.15

---

### Problem 5: Font Loading Delays (FOUT)

**Symptoms**:

- Text appears in fallback font briefly
- Layout shift when custom font loads

**Cause**:
Google Fonts loaded asynchronously.

**Solution**: Preload fonts in `head`:

```tsx
// In app/layout.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

**Advanced**: Use `font-display: swap` in `dynamic-font-loader.tsx`:

```tsx
// Already implemented, but verify CSS injection includes:
font-display: swap;
```

---

## Browser Compatibility

### Supported Browsers

| Browser          | Version | OKLCH Support | Issues                  |
| ---------------- | ------- | ------------- | ----------------------- |
| Chrome           | 111+    | ✅ Native     | None                    |
| Firefox          | 113+    | ✅ Native     | None                    |
| Safari           | 15.4+   | ✅ Native     | Minor color differences |
| Edge             | 111+    | ✅ Native     | None                    |
| Samsung Internet | 20+     | ✅ Native     | None                    |
| Opera            | 97+     | ✅ Native     | None                    |

### Fallback Strategy

For older browsers, OKLCH colors may not render correctly.

**Detection**:

```tsx
const supportsOKLCH = CSS.supports("color", "oklch(0.5 0.2 200)")
```

**Fallback** (not yet implemented):
Consider adding automatic sRGB fallbacks for older browsers.

---

## Performance Issues

### Problem: Slow Theme Switching (> 200ms)

**Symptoms**:

- Noticeable delay when clicking preset
- UI freezes briefly

**Causes**:

#### A. Too Many CSS Variable Updates

Updating all 40+ CSS variables at once can be slow on low-end devices.

**Solution**: Batch updates using `requestAnimationFrame`:

```tsx
requestAnimationFrame(() => {
  Object.entries(styles).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}`, value)
  })
})
```

#### B. Excessive Re-renders

Components re-rendering unnecessarily on theme change.

**Solution**: Use `React.memo` for expensive components:

```tsx
export const ExpensiveComponent = React.memo(({ theme }) => {
  // Component logic
})
```

#### C. Zustand Store Updates Triggering Watchers

**Solution**: Use shallow equality for selectors:

```tsx
import shallow from "zustand/shallow"

const { themeState } = useEditorStore(
  (state) => ({ themeState: state.themeState }),
  shallow
)
```

---

### Problem: Large Bundle Size (> 100KB)

**Symptoms**:

- Slow initial page load
- High JavaScript bundle size

**Cause**:
`presets.ts` contains 160+ themes (~45KB).

**Solution**: Lazy load presets:

```tsx
// Already implemented via React.lazy()
const PresetGallery = React.lazy(() => import("./preset-gallery"))
```

**Verify**: Check bundle size:

```bash
pnpm build
# Look for theme-related chunks in .next/static/chunks/
```

---

## Color & Contrast Problems

### Problem: Colors Appear Washed Out

**Symptoms**:

- Colors look desaturated
- Theme lacks vibrancy

**Cause**:
Chroma (C value) too low.

**Solution**: Increase chroma for primary colors:

```tsx
// ❌ Too muted
primary: "oklch(0.5 0.05 200)" // C = 0.05

// ✅ More vibrant
primary: "oklch(0.5 0.20 200)" // C = 0.20
```

**Guidelines**:

- **UI backgrounds**: C: 0.01-0.05
- **Buttons/CTAs**: C: 0.15-0.25
- **Decorative elements**: C: 0.20-0.40

---

### Problem: Text Hard to Read

**Symptoms**:

- Low contrast between text and background
- Fails WCAG checkers

**Solution**: Use `ensureContrast()` utility:

```tsx
import { ensureContrast } from "@/lib/theme-utils"

const safeColor = ensureContrast(
  textColor, // Foreground
  backgroundColor, // Background
  4.5 // WCAG AA for normal text
)
```

**Quick Fix**: Increase lightness difference:

```tsx
// ❌ Poor contrast
background: "oklch(0.6 0.1 200)"
foreground: "oklch(0.5 0.1 200)" // Only 0.1 L difference

// ✅ Good contrast
background: "oklch(0.9 0.05 200)"
foreground: "oklch(0.2 0.1 200)" // 0.7 L difference
```

---

## Import/Export Issues

### Problem: Export Button Not Working

**Symptoms**:

- Click "Export Theme" but nothing happens
- No download prompt

**Causes**:

#### A. Pop-up Blocker

Browser blocking automatic download.

**Solution**: User must click "Allow" in browser popup blocker.

#### B. Insufficient Permissions

File system access denied.

**Solution**: Request permissions explicitly:

```tsx
// Check if downloads are blocked
if (!document.createElement("a").download) {
  alert("Your browser does not support downloads")
}
```

#### C. Theme State Empty

**Solution**: Validate state before export:

```tsx
if (!themeState || !themeState.styles) {
  toast.error("No active theme to export")
  return
}
```

---

### Problem: Import Fails with "Invalid Format"

**Symptoms**:

- Import shows error message
- Theme JSON appears valid

**Causes**:

#### A. Missing Required Fields

Theme JSON missing `styles.light` or `styles.dark`.

**Solution**: Validate structure:

```tsx
if (!theme.styles?.light || !theme.styles?.dark) {
  throw new Error("Theme must include both light and dark styles")
}
```

#### B. Invalid JSON

File contains syntax errors.

**Solution**: Use JSON validator before import:

```bash
# Validate JSON file
cat theme.json | jq .
```

#### C. Wrong File Type

Imported file is not JSON.

**Solution**: Check MIME type:

```tsx
if (file.type !== "application/json") {
  toast.error("Please upload a JSON file")
  return
}
```

---

## State Management Issues

### Problem: Undo/Redo Not Working

**Symptoms**:

- Undo button does nothing
- History stack empty

**Causes**:

#### A. History Threshold

Changes too rapid - debounced within 500ms.

**Solution**: Wait 500ms between significant changes for history entry.

#### B. History Stack Full

Max 30 entries reached, oldest discarded.

**Solution**: Increase `MAX_HISTORY_COUNT` in `theme-editor-store.ts`:

```tsx
const MAX_HISTORY_COUNT = 50 // Increase from 30
```

#### C. Mode-Only Changes

Switching light/dark mode doesn't create history entry (by design).

**Expected behavior**: Only color/style changes create undo points.

---

### Problem: Theme Not Persisting Across Sessions

**Symptoms**:

- Theme resets to default on page reload
- User preferences not saved

**Causes**:

#### A. localStorage Disabled

Private browsing or browser settings blocking localStorage.

**Solution**: Detect and warn user:

```tsx
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
} catch (e) {
  alert('localStorage disabled - theme won't persist')
}
```

#### B. Zustand Persist Not Working

**Solution**: Check browser console for errors. Ensure `zustand/middleware` installed:

```bash
pnpm list zustand
```

#### C. Database Save Failing

**Solution**: Check server action response:

```tsx
const result = await saveUserTheme(formData)
if (result.error) {
  console.error("Database save failed:", result.error)
}
```

---

## Debugging Guide

### Enable Debug Mode

Add to your component:

```tsx
"use client"

import { useEffect } from "react"

useEffect(() => {
  // Log all CSS variables
  const styles = getComputedStyle(document.documentElement)
  const allVars = Array.from(document.documentElement.style)
    .filter((key) => key.startsWith("--"))
    .map((key) => `${key}: ${styles.getPropertyValue(key)}`)

  console.log("Active CSS Variables:", allVars)
}, [])
```

### Inspect Theme State

```tsx
import { useEditorStore } from "@/store/theme-editor-store"

// In component
const state = useEditorStore.getState()
console.log("Theme State:", JSON.stringify(state.themeState, null, 2))
console.log("History Length:", state.history.length)
console.log("Can Undo:", state.canUndo())
```

### Check Contrast Ratios

```tsx
import { getContrastRatio } from "@/lib/theme-utils"

// For any element
const fg = getComputedStyle(element).color
const bg = getComputedStyle(element).backgroundColor
const ratio = getContrastRatio(fg, bg)
console.log("Contrast Ratio:", ratio)
```

### Monitor Performance

```tsx
// Measure theme switch time
const start = performance.now()
applyThemePreset("zinc")
requestAnimationFrame(() => {
  console.log("Theme switch took:", performance.now() - start, "ms")
})
```

---

## FAQ

### Q: Can I use HSL/RGB colors instead of OKLCH?

**A**: Not recommended. The system is built around OKLCH for:

- Perceptual uniformity
- Accurate contrast calculations
- Future-proof color spaces

If you must use RGB, convert to OKLCH first (manual conversion needed).

---

### Q: How many custom themes can a user save?

**A**: No hard limit, but recommended maximum is 50 per user for performance reasons.

---

### Q: Can themes be shared between schools?

**A**: Yes! Export theme JSON and share file. Import works across any school tenant.

---

### Q: Do themes work with custom CSS?

**A**: Mostly. Custom CSS using semantic tokens (`bg-primary`) will work. Hardcoded colors won't respond to theme changes.

---

### Q: Can I animate theme transitions?

**A**: Not recommended. CSS variable changes trigger immediate repaints. Adding transitions causes performance issues.

---

### Q: Are themes stored server-side or client-side?

**A**: Both!

- **localStorage**: Immediate persistence
- **Database**: Cross-device sync (when saved)
- **Zustand**: In-memory state

---

### Q: What happens if a preset is deleted?

**A**: Built-in presets can't be deleted. User themes can be deleted, reverting to default theme.

---

### Q: Can I programmatically generate themes?

**A**: Yes! Use utilities:

```tsx
import { generateSemanticPalette } from "@/lib/theme-utils"

const palette = generateSemanticPalette("oklch(0.5 0.2 264)")
// Returns complete theme
```

---

## Reporting Issues

### Before Reporting

1. ✅ Check this document for known issues
2. ✅ Clear localStorage and test again
3. ✅ Test in different browser
4. ✅ Check browser console for errors
5. ✅ Verify you're on latest version

### How to Report

Include:

- **Browser & version**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Console errors** (if any)
- **Theme JSON** (if import/export issue)

### Where to Report

GitHub Issues: `https://github.com/anthropics/hogwarts/issues`

Label: `theme-system`

---

## Version History

### v2.0 (2025-10-27) - Current

- ✅ Integrated into Settings page
- ✅ Added advanced color utilities
- ✅ Added WCAG contrast checking
- ✅ Fixed preset import race condition
- ✅ Improved performance (50ms theme switching)

### v1.0 (2025-10-20)

- Initial release
- 160+ preset themes
- Import/export functionality
- Light/dark mode support

---

**Last Updated**: 2025-10-27
**Version**: 2.0
**Maintainers**: Development Team

For technical documentation, see [README.md](./README.md).
