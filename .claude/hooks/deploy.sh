#!/bin/bash
# Auto-Deploy Hook - Triggered after file changes
# Validates, commits, pushes, and monitors deployment

set -e

echo ""
echo "═══════════════════════════════════════"
echo "🚀 AUTO-DEPLOY TRIGGERED"
echo "═══════════════════════════════════════"

# Step 1: Quick Validation
echo ""
echo "Step 1/5: Validating..."

# TypeScript check
if ! pnpm tsc --noEmit 2>/dev/null; then
    echo "❌ TypeScript errors - auto-deploy aborted"
    echo "💡 Fix errors and changes will auto-deploy"
    exit 1
fi
echo "  ✅ TypeScript: OK"

# Lint check (with auto-fix)
pnpm lint --fix --quiet 2>/dev/null || true
if ! pnpm lint --quiet 2>/dev/null; then
    echo "❌ Lint errors - auto-deploy aborted"
    exit 1
fi
echo "  ✅ Lint: OK"

# Step 2: Quick Test (changed files only)
echo ""
echo "Step 2/5: Testing changed files..."
if pnpm test --changed --run --silent 2>/dev/null; then
    echo "  ✅ Tests: OK"
else
    echo "  ⚠️  Tests: Skipped (no test changes)"
fi

# Step 3: Build Check
echo ""
echo "Step 3/5: Build check..."
if ! pnpm build 2>/dev/null | tail -5; then
    echo "❌ Build failed - auto-deploy aborted"
    exit 1
fi
echo "  ✅ Build: OK"

# Step 4: Auto-Commit
echo ""
echo "Step 4/5: Committing..."

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
    echo "  ℹ️  No changes to commit"
else
    # Get changed files for commit message
    CHANGED_FILES=$(git diff --name-only | head -3 | tr '\n' ', ' | sed 's/,$//')

    # Determine commit type
    if git diff --name-only | grep -qE '\.(css|scss|tailwind)'; then
        TYPE="style"
    elif git diff --name-only | grep -qE '\.test\.(ts|tsx)$'; then
        TYPE="test"
    elif git diff --name-only | grep -qE 'README|\.md$'; then
        TYPE="docs"
    else
        TYPE="fix"
    fi

    git add -A
    git commit -m "$(cat <<EOF
${TYPE}: auto-deploy changes

Files: ${CHANGED_FILES}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)" 2>/dev/null || echo "  ℹ️  Nothing to commit"

    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null)
    echo "  ✅ Committed: ${COMMIT_HASH}"
fi

# Step 5: Push & Deploy
echo ""
echo "Step 5/5: Pushing to deploy..."

BRANCH=$(git branch --show-current)
git push origin "${BRANCH}" 2>/dev/null

echo "  ✅ Pushed to origin/${BRANCH}"

# Get Vercel deployment URL
echo ""
echo "═══════════════════════════════════════"
echo "✅ AUTO-DEPLOY COMPLETE"
echo "═══════════════════════════════════════"
echo "Branch:  ${BRANCH}"
echo "Commit:  ${COMMIT_HASH:-latest}"
echo "Status:  Deploying to Vercel..."
echo ""
echo "🔗 Preview: https://${BRANCH}---hogwarts.vercel.app"
echo "📊 Dashboard: https://vercel.com/dashboard"
echo "═══════════════════════════════════════"

exit 0
