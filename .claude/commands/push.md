---
description: Manual deploy - checklist, commit, push, monitor Vercel
---

# Push to Deploy

Manual deployment workflow with full validation checklist.

## Checklist

Run each step and report results:

### Step 1: TypeScript Check

```bash
pnpm tsc --noEmit
```

- **Pass**: 0 errors → Continue
- **Fail**: Show errors, STOP deployment

### Step 2: Lint Check

```bash
pnpm lint --quiet
```

- **Pass**: No errors → Continue
- **Fail**: Run `pnpm lint --fix`, then re-check

### Step 3: Build Check

```bash
pnpm build
```

- **Pass**: Build successful → Continue
- **Fail**: Show errors, STOP deployment

### Step 4: Git Status

```bash
git status --short
```

Show what will be committed.

### Step 5: Commit

```bash
git add -A
git commit -m "<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Use conventional commit type based on changes:

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Formatting, CSS
- `docs`: Documentation
- `chore`: Maintenance

### Step 6: Push

```bash
git push origin $(git branch --show-current)
```

### Step 7: Monitor Vercel Deployment

After push, actively monitor the Vercel deployment until it reaches a terminal state (READY or ERROR).

**Vercel Project Info:**

- Project ID: `prj_jI7ezom5AbJfMbeB8F9lquA94OMP`
- Team ID: `team_byS1aI4jmz4mSh0RNx8dR12J`

**Monitoring loop:**

1. Use `list_deployments` to find the latest deployment for the commit
2. Poll `get_deployment` every 60 seconds until state is `READY` or `ERROR`
3. If `ERROR`: fetch build logs with `get_deployment_build_logs` (limit: 1000), extract last 40 lines to show the error
4. If `READY`: show success summary

**On READY:**

```
═══════════════════════════════════════
✅ DEPLOYMENT SUCCESSFUL
═══════════════════════════════════════
Branch: <branch>
Commit: <hash>
URL: <deployment url>
Vercel Dashboard: https://vercel.com/databayt/hogwarts
═══════════════════════════════════════
```

**On ERROR:**

- Show the build error from logs
- Suggest fix and ask user whether to fix and redeploy

## Summary Table

| Step | Check      | Action on Fail            |
| ---- | ---------- | ------------------------- |
| 1    | TypeScript | STOP - fix errors         |
| 2    | Lint       | Auto-fix, retry           |
| 3    | Build      | STOP - fix errors         |
| 4    | Status     | Show changes              |
| 5    | Commit     | Create commit             |
| 6    | Push       | Push to remote            |
| 7    | Monitor    | Poll until READY or ERROR |

## Quick Reference

- **One push only**: All changes in single commit
- **Full validation**: TypeScript + Lint + Build before push
- **Full cycle**: Push AND monitor deployment until terminal state
