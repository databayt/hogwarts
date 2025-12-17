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

### Step 7: Monitor Vercel

After push, show:

```
═══════════════════════════════════════
✅ PUSH COMPLETE
═══════════════════════════════════════
Branch: <branch>
Commit: <hash>
Preview: https://<branch>---hogwarts.vercel.app
Vercel Dashboard: https://vercel.com/databayt/hogwarts
═══════════════════════════════════════
```

## Summary Table

| Step | Check      | Action on Fail    |
| ---- | ---------- | ----------------- |
| 1    | TypeScript | STOP - fix errors |
| 2    | Lint       | Auto-fix, retry   |
| 3    | Build      | STOP - fix errors |
| 4    | Status     | Show changes      |
| 5    | Commit     | Create commit     |
| 6    | Push       | Push to remote    |
| 7    | Monitor    | Show Vercel URL   |

## Quick Reference

- **One push only**: All changes in single commit
- **Full validation**: TypeScript + Lint + Build before push
- **Monitoring**: Vercel preview URL provided
