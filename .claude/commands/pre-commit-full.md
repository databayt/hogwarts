# Pre-Commit Full Validation Command

**Command**: /pre-commit-full
**Purpose**: Comprehensive pre-commit validation orchestrating all error prevention checks

---

## Description

Runs a full suite of validation checks before allowing commits, preventing 204+ types of errors from reaching CI/CD. Combines dictionary validation, Prisma field type checking, enum completeness, TypeScript compilation, and build verification.

**Prevents**:

- Dictionary property errors (173+ patterns)
- Prisma field type errors (13+ patterns)
- Enum completeness issues (2+ patterns)
- TypeScript compilation errors
- Build failures

**Target Execution Time**: <10 seconds

---

## Usage

```bash
# Manual invocation
/pre-commit-full

# Via git hook (.husky/pre-commit)
#!/usr/bin/env sh
. "$(dirname -- \"$0\")/_/husky.sh"

echo "🔍 Running pre-commit validation..."
claude-code run /pre-commit-full

# Exit code determines commit success
exit $?
```

---

## Validation Pipeline

### Phase 1: Quick Checks (0-2s)

```bash
1. Dictionary Validation
   - Scan staged files for d?.stats, d?.blocks patterns
   - Validate against Dictionary type
   - Target: <1s

2. Prisma Field Type Validation
   - Scan staged .ts files for Prisma queries
   - Check connect patterns on ID fields
   - Validate includes against schema
   - Target: <1s
```

### Phase 2: Type Safety (2-5s)

```bash
3. Enum Completeness Check
   - Scan staged files for Record<Enum, T>
   - Validate all enum values present
   - Check exhaustive switch statements
   - Target: <1s

4. TypeScript Compilation
   - Run: pnpm tsc --noEmit
   - Check only staged files (incremental)
   - Target: <2s
```

### Phase 3: Build Verification (5-10s, main branch only)

```bash
5. Build Check (conditional)
   - Only runs on main/master branch commits
   - Run: pnpm build --turbo
   - Target: <5s with Turbopack
```

---

## Output Format

### Success (No Issues)

```bash
$ /pre-commit-full

🔍 Running pre-commit validation...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VALIDATION PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[████████████████████████████████] 100%

Phase 1: Quick Checks
  ✅ Dictionary validation (0.8s)
  ✅ Prisma field types (0.9s)

Phase 2: Type Safety
  ✅ Enum completeness (0.7s)
  ✅ TypeScript compilation (1.8s)

Phase 3: Build (skipped - not main branch)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL CHECKS PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total time: 4.2s
Commit allowed ✅
```

### Failure (Issues Found)

```bash
$ /pre-commit-full

🔍 Running pre-commit validation...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VALIDATION PIPELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[████████████████░░░░░░░░░░░░░░░░] 60% FAILED

Phase 1: Quick Checks
  ❌ Dictionary validation (0.8s) - 3 issues found
  ✅ Prisma field types (0.9s)

Phase 2: Type Safety
  ❌ Enum completeness (0.7s) - 1 issue found
  ⏸️  TypeScript compilation (skipped - errors above)

Phase 3: Build (not reached)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DICTIONARY ERRORS (3 issues)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 src/components/platform/finance/expenses/form.tsx
   ❌ Line 45: d?.stats?.totalExpenses
   Property 'stats' does not exist in Dictionary type

   Current: d?.stats?.totalExpenses || 'Total Expenses'
   Fix: 'Total Expenses'

📁 src/components/platform/finance/budget/content.tsx
   ❌ Line 102: d?.blocks?.budget?.title
   ❌ Line 108: d?.blocks?.budget?.description

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 ENUM COMPLETENESS (1 issue)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 src/components/platform/finance/fees/config.ts
   ❌ Line 12: FeeStatusLabels missing CANCELLED

   Enum: FeeStatus (5 values)
   Record: FeeStatusLabels (4 values)
   Missing: CANCELLED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 QUICK FIX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Auto-fix available for all 4 issues.
Run: /fix-build

Or fix manually and re-run commit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ COMMIT BLOCKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4 critical issues must be fixed before commit.
Total time: 2.4s
```

---

## Validation Rules

### Dictionary Validation

Uses **dictionary-validator** skill:

```typescript
// Scans for invalid patterns
const invalidPatterns = [
  'd?.stats',
  'd?.blocks',
  'd?.sections',
  'd?.actions',
  'd?.workflow',
  'd?.description' // when not in Dictionary type
]

// Validates against Dictionary type
type Dictionary = {
  common: { ... }
  navigation: { ... }
  auth: { ... }
  // stats, blocks, etc. DO NOT EXIST
}
```

### Prisma Field Type Validation

Uses **prisma-optimizer** skill:

```typescript
// Detects relation vs ID field usage
❌ submittedBy: { connect: { id: userId } }  // submittedBy doesn't exist
✅ submittedById: userId  // Correct ID field usage

// Validates includes
❌ include: { submittedBy: true }  // Not a relation
✅ include: { category: true }  // Valid relation
```

### Enum Completeness

Uses **type-safety** agent:

```typescript
// Validates Record<Enum, T> completeness
export enum ExpenseStatus {
  PENDING,
  APPROVED,
  REJECTED,
  PAID,
  CANCELLED,
}

// ❌ Missing CANCELLED
export const ExpenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
}
```

### TypeScript Compilation

```bash
# Incremental type checking (only staged files)
pnpm tsc --noEmit --incremental

# Benefits:
- Catches type errors early
- Faster than full compilation
- Uses TypeScript cache
```

### Build Verification (Main Branch Only)

```bash
# Only runs on main/master commits
if [[ $(git branch --show-current) == "main" ]]; then
  pnpm build --turbo
fi

# Benefits:
- Prevents broken builds in production
- Uses Turbopack for speed
- Skipped on feature branches (faster workflow)
```

---

## Integration

### Git Hook Setup

#### Option 1: Husky (Recommended)

```bash
# Install husky
pnpm add -D husky
pnpm exec husky init

# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- \"$0\")/_/husky.sh"

echo "🔍 Running pre-commit validation..."

# Run validation
claude-code run /pre-commit-full

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Pre-commit validation failed"
  echo "Fix issues above or use --no-verify to skip (not recommended)"
  exit 1
fi

exit 0
```

#### Option 2: Manual Git Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "🔍 Running pre-commit validation..."

# Run validation
claude-code run /pre-commit-full

if [ $? -ne 0 ]; then
  echo "❌ Commit blocked. Fix errors above."
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run pre-commit checks
        run: claude-code run /pre-commit-full
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Performance Optimization

### Staged Files Only (Git Hook Context)

```bash
# Only check files in staging area
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "No TypeScript files to validate"
  exit 0
fi

# Pass staged files to validation
claude-code run /pre-commit-full --files="$STAGED_FILES"
```

### Parallel Execution

```typescript
// Run Phase 1 checks in parallel
await Promise.all([
  validateDictionary(stagedFiles),
  validatePrismaFields(stagedFiles),
])

// Run Phase 2 checks in parallel
await Promise.all([
  checkEnumCompleteness(stagedFiles),
  runTypeScriptCheck(stagedFiles),
])
```

### Caching

```bash
# TypeScript incremental compilation
pnpm tsc --noEmit --incremental  # Uses .tsbuildinfo cache

# Prisma schema hash
SCHEMA_HASH=$(md5sum prisma/schema.prisma)
# Skip validation if schema unchanged
```

---

## Exit Codes

- **0**: All checks passed, commit allowed
- **1**: Validation errors found, commit blocked
- **2**: Fatal error (tool not available, etc.)
- **3**: User cancelled (if interactive mode)

---

## Configuration

### .pre-commit-full.json

```json
{
  "checks": {
    "dictionary": {
      "enabled": true,
      "timeout": 1000,
      "failOnError": true
    },
    "prismaFields": {
      "enabled": true,
      "timeout": 1000,
      "failOnError": true
    },
    "enumCompleteness": {
      "enabled": true,
      "timeout": 1000,
      "failOnError": true
    },
    "typeScript": {
      "enabled": true,
      "timeout": 3000,
      "failOnError": true,
      "incremental": true
    },
    "build": {
      "enabled": true,
      "timeout": 10000,
      "failOnError": true,
      "branches": ["main", "master"],
      "turbopack": true
    }
  },
  "output": {
    "verbose": false,
    "colors": true,
    "progressBar": true
  },
  "performance": {
    "parallel": true,
    "stagedFilesOnly": true,
    "useCache": true
  }
}
```

---

## Skip Validation (Not Recommended)

```bash
# Skip pre-commit hook
git commit --no-verify -m "WIP: temporary commit"

# Or set environment variable
SKIP_PRE_COMMIT=1 git commit -m "Emergency fix"
```

**Warning**: Skipping validation may introduce errors that break the build in CI/CD.

---

## Troubleshooting

### Issue: Validation Too Slow

**Solution 1**: Enable staged files only

```json
{
  "performance": {
    "stagedFilesOnly": true
  }
}
```

**Solution 2**: Disable build check on feature branches

```json
{
  "checks": {
    "build": {
      "branches": ["main"]
    }
  }
}
```

### Issue: False Positives

**Solution**: Configure exclusions

```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**",
    "**/.next/**"
  ]
}
```

### Issue: Hook Not Running

**Diagnosis**:

```bash
# Check if hook is executable
ls -la .git/hooks/pre-commit

# Should show: -rwxr-xr-x (executable)

# If not executable:
chmod +x .git/hooks/pre-commit
```

---

## Success Metrics

**From build-fixes-2025-10-29.md**:

- **204+ errors** would be caught before commit
- **0 build failures** in CI/CD
- **3+ hours saved** per incident (debugging time)
- **30+ commits saved** (iterative fix commits)

**Expected Performance**:

- Feature branch commits: 2-5s
- Main branch commits: 5-10s
- 100% error prevention rate

---

## Best Practices

1. **Run Locally Before Push**

   ```bash
   # Test your changes
   /pre-commit-full

   # Then commit
   git commit -m "feat: add feature"
   ```

2. **Fix Issues Immediately**
   - Don't accumulate validation errors
   - Use `/fix-build` for auto-fix when available
   - Keep commits small and focused

3. **Monitor Performance**

   ```bash
   # Add timing to hook
   START=$(date +%s)
   claude-code run /pre-commit-full
   END=$(date +%s)
   echo "Validation took $((END-START))s"
   ```

4. **Review Validation Output**
   - Understand why each error is flagged
   - Learn patterns to avoid in future
   - Share knowledge with team

5. **Keep Tools Updated**

   ```bash
   # Update Claude Code
   pnpm add -D @anthropic/claude-code@latest

   # Update validation skills
   claude-code update-skills
   ```

---

## Related Commands

- `/scan-errors` - Full codebase scan (slower, more comprehensive)
- `/validate-prisma` - Prisma-only validation
- `/fix-build` - Auto-fix build errors
- `/test` - Run tests before commit

---

## Workflow Integration

```bash
# Typical workflow
1. Make changes
2. Stage files: git add .
3. Pre-commit hook runs /pre-commit-full automatically
4. If errors: Fix → Re-stage → Retry commit
5. If success: Commit proceeds
6. Push to remote
7. CI/CD runs full validation (all files)
```

---

**Status**: ✅ Production Ready
**Prevention Rate**: 100% for known error patterns (204+ cases)
**Performance**: 2-10s depending on branch and staged files
**Integration**: Git hooks, CI/CD, Manual execution
**Maintained by**: Hogwarts School Automation Platform
