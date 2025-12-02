---
description: Deploy to environment (staging/production)
requiresArgs: false
---

# Auto-Deploy

Validates, commits, pushes, and monitors deployment automatically.

## Execute

Run the deploy hook:
```bash
.claude/hooks/deploy.sh
```

This will:
1. **Validate** - TypeScript, lint, tests
2. **Auto-fix** - Lint issues
3. **Build** - Production build check
4. **Commit** - Auto-generate conventional commit
5. **Push** - Push to current branch
6. **Monitor** - Show Vercel deployment URL

## Arguments

- No args: Deploy to current branch (staging preview)
- `production`: Deploy to production (requires main branch)

## For Production

If deploying to production, run extra checks:
```bash
# Ensure on main branch
git checkout main
git pull origin main

# Run full test suite
pnpm test

# Deploy
.claude/hooks/deploy.sh
```

## Quick Reference

| Command | Use Case | Time |
|---------|----------|------|
| `/deploy` | Auto-deploy current changes | ~30s |
| `/quick` | Tiny changes (skip tests/build) | ~10s |
| `/dev` | Small changes with full checks | ~45s |
| `/validate` | Full agent validation | ~2min |
| `/ship production` | Production release | ~5min |
