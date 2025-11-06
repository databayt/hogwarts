---
description: Post-pull dependency updates and migrations
---

# Post-Pull Hook - Sync Environment

Automatically updates dependencies, runs migrations, and syncs environment after pulling changes.

## Execution Flow

### 1. Check Package Changes
```bash
# Detect package.json or pnpm-lock.yaml changes
if git diff HEAD@{1} --name-only | grep -qE "(package\.json|pnpm-lock\.yaml)"; then
  echo "📦 Dependencies changed - updating..."
  pnpm install

  # Verify lockfile is up to date
  if git status --porcelain | grep -q "pnpm-lock.yaml"; then
    echo "⚠️  Lockfile updated - committing..."
    git add pnpm-lock.yaml
    git commit -m "chore: update pnpm lockfile after pull"
  fi
fi
```

### 2. Run Database Migrations
```bash
# Check for new migrations
if git diff HEAD@{1} --name-only | grep -q "prisma/migrations/"; then
  echo "🗄️  New migrations detected..."

  # Generate Prisma client
  pnpm prisma generate

  # Run migrations
  pnpm prisma migrate deploy

  # Seed if needed
  if [ "$1" = "--seed" ]; then
    pnpm db:seed
  fi
fi
```

### 3. Check Prisma Schema Changes
```bash
# Detect schema changes
if git diff HEAD@{1} --name-only | grep -q "\.prisma$"; then
  echo "📋 Prisma schema changed - regenerating client..."
  pnpm prisma generate
fi
```

### 4. Update Environment Variables
```bash
# Check for .env.example changes
if git diff HEAD@{1} --name-only | grep -q "\.env\.example"; then
  echo "🔐 Environment template updated"

  # Show new variables
  diff .env .env.example | grep "^>" | while read line; do
    VAR=$(echo $line | cut -d'=' -f1 | sed 's/> //')
    echo "  ⚠️  New variable needed: $VAR"
  done

  echo ""
  echo "Update your .env file with the new variables above"
fi
```

### 5. Clear Build Cache
```bash
# Clear if major changes detected
CHANGED_FILES=$(git diff HEAD@{1} --name-only | wc -l)
if [ $CHANGED_FILES -gt 50 ]; then
  echo "🧹 Major changes detected - clearing build cache..."
  rm -rf .next
  rm -rf node_modules/.cache
fi
```

### 6. Run Type Check
```bash
# Validate TypeScript after updates
echo "✔️  Checking TypeScript..."
pnpm tsc --noEmit --incremental false
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors after pull"
  echo "Run '/fix-build' to auto-fix"
fi
```

### 7. Update Documentation
```bash
# Pull latest documentation
if git diff HEAD@{1} --name-only | grep -q "^docs/"; then
  echo "📚 Documentation updated"

  # Regenerate search index
  /docs index-rebuild
fi
```

### 8. Notify Team
```bash
# If breaking changes
if git log HEAD@{1}..HEAD --grep="BREAKING CHANGE" --oneline | grep -q .; then
  echo "⚠️  BREAKING CHANGES DETECTED:"
  git log HEAD@{1}..HEAD --grep="BREAKING CHANGE" --oneline

  # Send Slack notification
  if [ "$SLACK_WEBHOOK" ]; then
    curl -X POST $SLACK_WEBHOOK -d "{
      \"text\": \"⚠️ Breaking changes pulled - review required\"
    }"
  fi
fi
```

## Configuration

```json
{
  "git": {
    "hooks": {
      "postPull": {
        "enabled": true,
        "actions": [
          "updateDependencies",
          "runMigrations",
          "generatePrisma",
          "checkEnv",
          "clearCache",
          "typeCheck",
          "updateDocs",
          "notifyTeam"
        ],
        "autoSeed": false,
        "clearCacheThreshold": 50
      }
    }
  }
}
```

## Output Example

```
🔄 Post-Pull Sync
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Dependencies changed - updating...
   Added 3 packages, removed 1, updated 5

🗄️  New migrations detected...
   Applied migration: 20240115_add_attendance

📋 Prisma schema changed - regenerating client...
   ✅ Generated Prisma Client

🔐 Environment template updated
   ⚠️  New variable needed: STRIPE_WEBHOOK_SECRET
   ⚠️  New variable needed: SENTRY_DSN

✔️  Checking TypeScript...
   ✅ No errors found

📚 Documentation updated
   ✅ Search index rebuilt

⚠️  BREAKING CHANGES DETECTED:
   abc123 feat!: change auth provider to Auth.js v5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time: 23.5s
Action Required: Update .env file
```

## Smart Features

### Dependency Optimization
- Only installs if package files changed
- Validates lockfile consistency
- Auto-commits lockfile updates

### Migration Safety
- Uses `migrate deploy` for production safety
- Optional seeding with `--seed` flag
- Validates schema before applying

### Cache Management
- Clears cache only for major changes (>50 files)
- Preserves cache for minor updates
- Removes stale build artifacts

### Team Communication
- Detects breaking changes via commit messages
- Sends notifications for critical updates
- Lists new environment variables needed

## Error Recovery

```bash
# If migrations fail
if ! pnpm prisma migrate deploy; then
  echo "❌ Migration failed - rolling back..."
  pnpm prisma migrate resolve --rolled-back

  echo "Fix the migration issue and run:"
  echo "  pnpm prisma migrate deploy"
  exit 1
fi
```

## Performance

Typical execution times:
- Dependency update: ~15s
- Migration run: ~3s
- Prisma generation: ~2s
- Type check: ~12s
- Documentation index: ~5s

**Total**: ~20-40s depending on changes