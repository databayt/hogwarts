# /icon-migrate - Migrate Lucide Imports to Unified System

You are tasked with migrating direct lucide-react imports to the unified icon system.

## Problem Statement

Current state:

- **22%** of files use unified system (`import { Icons } from "@/components/icons"`)
- **801** direct lucide-react imports across the codebase
- Goal: **100%** unified system adoption, **0** direct imports

## Migration Modes

| Mode        | Command                | Description                           |
| ----------- | ---------------------- | ------------------------------------- |
| Single File | `/icon-migrate <file>` | Migrate one file                      |
| Batch       | `/icon-migrate batch`  | Migrate 10 files at a time            |
| All         | `/icon-migrate all`    | Migrate all files (with confirmation) |
| Report      | `/icon-migrate report` | Show migration status without changes |

## Workflow

### Step 1: Find Lucide Imports

```bash
# Find all files with lucide-react imports
grep -r "from \"lucide-react\"" src/ --include="*.tsx" --include="*.ts"
grep -r "from 'lucide-react'" src/ --include="*.tsx" --include="*.ts"
```

### Step 2: Analyze Imports

For each file, extract:

- File path
- Imported icon names
- Usage locations

Example:

```typescript
// Before
import { AlertCircle, ChevronDown, RefreshCw } from "lucide-react"

// Icons used:
// - AlertCircle (line 24, 45)
// - RefreshCw (line 52)
// - ChevronDown (line 78, 89, 102)
```

### Step 3: Check Icon Availability

For each imported icon, check if it exists in unified system:

| Lucide Icon | Unified System    | Status         |
| ----------- | ----------------- | -------------- |
| AlertCircle | Icons.alertCircle | ✅ Available   |
| RefreshCw   | Icons.refresh     | ✅ Available   |
| ChevronDown | Icons.chevronDown | ❌ Need to add |

### Step 4: Add Missing Icons

If icon doesn't exist in unified system:

1. Copy SVG from lucide-react
2. Add to `src/components/icons.tsx` or category file
3. Export from `src/components/icons/index.tsx`
4. Register in `src/components/icons/registry.ts`

```typescript
// Add to icons.tsx
chevronDown: (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m6 9 6 6 6-6"
    />
  </svg>
),
```

### Step 5: Update Import Statement

Replace lucide-react import with unified system:

```typescript
// Before
import { AlertCircle, ChevronDown, RefreshCw } from "lucide-react"

// After
import { Icons } from "@/components/icons"
```

### Step 6: Update Usage

Replace all icon usages:

```typescript
// Before
<AlertCircle className="h-4 w-4" />
<RefreshCw className="h-5 w-5 animate-spin" />

// After
<Icons.alertCircle className="size-4" />
<Icons.refresh className="size-5 animate-spin" />
```

### Step 7: Verify

After migration:

1. Run TypeScript check: `pnpm tsc --noEmit`
2. Check for any remaining imports: `grep "lucide-react" <file>`
3. Test UI to ensure icons render correctly

## Priority Files

Migrate these high-impact files first:

### Error Boundaries (45 files)

```
src/**/error.tsx
src/**/not-found.tsx
```

Common pattern:

```typescript
// Before
import { AlertCircle, RefreshCw } from "lucide-react"

// After
import { Icons } from "@/components/icons"
```

### Form Components (26 files)

```
src/components/**/form.tsx
src/components/**/form-field.tsx
```

### Theme Toggle

```
src/components/theme-toggle.tsx
```

Pattern:

```typescript
// Before
import { MoonIcon, SunIcon } from "lucide-react"

// After
import { Icons } from "@/components/icons"
```

## Icon Name Mapping

| Lucide         | Unified System |
| -------------- | -------------- |
| AlertCircle    | alertCircle    |
| RefreshCw      | refresh        |
| ArrowLeft      | arrowLeft      |
| ArrowRight     | arrowRight     |
| ChevronDown    | chevronDown    |
| ChevronUp      | chevronUp      |
| ChevronLeft    | chevronLeft    |
| ChevronRight   | chevronRight   |
| MoonIcon       | moon           |
| SunIcon        | sun            |
| Calendar       | calendar       |
| Search         | search         |
| FileText       | fileText       |
| Upload         | upload         |
| Download       | download       |
| Check          | check          |
| X              | x              |
| Plus           | plus           |
| Minus          | minus          |
| MoreHorizontal | moreHorizontal |
| MoreVertical   | moreVertical   |
| Settings       | settings       |
| User           | user           |
| Users          | users          |
| Mail           | mail           |
| Phone          | phone          |
| Eye            | eye            |
| EyeOff         | eyeOff         |
| Lock           | lock           |
| Unlock         | unlock         |
| Trash          | trash          |
| Edit           | edit           |
| Copy           | copy           |
| Loader2        | spinner        |

## Batch Processing

When running `/icon-migrate batch`:

1. Find all files with lucide imports
2. Sort by impact (error boundaries first)
3. Process 10 files at a time
4. Show progress
5. Pause for confirmation before continuing

```markdown
## Migration Batch 1/8

Processing 10 files:

1. src/app/[lang]/error.tsx - 2 icons
2. src/app/[lang]/s/[subdomain]/error.tsx - 2 icons
   ...

Icons to add to unified system:

- alertCircle (from AlertCircle)
- refresh (from RefreshCw)

Continue? [Y/n]
```

## Output Report

After migration:

```markdown
## Migration Report

**Mode**: {mode}
**Date**: {date}

### Summary

- Files processed: {count}
- Icons migrated: {iconCount}
- New icons added: {newCount}

### Files Migrated

1. src/app/[lang]/error.tsx
   - AlertCircle → Icons.alertCircle
   - RefreshCw → Icons.refresh

2. src/components/theme-toggle.tsx
   - MoonIcon → Icons.moon
   - SunIcon → Icons.sun
     ...

### Icons Added to System

- alertCircle
- refresh
- moon
- sun

### Remaining Work

- 72 files still have lucide imports
- Run `/icon-migrate batch` to continue

### Verification

- TypeScript: ✅ No errors
- Build: ✅ Successful
- Tests: ✅ Passing
```

## Rollback

If issues occur:

1. Git provides automatic rollback via version control
2. Migration creates no new files (only edits)
3. Icons added to system remain (no harm)

## Example Session

```
User: /icon-migrate src/app/[lang]/error.tsx
```
