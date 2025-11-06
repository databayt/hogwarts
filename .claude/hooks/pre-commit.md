---
description: Pre-commit quality checks and validation
---

# Pre-Commit Hook - Quality Gate

Comprehensive validation before allowing commits to ensure code quality and prevent broken builds.

## Execution Order

### 1. TypeScript Validation
```bash
pnpm tsc --noEmit
```
- Must show 0 errors
- Prevents build hangs at "Environments: .env"
- Critical for Next.js build success

### 2. Pattern Detection
```bash
/scan-errors
```
- Detects 204+ error patterns
- Dictionary properties (173+)
- Prisma field types (13+)
- Enum completeness (2+)

### 3. Auto-Fix (if errors found)
```bash
/fix-build
```
- 95%+ success rate
- Automatically fixes detected patterns
- Re-runs validation after fixes

### 4. Prisma Validation
```bash
# Check if schema changed
git diff --cached --name-only | grep -q "\.prisma$"
if [ $? -eq 0 ]; then
  pnpm prisma generate
  pnpm prisma validate
fi
```

### 5. ESLint Check
```bash
# Only on staged files
git diff --cached --name-only --diff-filter=ACM | grep -E "\.(ts|tsx|js|jsx)$" | xargs pnpm eslint
```

### 6. Prettier Format
```bash
# Format staged files
git diff --cached --name-only --diff-filter=ACM | grep -E "\.(ts|tsx|js|jsx|json|md)$" | xargs pnpm prettier --write
git add -u  # Re-stage formatted files
```

### 7. Test Execution
```bash
# Run tests for changed files
git diff --cached --name-only --diff-filter=ACM | grep -E "\.test\.(ts|tsx)$" | xargs pnpm test
```

### 8. Multi-Tenant Safety
```bash
# Check for schoolId in new queries
git diff --cached | grep -E "(prisma|db\.).*\.(create|update|delete|findMany|findFirst)" | grep -v "schoolId"
if [ $? -eq 0 ]; then
  echo "⚠️  WARNING: Database operation without schoolId detected"
  echo "All queries must include schoolId for multi-tenant safety"
  exit 1
fi
```

### 9. Build Verification (main branch only)
```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  pnpm build
fi
```

## Configuration

Enable in `.claude/settings.json`:
```json
{
  "git": {
    "hooks": {
      "preCommit": {
        "enabled": true,
        "checks": [
          "typescript",
          "patterns",
          "autofix",
          "prisma",
          "eslint",
          "prettier",
          "tests",
          "multiTenant",
          "build"
        ],
        "stopOnError": true,
        "allowOverride": false
      }
    }
  }
}
```

## Override Behavior

### Protected Branches (main, master, production)
- **STRICT**: No overrides allowed
- All checks must pass
- Build verification required

### Feature Branches
- Warnings shown but commit allowed with `--no-verify`
- Not recommended but available for emergencies

## Error Messages

### TypeScript Errors
```
❌ TypeScript compilation failed
Found 5 errors. Run 'pnpm tsc --noEmit' to see details.
Commit blocked. Fix errors before committing.
```

### Pattern Errors
```
❌ Code patterns detected that will cause build failures
Found: 173 dictionary errors, 13 Prisma errors, 2 enum errors

Running auto-fix...
✅ Fixed 188 issues automatically

Re-running validation...
✅ All patterns resolved
```

### Multi-Tenant Error
```
❌ Multi-tenant safety violation
Database operation missing schoolId scope:
  Line 45: db.student.create({ data: { name } })
           Should be: db.student.create({ data: { name, schoolId } })

All database operations must include schoolId for tenant isolation.
```

## Success Output

```
✅ Pre-Commit Validation Complete
- TypeScript: 0 errors
- Patterns: 0 issues detected
- Prisma: Schema valid
- ESLint: All files clean
- Prettier: Formatted 3 files
- Tests: 45 passing
- Multi-tenant: All queries scoped
- Build: Successful (main branch)

Proceeding with commit...
```

## Performance

Average execution time:
- TypeScript: ~12s
- Pattern scan: ~5s
- ESLint: ~3s
- Prettier: ~1s
- Tests: ~15s
- Build (main only): ~28s

**Total**: ~15s (feature branch), ~45s (main branch)

## Metrics Tracking

Hook automatically updates metrics:
```json
{
  "preCommit": {
    "totalRuns": 1234,
    "blocked": 45,
    "autoFixed": 188,
    "averageTime": "15s",
    "errorTypes": {
      "typescript": 23,
      "patterns": 188,
      "multiTenant": 12,
      "tests": 10
    }
  }
}
```