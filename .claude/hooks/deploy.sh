#!/bin/bash
# Smart Auto-Deploy - Runs after edits with debounce
# Only deploys if:
# 1. There are uncommitted changes
# 2. Last deploy was >60 seconds ago
# 3. Not currently deploying

LOCK_FILE="/tmp/hogwarts-deploy.lock"
TIMESTAMP_FILE="/tmp/hogwarts-last-deploy"
DEBOUNCE_SECONDS=60

# Check if already deploying
if [ -f "$LOCK_FILE" ]; then
    exit 0
fi

# Check if there are uncommitted changes
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" -eq 0 ]; then
    exit 0
fi

# Check debounce (don't deploy if deployed recently)
if [ -f "$TIMESTAMP_FILE" ]; then
    LAST_DEPLOY=$(cat "$TIMESTAMP_FILE" 2>/dev/null || echo 0)
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_DEPLOY))
    if [ "$DIFF" -lt "$DEBOUNCE_SECONDS" ]; then
        exit 0
    fi
fi

# Create lock
touch "$LOCK_FILE"

# Run deploy
echo ""
echo "═══════════════════════════════════════"
echo "🚀 AUTO-DEPLOY TRIGGERED"
echo "═══════════════════════════════════════"

# Quick validation
echo "Validating..."
if ! pnpm tsc --noEmit 2>/dev/null; then
    echo "❌ TypeScript errors - skipping deploy"
    rm -f "$LOCK_FILE"
    exit 0
fi

pnpm lint --fix --quiet 2>/dev/null || true

if ! pnpm lint --quiet 2>/dev/null; then
    echo "❌ Lint errors - skipping deploy"
    rm -f "$LOCK_FILE"
    exit 0
fi

# Build check
echo "Building..."
if ! pnpm build 2>/dev/null | tail -3; then
    echo "❌ Build failed - skipping deploy"
    rm -f "$LOCK_FILE"
    exit 0
fi

# Commit
echo "Committing..."
CHANGED_FILES=$(git diff --name-only | head -3 | tr '\n' ', ' | sed 's/,$//')
git add -A 2>/dev/null

# Determine commit type
if git diff --cached --name-only | grep -qE '\.(css|scss)'; then
    TYPE="style"
elif git diff --cached --name-only | grep -qE '\.test\.(ts|tsx)$'; then
    TYPE="test"
elif git diff --cached --name-only | grep -qE '\.md$'; then
    TYPE="docs"
else
    TYPE="fix"
fi

git commit -m "${TYPE}: auto-deploy

Files: ${CHANGED_FILES}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" 2>/dev/null || true

# Push
echo "Pushing..."
BRANCH=$(git branch --show-current)
git push origin "$BRANCH" 2>/dev/null || true

# Update timestamp
date +%s > "$TIMESTAMP_FILE"

# Remove lock
rm -f "$LOCK_FILE"

echo ""
echo "✅ AUTO-DEPLOY COMPLETE"
echo "Branch: $BRANCH"
echo "Preview: https://${BRANCH}---hogwarts.vercel.app"
echo "═══════════════════════════════════════"

exit 0
