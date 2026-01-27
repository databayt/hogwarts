# /icon-audit - Audit Icon Usage Across Codebase

You are tasked with auditing icon usage across the Hogwarts codebase to measure adoption of the unified icon system and identify migration opportunities.

## Metrics to Track

| Metric                  | Target | Description                                              |
| ----------------------- | ------ | -------------------------------------------------------- |
| Unified system adoption | 100%   | Files using `import { Icons } from "@/components/icons"` |
| Direct lucide imports   | 0      | Files using `import { X } from "lucide-react"`           |
| Registry completion     | 100%   | All Icons namespace entries in registry.ts               |
| Hardcoded SVGs          | 0      | Inline SVG elements in components                        |
| Theme compliance        | 100%   | Icons using `currentColor`                               |
| Accessibility           | 100%   | Icons with proper ARIA attributes                        |

## Audit Workflow

### Step 1: Count Unified System Usage

```bash
# Find files importing from unified system
grep -r "from \"@/components/icons\"" src/ --include="*.tsx" --include="*.ts" -l | wc -l

# Find specific import patterns
grep -r "import { Icons }" src/ --include="*.tsx" --include="*.ts" -l | wc -l
```

### Step 2: Count Direct Lucide Imports

```bash
# Find files with direct lucide-react imports
grep -r "from \"lucide-react\"" src/ --include="*.tsx" --include="*.ts" -l | wc -l
grep -r "from 'lucide-react'" src/ --include="*.tsx" --include="*.ts" -l | wc -l

# Count total import statements (not just files)
grep -r "from \"lucide-react\"" src/ --include="*.tsx" --include="*.ts" | wc -l
```

### Step 3: Find Hardcoded SVGs

```bash
# Find inline SVG elements
grep -r "<svg" src/components --include="*.tsx" | grep -v "icons" | wc -l
grep -r "<svg" src/app --include="*.tsx" | wc -l
```

### Step 4: Check Registry Completion

1. Count icons in `Icons` namespace
2. Count entries in `registry.ts`
3. Compare for gaps

```typescript
// Get all icon keys from Icons namespace
const iconKeys = Object.keys(Icons)

// Get all registered icons
const registeredIds = iconRegistry.map((i) => i.id)

// Find unregistered icons
const unregistered = iconKeys.filter((key) => !registeredIds.includes(key))
```

### Step 5: Verify Theme Compliance

```bash
# Find SVGs not using currentColor
grep -r "fill=\"#" src/components/icons --include="*.tsx" | grep -v "currentColor"
grep -r 'stroke="#' src/components/icons --include="*.tsx" | grep -v "currentColor"
```

### Step 6: Check Accessibility

```bash
# Find icons without aria attributes
# (Inspect components that render icons without aria-hidden or aria-label)
```

## Output Report

Generate comprehensive markdown report:

````markdown
# Icon System Audit Report

**Date**: {date}
**Scope**: Full codebase

## Executive Summary

| Metric              | Current        | Target | Status        |
| ------------------- | -------------- | ------ | ------------- |
| Unified adoption    | 22% (36 files) | 100%   | 🔴 Needs work |
| Direct imports      | 801            | 0      | 🔴 Needs work |
| Registry completion | 2% (4/240)     | 100%   | 🔴 Needs work |
| Hardcoded SVGs      | 15             | 0      | 🟡 Some work  |
| Theme compliance    | 95%            | 100%   | 🟢 Good       |
| Accessibility       | 80%            | 100%   | 🟡 Some work  |

## Detailed Findings

### 1. Unified System Usage

**Files using unified system**: 36
**Files with direct imports**: 165

#### Top offenders (most lucide imports):

| File                                                | Import Count |
| --------------------------------------------------- | ------------ |
| src/components/platform/dashboard/quick-actions.tsx | 12           |
| src/components/site/navigation.tsx                  | 10           |
| src/components/ui/data-table.tsx                    | 8            |
| ...                                                 | ...          |

### 2. Direct Lucide Imports

**Total import statements**: 801

#### Most common icons imported directly:

| Icon         | Files | Recommended        |
| ------------ | ----- | ------------------ |
| ChevronDown  | 45    | Icons.chevronDown  |
| ChevronRight | 38    | Icons.chevronRight |
| AlertCircle  | 35    | Icons.alertCircle  |
| Check        | 32    | Icons.check        |
| X            | 30    | Icons.x            |
| ...          | ...   | ...                |

#### By component type:

| Type             | Files | Import Count |
| ---------------- | ----- | ------------ |
| Error boundaries | 45    | 90           |
| Form components  | 26    | 78           |
| Navigation       | 15    | 45           |
| Data tables      | 12    | 36           |
| Other            | 67    | 552          |

### 3. Registry Gaps

**Icons in namespace**: 86
**Icons registered**: 4
**Missing from registry**: 82

#### Unregistered icons:

- github
- google
- nextjs
- react
- typescript
- tailwindcss
- ... (77 more)

### 4. Hardcoded SVGs

**Files with inline SVGs**: 15

| File                              | SVG Count | Recommendation |
| --------------------------------- | --------- | -------------- |
| src/components/marketing/logo.tsx | 3         | Move to Icons  |
| src/components/site/hero.tsx      | 2         | Move to Icons  |
| ...                               | ...       | ...            |

### 5. Theme Compliance Issues

**Icons with hardcoded colors**: 5

| File                                          | Issue          |
| --------------------------------------------- | -------------- |
| src/components/icons/categories/shapes.tsx:15 | fill="#000000" |
| ...                                           | ...            |

### 6. Accessibility Gaps

**Icons missing ARIA**: 25 components

| Component                    | Issue                    | Fix                    |
| ---------------------------- | ------------------------ | ---------------------- |
| src/components/ui/button.tsx | Icon without aria-hidden | Add aria-hidden="true" |
| ...                          | ...                      | ...                    |

## Recommendations

### Immediate Actions (Week 1)

1. **Complete registry** - Register all 86 existing icons
2. **Add missing icons** - Add commonly used lucide icons to system
3. **Fix theme compliance** - Replace hardcoded colors with currentColor

### Short-term (Week 2-3)

4. **Migrate error boundaries** - 45 files, ~90 imports
5. **Migrate form components** - 26 files, ~78 imports
6. **Add accessibility** - Add ARIA attributes to all icons

### Long-term (Week 4+)

7. **Migrate remaining files** - 94 files, ~633 imports
8. **Documentation** - Complete icon showcase with all icons
9. **Pre-commit hook** - Prevent new direct imports

## Migration Progress

| Week    | Files | Icons | Adoption |
| ------- | ----- | ----- | -------- |
| Current | 36    | 86    | 22%      |
| Week 1  | 45    | 120   | 35%      |
| Week 2  | 60    | 150   | 50%      |
| Week 3  | 90    | 180   | 75%      |
| Week 4  | 165   | 240+  | 100%     |

## Commands for Next Steps

```bash
# Register all icons
/icon-registry sync

# Migrate error boundaries first
/icon-migrate batch

# Validate after migration
/icon-validate

# Re-run audit
/icon-audit
```
````

```

## Report Options

| Flag | Output |
|------|--------|
| (default) | Console summary |
| `--report` | Full markdown report |
| `--json` | Machine-readable JSON |
| `--html` | HTML report with charts |

## Example Usage

```

User: /icon-audit
