---
description: Pre-rebase safety checks and preparation
---

# Pre-Rebase Hook - Safety Guardian

Prevents dangerous rebases and prepares the repository for safe rebasing.

## Safety Checks

### 1. Protect Published Branches

```bash
# Prevent rebasing published branches
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PROTECTED_BRANCHES="main master production staging"

if echo "$PROTECTED_BRANCHES" | grep -q "$BRANCH"; then
  echo "❌ Cannot rebase protected branch: $BRANCH"
  echo "Protected branches should never be rebased after pushing"
  exit 1
fi
```

### 2. Check for Uncommitted Changes

```bash
# Ensure working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo "❌ Uncommitted changes detected"
  echo "Commit or stash changes before rebasing:"

  git status --short

  # Offer to auto-stash
  read -p "Auto-stash changes? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git stash push -m "Auto-stash before rebase $(date +%Y%m%d_%H%M%S)"
    echo "✅ Changes stashed (run 'git stash pop' after rebase)"
  else
    exit 1
  fi
fi
```

### 3. Check Push Status

```bash
# Warn if branch is already pushed
if git branch -r --contains HEAD | grep -q "origin/$BRANCH"; then
  echo "⚠️  WARNING: This branch has been pushed to remote"
  echo "Rebasing will require force-push which can affect other developers"

  read -p "Continue with rebase? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### 4. Backup Current State

```bash
# Create backup branch
BACKUP_BRANCH="backup-$(date +%Y%m%d_%H%M%S)-$BRANCH"
git branch $BACKUP_BRANCH
echo "📦 Backup created: $BACKUP_BRANCH"
echo "Restore with: git reset --hard $BACKUP_BRANCH"
```

### 5. Check Migration Conflicts

```bash
# Detect potential migration conflicts
TARGET_BRANCH=$1  # Branch we're rebasing onto
MIGRATIONS_LOCAL=$(git diff $TARGET_BRANCH...HEAD --name-only | grep "prisma/migrations/" | wc -l)
MIGRATIONS_TARGET=$(git diff HEAD...$TARGET_BRANCH --name-only | grep "prisma/migrations/" | wc -l)

if [ $MIGRATIONS_LOCAL -gt 0 ] && [ $MIGRATIONS_TARGET -gt 0 ]; then
  echo "⚠️  Migration conflicts likely"
  echo "Local migrations: $MIGRATIONS_LOCAL"
  echo "Target migrations: $MIGRATIONS_TARGET"
  echo ""
  echo "After rebase, you may need to:"
  echo "1. Reorder migrations chronologically"
  echo "2. Regenerate migration timestamps"
  echo "3. Update migration dependencies"
fi
```

### 6. Save Rebase Plan

```bash
# Document what we're doing
cat > .git/rebase-plan.txt << EOF
Rebase Plan - $(date)
========================
Current Branch: $BRANCH
Target Branch: $TARGET_BRANCH
Backup Branch: $BACKUP_BRANCH
Commits to Rebase: $(git rev-list --count $TARGET_BRANCH..HEAD)

Recovery Commands:
- Abort: git rebase --abort
- Restore: git reset --hard $BACKUP_BRANCH
- Continue: git rebase --continue
- Skip: git rebase --skip

Files Changed:
$(git diff --name-only $TARGET_BRANCH...HEAD)
EOF

echo "📋 Rebase plan saved to .git/rebase-plan.txt"
```

### 7. Test Suite Check

```bash
# Ensure tests pass before rebase
echo "🧪 Running tests before rebase..."
pnpm test --run
if [ $? -ne 0 ]; then
  echo "❌ Tests failing before rebase"
  echo "Fix tests first to avoid complications during rebase"
  exit 1
fi
```

### 8. Large File Check

```bash
# Check for large files that might cause issues
LARGE_FILES=$(find . -type f -size +10M 2>/dev/null | grep -v node_modules | grep -v .git)
if [ -n "$LARGE_FILES" ]; then
  echo "⚠️  Large files detected that may cause rebase issues:"
  echo "$LARGE_FILES"
fi
```

## Configuration

```json
{
  "git": {
    "hooks": {
      "preRebase": {
        "enabled": true,
        "protectedBranches": ["main", "master", "production", "staging"],
        "requireCleanTree": true,
        "createBackup": true,
        "runTests": true,
        "warnOnPushed": true,
        "checks": [
          "protectedBranch",
          "cleanTree",
          "pushStatus",
          "backup",
          "migrations",
          "tests",
          "largeFiles"
        ]
      }
    }
  }
}
```

## Interactive Rebase Helper

```bash
# For interactive rebases, provide guidance
if [ "$2" = "interactive" ]; then
  cat << EOF

Interactive Rebase Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
p, pick   = use commit
r, reword = use commit, edit message
e, edit   = use commit, stop for amending
s, squash = use commit, meld into previous
f, fixup  = like squash but discard message
x, exec   = run command
d, drop   = remove commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best Practices:
- Squash WIP commits
- Reword for clarity
- Drop debug commits
- Order logically
EOF
fi
```

## Output Example

```
🛡️  Pre-Rebase Safety Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Branch 'feature/student-search' can be rebased
✅ Working directory clean
⚠️  WARNING: This branch has been pushed to remote
   Continue with rebase? (y/n): y

📦 Backup created: backup-20240115_103045-feature/student-search
   Restore with: git reset --hard backup-20240115_103045-feature/student-search

⚠️  Migration conflicts likely
   Local migrations: 2
   Target migrations: 3

🧪 Running tests before rebase...
   ✅ 234 tests passing

📋 Rebase plan saved to .git/rebase-plan.txt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to rebase onto 'main'
Commits to rebase: 8
```

## Abort Recovery

If rebase goes wrong:

```bash
# Automatic recovery options
git rebase --abort  # Cancel rebase
git reset --hard backup-20240115_103045-feature/student-search  # Full restore
```

## Post-Rebase Recommendations

After successful rebase:

```bash
# Cleanup
git branch -D $BACKUP_BRANCH  # Delete backup if everything is OK
rm .git/rebase-plan.txt  # Remove plan file

# Validate
pnpm test  # Ensure tests still pass
pnpm build  # Ensure build works
```
