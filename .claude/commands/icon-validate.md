# /icon-validate - Validate Icon Compliance

You are tasked with validating icons in the Hogwarts icon system against Anthropic design guidelines.

## Validation Scope

**Target**: All SVG icons in `public/icons/`
**Design System**: Anthropic Design Guidelines
**Config**: `.mcp.json` → `iconSystem`

## Design System Requirements

### 1. ViewBox (CRITICAL)
- ✅ **Standard**: `0 0 1000 1000`
- ✅ **Wide format**: `0 0 1680 1260` or `0 0 1681 1261`
- ❌ Any other dimensions

### 2. Color Palette (STRICT)
- ✅ **Light**: `#FAF9F5` (background/fills)
- ✅ **Dark**: `#141413` (foreground/details)
- ❌ Any other colors, gradients, or patterns

### 3. SVG Structure
- ✅ Root `<svg>` has `fill="none"`
- ✅ All `<path>` elements have explicit `fill` attribute
- ✅ Valid XML structure
- ❌ Inline styles
- ❌ External references (fonts, images)
- ❌ JavaScript or animations

### 4. Naming Convention
- ✅ Pattern: `{Category}-{Description}.svg`
- ✅ Categories: Hands, People, Objects, Abstract, Letters, Scenes
- ✅ Semantic, descriptive names
- ❌ Hash-based or cryptic names

### 5. File Organization
- ✅ All icons in `public/icons/`
- ✅ Registered in `src/components/icons/registry.ts`
- ✅ No duplicates

## Validation Workflow

### 1. Determine Validation Scope

Ask user or default to:
- **Single file**: Validate specific icon
- **Category**: Validate all icons in category
- **Full system**: Validate all 51+ icons
- **Recent additions**: Validate newly added icons

### 2. Read Icon Files

Use Glob tool to find icons:
```bash
# All icons
public/icons/*.svg

# Specific category (semantic names start with category)
public/icons/Hands-*.svg
```

Use Read tool to examine each file.

### 3. Run Validation Checks

For each icon, check:

#### A. ViewBox Validation
```typescript
// Extract viewBox attribute
const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/)
const viewBox = viewBoxMatch?.[1]

// Validate
const validViewBoxes = ["0 0 1000 1000", "0 0 1680 1260", "0 0 1681 1261"]
if (!validViewBoxes.includes(viewBox)) {
  errors.push(`Invalid viewBox: ${viewBox}`)
}
```

#### B. Color Validation
```typescript
// Extract all fill colors
const fillMatches = svgContent.matchAll(/fill="(#[A-Fa-f0-9]{6})"/g)
const colors = new Set([...fillMatches].map(m => m[1].toUpperCase()))

const allowedColors = new Set(["#FAF9F5", "#141413"])
const invalidColors = [...colors].filter(c => !allowedColors.has(c))

if (invalidColors.length > 0) {
  errors.push(`Invalid colors: ${invalidColors.join(", ")}`)
}
```

#### C. Structure Validation
```typescript
// Check root fill="none"
if (!svgContent.includes('<svg') || !svgContent.includes('fill="none"')) {
  errors.push('Root svg must have fill="none"')
}

// Check all paths have fill
const pathsWithoutFill = svgContent.match(/<path(?![^>]*fill=)/g)
if (pathsWithoutFill && pathsWithoutFill.length > 0) {
  errors.push(`${pathsWithoutFill.length} paths missing fill attribute`)
}

// Check for inline styles
if (svgContent.includes('style=')) {
  errors.push('Inline styles not allowed')
}
```

#### D. Naming Validation
```typescript
// Check naming convention
const filename = path.basename(filepath)
const namePattern = /^(Hands|People|Objects|Abstract|Letters|Scenes)-[\w-]+\.svg$/

if (!namePattern.test(filename)) {
  errors.push(`Invalid naming: ${filename}`)
}
```

### 4. Generate Report

Output validation results:

```markdown
## Icon Validation Report

**Scope**: {scope}
**Date**: {date}
**Total Icons**: {count}

### Summary
- ✅ Valid: {validCount}
- ⚠️ Warnings: {warningCount}
- ❌ Errors: {errorCount}

### Issues Found

#### Hands-Gesture-01.svg
- ❌ Invalid viewBox: "0 0 500 500" (expected: "0 0 1000 1000")
- ⚠️ Missing keywords in registry

#### Abstract-Curves-03.svg
- ❌ Invalid color: #FF0000 (only #FAF9F5 and #141413 allowed)
- ❌ 3 paths missing fill attribute

### Recommendations

1. Fix invalid viewBox in 2 files
2. Replace non-compliant colors in 1 file
3. Add fill attributes to paths in 1 file
4. Update registry with missing keywords
```

### 5. Offer Auto-Fix

For fixable issues, offer to:
- Adjust viewBox to standard dimensions
- Replace colors with nearest compliant color
- Add fill attributes to paths
- Update naming to follow convention

**Prompt user before making changes!**

### 6. Update Registry

After validation, check if registry is in sync:
- All files have registry entries
- Registry entries point to existing files
- Metadata is accurate

## Example Validation Sessions

### Example 1: Single File
```
User: /icon-validate Hands-Gesture-01.svg
Assistant: Validating Hands-Gesture-01.svg...

✅ ViewBox: 0 0 1000 1000 (valid)
✅ Colors: #FAF9F5, #141413 (valid)
✅ Structure: Root has fill="none", all paths have fill
✅ Naming: Follows convention
✅ Registry: Entry exists with correct metadata

Result: PASSED - No issues found
```

### Example 2: Category
```
User: /icon-validate category:Hands
Assistant: Validating 15 Hands icons...

Issues found:
❌ Hands-Document-02.svg
   - Invalid color #000000 (should be #141413)

⚠️ Hands-Abstract-01.svg
   - Missing keywords in registry

Would you like me to:
1. Auto-fix the color in Hands-Document-02.svg
2. Suggest keywords for Hands-Abstract-01.svg
3. Generate full report
```

### Example 3: Full System
```
User: /icon-validate
Assistant: Validating all 51 icons...

Progress: [████████████████████] 100%

Summary:
- ✅ Valid: 48 icons
- ⚠️ Warnings: 2 icons (missing keywords)
- ❌ Errors: 1 icon (color violation)

Compliance: 96%

[Detailed report with all issues]
```

## Auto-Fix Capabilities

### Fixable Issues
1. **ViewBox scaling**: Can resize paths proportionally
2. **Color replacement**: Can substitute colors
3. **Structure fixes**: Can add fill="none" to root
4. **Naming**: Can rename files (with backup)

### Manual Review Required
1. **Design changes**: Altering visual appearance
2. **Path modifications**: Complex structural changes
3. **Category reassignment**: Requires semantic understanding

## Output Formats

Support multiple output formats:
- **Console**: Colorized terminal output
- **Markdown**: `.md` report file
- **JSON**: Machine-readable validation results
- **HTML**: Shareable web report

## Performance

For large icon sets:
- Process in batches of 10
- Show progress indicator
- Cache validation results
- Skip unchanged files (checksum-based)