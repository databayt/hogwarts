---
description: Validate UI component quality
requiresArgs: false
---

Validate UI components: ${1:src/components/\*_/_.tsx}

## Validation Process

1. **Discover components**
   - Scan target path: ${1:src/components/\*_/_.tsx}
   - Identify all .tsx files
   - Parse component structure

2. **Run 7 Quality Gates**

   ### Gate 1: Semantic Tokens (CRITICAL)
   - ✅ Check: Zero hardcoded colors
   - ❌ Violations: `bg-white`, `bg-gray-*`, `text-black`, `dark:*`
   - Fix: Replace with semantic tokens

   ### Gate 2: Semantic HTML (CRITICAL)
   - ✅ Check: No typography utilities
   - ❌ Violations: `<div className="text-xl font-bold">`
   - Fix: Use `<h2>`, `<p>`, `<small>`

   ### Gate 3: Accessibility (HIGH)
   - ✅ Check: WCAG 2.1 AA compliance
   - ❌ Violations: Missing ARIA labels, no keyboard nav
   - Fix: Add aria-\* attributes, keyboard handlers

   ### Gate 4: Internationalization (HIGH)
   - ✅ Check: No hardcoded strings
   - ❌ Violations: `<button>Save</button>`
   - Fix: Use `{dictionary?.ui?.save || 'Save'}`

   ### Gate 5: TypeScript (MEDIUM)
   - ✅ Check: Strict mode compliant
   - ❌ Violations: `any` types, untyped props
   - Fix: Add proper types

   ### Gate 6: Testing (MEDIUM)
   - ✅ Check: 95%+ coverage
   - ❌ Violations: Missing tests, low coverage
   - Fix: Generate tests with `/test`

   ### Gate 7: Documentation (LOW)
   - ✅ Check: JSDoc complete
   - ❌ Violations: Missing comments
   - Fix: Add JSDoc documentation

3. **Generate report**

   ```
   Component: src/components/ui/button.tsx

   Quality Gates:
   ✅ Semantic Tokens (100%) - 0 violations
   ✅ Semantic HTML (100%) - 0 violations
   ❌ Accessibility (75%) - 2 violations
     Line 42: Icon button missing aria-label
     Line 56: No keyboard handler for onClick
   ✅ Internationalization (100%) - 0 violations
   ✅ TypeScript (100%) - 0 violations
   ❌ Testing (88%) - Coverage below 95%
   ✅ Documentation (100%) - Complete

   Score: 82/100 ❌ FAIL
   Fix 3 violations to pass
   ```

4. **Auto-fix suggestions**
   - Provide specific fixes for each violation
   - Show before/after code examples
   - Offer to apply auto-fixes

## Usage

```bash
# Validate all components
/ui-validate

# Validate specific file
/ui-validate src/components/ui/button.tsx

# Validate directory
/ui-validate src/components/ui/

# Validate pattern
/ui-validate src/components/atom/**/*.tsx

# Validate with auto-fix
/ui-validate src/components/ui/button.tsx --fix
```

## Validation Rules

### Semantic Token Rules

| Hardcoded         | Semantic Token          | Usage               |
| ----------------- | ----------------------- | ------------------- |
| `bg-white`        | `bg-background`         | Page background     |
| `bg-gray-50`      | `bg-muted`              | Subtle background   |
| `bg-gray-100`     | `bg-accent`             | Hover states        |
| `text-black`      | `text-foreground`       | Primary text        |
| `text-gray-600`   | `text-muted-foreground` | Secondary text      |
| `border-gray-200` | `border-border`         | Borders             |
| `bg-blue-500`     | `bg-primary`            | Primary actions     |
| `bg-red-500`      | `bg-destructive`        | Destructive actions |
| `bg-green-500`    | `bg-chart-2`            | Success states      |

### Semantic HTML Rules

| Violation                              | Correct   |
| -------------------------------------- | --------- |
| `<div className="text-3xl font-bold">` | `<h2>`    |
| `<div className="text-xl">`            | `<h3>`    |
| `<div className="text-sm">`            | `<small>` |
| `<div className="font-semibold">`      | `<h4>`    |

### Accessibility Requirements

- ✅ All buttons have accessible names
- ✅ All images have alt text
- ✅ All form inputs have labels
- ✅ Interactive elements keyboard accessible
- ✅ Focus indicators visible
- ✅ Color contrast ≥ 4.5:1 (text) and ≥ 3:1 (UI)
- ✅ Touch targets ≥ 44x44px

## Output Formats

### Summary Report

```
Validated 15 components

✅ Passed: 12 (80%)
❌ Failed: 3 (20%)

Critical Issues: 2
High Issues: 5
Medium Issues: 3
Low Issues: 1

Overall Score: 85/100
```

### Detailed Report

```json
{
  "component": "src/components/ui/button.tsx",
  "passed": false,
  "score": 82,
  "gates": {
    "semanticTokens": { "passed": true, "score": 100, "violations": [] },
    "semanticHTML": { "passed": true, "score": 100, "violations": [] },
    "accessibility": {
      "passed": false,
      "score": 75,
      "violations": [
        {
          "severity": "high",
          "message": "Icon button missing aria-label",
          "line": 42,
          "suggestion": "Add aria-label=\"Close\""
        }
      ]
    }
  }
}
```

## Integration with CI/CD

Add to `.github/workflows/ui-quality.yml`:

```yaml
- name: Validate UI Components
  run: pnpm /ui-validate src/components/**/*.tsx

- name: Fail on violations
  run: |
    if [ $? -ne 0 ]; then
      echo "❌ UI validation failed"
      exit 1
    fi
```

## Success Criteria

Component passes validation when:

- ✅ All 7 quality gates pass
- ✅ Score ≥ 95/100
- ✅ Zero critical violations
- ✅ Zero high-severity violations

## Troubleshooting

**Issue**: Too many violations to fix manually
**Fix**: Use `--fix` flag for auto-fixes

**Issue**: False positive violations
**Fix**: Add `// ui-validate-ignore-next-line` comment

**Issue**: Validation slow on large codebase
**Fix**: Validate specific paths instead of all components

**Issue**: Custom patterns not recognized
**Fix**: Update `.ui-validate.config.js` with custom rules
