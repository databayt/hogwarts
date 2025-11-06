---
description: Auto-fix all detected issues (short alias for comprehensive fixing)
---

# Fix Command - Universal Auto-Fixer

One-command solution to automatically fix all common code issues including formatting, linting, type errors, and more.

## Usage

```bash
/fix [scope]
```

## Scopes

- **(default)** - Fix everything
- `format` - Formatting only (Prettier)
- `lint` - Linting issues (ESLint)
- `types` - TypeScript errors
- `imports` - Import organization
- `styles` - Tailwind class ordering
- `build` - Build-related errors
- `all` - Everything (same as default)

## Examples

```bash
# Fix everything
/fix

# Formatting only
/fix format

# ESLint issues only
/fix lint

# TypeScript errors
/fix types

# Multiple scopes
/fix format lint imports

# Dry run (show what would be fixed)
/fix --check
```

## Fix Process

### Phase 1: Detection
Scan for all issues across the codebase

### Phase 2: Auto-Fix
Apply fixes in order:
1. **Prettier** - Code formatting
2. **ESLint** - Linting with --fix
3. **TypeScript** - Pattern-based fixes
4. **Imports** - Organization and unused removal
5. **Tailwind** - Class ordering
6. **Build** - Known build error patterns

### Phase 3: Verification
Ensure fixes don't break anything

## What Gets Fixed

### 1. Formatting (Prettier)
```typescript
// Before
const  obj={a:1,b:2,c:3}
function  fn( x,y ){return x+y}

// After
const obj = { a: 1, b: 2, c: 3 }
function fn(x, y) {
  return x + y
}
```

### 2. ESLint Issues
- Unused variables removed
- Missing semicolons added
- Prefer const over let
- No console.log in production
- Consistent quotes
- Array/object spacing

### 3. TypeScript Errors
```typescript
// Before
const user = data  // Type 'any'
setName(user?.name)  // Type 'string | undefined'

// After
const user = data as User
setName(user?.name ?? '')
```

### 4. Import Organization
```typescript
// Before
import React from 'react'
import {Button} from '@/components/ui/button'
import {useState} from 'react'
import type {User} from './types'

// After
import React, { useState } from 'react'
import type { User } from './types'
import { Button } from '@/components/ui/button'
```

### 5. Tailwind Classes
```html
<!-- Before -->
<div className="p-4 flex bg-white mt-2 justify-center items-center">

<!-- After -->
<div className="mt-2 flex items-center justify-center bg-white p-4">
```

### 6. Build Errors
- Dictionary property errors
- Prisma field type mismatches
- Enum completeness issues
- Missing required fields

## Pattern-Based Fixes

### Dictionary Properties (173+ patterns)
```typescript
// Before
dictionary.common.unknownKey

// After
dictionary.common.knownKey ?? 'Fallback'
```

### Prisma Field Types (13+ patterns)
```typescript
// Before
connect: studentId  // Wrong: scalar on connect

// After
connect: { id: studentId }  // Correct: object
```

### Enum Completeness (2+ patterns)
```typescript
// Before
const config = {
  ADMIN: 'admin',
  USER: 'user'
  // Missing roles
}

// After
const config: Record<UserRole, string> = {
  ADMIN: 'admin',
  USER: 'user',
  TEACHER: 'teacher',
  // All roles included
}
```

## Progress Display

```
═══════════════════════════════════════
🔧 AUTO-FIX IN PROGRESS
═══════════════════════════════════════
Scanning for issues...

Found:
- 47 formatting issues
- 12 ESLint violations
- 8 TypeScript errors
- 3 import issues
- 15 Tailwind class order issues

Fixing...
✅ Formatted 47 files
✅ Fixed 12 ESLint issues
✅ Resolved 8 TypeScript errors
✅ Organized 3 imports
✅ Reordered 15 Tailwind classes

═══════════════════════════════════════
✨ All issues fixed successfully!
═══════════════════════════════════════
```

## Configuration

### .prettierrc
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### .eslintrc
```json
{
  "extends": ["next", "prettier"],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

### Tailwind Config
```javascript
// prettier-plugin-tailwindcss
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
}
```

## Error Recovery

If fixes cause issues:

### Partial Rollback
```bash
git diff  # Review changes
git checkout -- file.ts  # Revert specific file
```

### Full Rollback
```bash
git stash  # Save but remove changes
git stash drop  # Discard if not needed
```

## Implementation

```typescript
// Orchestrates multiple fix operations
async function fix(scope: string[]) {
  const issues = await detectIssues(scope)

  if (issues.total === 0) {
    console.log('✨ No issues found!')
    return
  }

  // Apply fixes in order
  if (scope.includes('format')) {
    await runPrettier()
  }

  if (scope.includes('lint')) {
    await runESLintFix()
  }

  if (scope.includes('types')) {
    await fixTypeScriptErrors()
  }

  if (scope.includes('imports')) {
    await organizeImports()
  }

  if (scope.includes('styles')) {
    await orderTailwindClasses()
  }

  if (scope.includes('build')) {
    await fixBuildErrors()
  }

  // Verify fixes
  await verifyBuild()
  await runTests()
}
```

## Success Metrics

### Before/After
```
Before:
- Build time: 45s (with errors)
- ESLint errors: 47
- Type errors: 23
- Test failures: 3

After:
- Build time: 28s (clean)
- ESLint errors: 0
- Type errors: 0
- Test failures: 0
```

### Time Saved
```
Manual fixing: ~3 hours
Auto-fix: ~30 seconds
Time saved: 99.7%
```

## Verification

After fixing, automatically runs:
1. TypeScript compilation check
2. ESLint verification
3. Build test
4. Unit test suite

## Best Practices

### When to Use
- Before commits
- After merging branches
- When build fails
- After dependency updates
- Before code review

### When Not to Use
- On uncommitted work (commit first)
- In CI/CD pipeline (should fail)
- On generated files
- On third-party code

## Success Criteria

✅ All formatting issues fixed
✅ No ESLint errors remaining
✅ TypeScript compiles
✅ Build succeeds
✅ Tests still pass
✅ No functionality broken

## Tips

- Run regularly to prevent accumulation
- Review changes before committing
- Use `--check` for dry runs
- Configure rules to match team standards
- Combine with pre-commit hooks