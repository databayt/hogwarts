---
description: Post-merge cleanup and conflict resolution
---

# Post-Merge Hook - Branch Integration

Handles cleanup, dependency updates, and validation after branch merges.

## Execution Flow

### 1. Detect Merge Conflicts Resolution
```bash
# Check if we just resolved conflicts
if [ -f .git/MERGE_HEAD ]; then
  echo "🔀 Merge completed - validating resolution..."

  # Check for conflict markers
  if grep -rn "^<<<<<<< \|^======= \|^>>>>>>>" --include="*.ts" --include="*.tsx" .; then
    echo "❌ Conflict markers still present!"
    exit 1
  fi
fi
```

### 2. Validate Merged Code
```bash
# Full validation suite
echo "🔍 Validating merged code..."

# TypeScript check
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors after merge"
  /fix-build  # Auto-fix attempt
fi

# ESLint check
pnpm lint
if [ $? -ne 0 ]; then
  pnpm lint --fix  # Auto-fix
fi
```

### 3. Deduplicate Dependencies
```bash
# Check for duplicate dependencies
if [ -f pnpm-lock.yaml ]; then
  echo "📦 Checking for duplicate dependencies..."

  # Deduplicate
  pnpm dedupe

  # Check if lockfile changed
  if git status --porcelain | grep -q "pnpm-lock.yaml"; then
    git add pnpm-lock.yaml
    git commit -m "chore: deduplicate dependencies after merge"
  fi
fi
```

### 4. Reconcile Database Migrations
```bash
# Check for multiple new migrations
MIGRATIONS=$(git diff HEAD~1 --name-only | grep "prisma/migrations/" | wc -l)
if [ $MIGRATIONS -gt 1 ]; then
  echo "🗄️  Multiple migrations merged - checking order..."

  # Validate migration chain
  pnpm prisma migrate status

  # Regenerate client
  pnpm prisma generate
fi
```

### 5. Merge Feature Documentation
```bash
# Detect documentation from both branches
if git diff HEAD~1 --name-only | grep -q "^docs/"; then
  echo "📚 Merging documentation..."

  # Rebuild TOC
  /docs rebuild-toc

  # Check for duplicate sections
  find docs -name "*.md" -exec grep -l "^##" {} \; | while read file; do
    DUPLICATES=$(grep "^## " "$file" | sort | uniq -d)
    if [ -n "$DUPLICATES" ]; then
      echo "⚠️  Duplicate sections in $file"
      echo "$DUPLICATES"
    fi
  done
fi
```

### 6. Update Test Coverage
```bash
# Run tests to ensure merge didn't break anything
echo "🧪 Running tests..."
pnpm test --run
if [ $? -eq 0 ]; then
  # Generate coverage report
  pnpm test --coverage --silent
  cp coverage/coverage-summary.json .bmad/metrics/coverage-postmerge.json
else
  echo "❌ Tests failing after merge"
fi
```

### 7. Clean Temporary Files
```bash
# Remove merge artifacts
echo "🧹 Cleaning up..."
rm -f .git/MERGE_*
rm -f *.orig
find . -name "*.rej" -delete
```

### 8. Update Feature Flags
```bash
# Check for feature flag changes
if git diff HEAD~1 --name-only | grep -qE "(feature-flags|config)\.ts"; then
  echo "🚩 Feature flags updated"

  # Validate all flags have defaults
  /validate feature-flags
fi
```

## Configuration

```json
{
  "git": {
    "hooks": {
      "postMerge": {
        "enabled": true,
        "actions": [
          "detectConflicts",
          "validateCode",
          "deduplicateDeps",
          "reconcileMigrations",
          "mergeDocs",
          "updateCoverage",
          "cleanup",
          "updateFeatureFlags"
        ],
        "autoFix": true,
        "runTests": true
      }
    }
  }
}
```

## Conflict Resolution Helpers

### Smart Merge for Package.json
```javascript
// Automatically resolves version conflicts
{
  "dependencies": {
    "react": "^19.0.0",  // Takes higher version
    "next": "^15.0.0"    // Takes higher version
  }
}
```

### Migration Ordering
```bash
# Reorder migrations if needed
if [ -f .migration-conflict ]; then
  /migration reorder
  rm .migration-conflict
fi
```

### Style Conflict Resolution
```bash
# Prettier format all files to resolve style conflicts
git diff --name-only --diff-filter=U | xargs pnpm prettier --write
git add -u
```

## Output Example

```
🔀 Post-Merge Integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Validating merged code...
   ❌ TypeScript: 3 errors found
   ✅ Auto-fixed all errors

📦 Checking for duplicate dependencies...
   ✅ Removed 5 duplicate packages

🗄️  Multiple migrations merged - checking order...
   ✅ Migrations in correct order
   ✅ Prisma client regenerated

📚 Merging documentation...
   ✅ TOC rebuilt
   ⚠️  Duplicate section: "## API Reference" in api.md

🧪 Running tests...
   ✅ 234 tests passing
   📊 Coverage: 96.8%

🧹 Cleaning up...
   ✅ Removed 3 .orig files

🚩 Feature flags updated
   ✅ All flags have defaults
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time: 35.2s
Warnings: 1 (duplicate docs section)
```

## Branch-Specific Behavior

### Main Branch Merge
- Full test suite execution
- Production build validation
- Deployment readiness check

### Feature Branch Merge
- Quick validation only
- Dependency deduplication
- Documentation merge

### Hotfix Merge
- Immediate test execution
- Version bump check
- Changelog update

## Error Handling

```bash
# Critical errors stop the process
if [ $CRITICAL_ERROR ]; then
  echo "❌ Critical error detected"
  echo "Run 'git reset --hard HEAD~1' to revert merge"
  exit 1
fi

# Non-critical errors logged
if [ $WARNING_COUNT -gt 0 ]; then
  echo "⚠️  $WARNING_COUNT warnings found"
  echo "Review .bmad/merge-warnings.log"
fi
```