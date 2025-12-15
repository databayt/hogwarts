---
description: Fastest commit cycle - lint, fix, commit, push (10s)
---

# Quick Commit

Ultra-fast cycle for tiny changes (typos, style fixes, config tweaks).

## Execute

### Step 1: Auto-Fix (3s)

```bash
pnpm lint --fix --quiet
npx prettier --write "src/**/*.{ts,tsx}" --log-level silent
```

### Step 2: Quick Check (2s)

```bash
pnpm lint --quiet
```

If lint fails → STOP (change is not tiny, use `/dev` instead)

### Step 3: Commit & Push (5s)

```bash
git add -A
git commit -m "<type>: <brief description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### Step 4: Done

```
✅ Quick commit complete
Commit: <hash>
Push: origin/<branch>
Deploy: Auto-deploying to Vercel...
```

## When to Use

✅ Use `/quick` for:

- Typo fixes
- Comment updates
- CSS/style tweaks
- Config changes
- README updates
- Import reordering

❌ Don't use for:

- Logic changes (use `/dev`)
- New components (use `/dev` or `/validate`)
- Bug fixes (use `/dev`)
- New features (use `/validate` or `/ship`)

## Skips (by design)

- TypeScript check (assumes tiny change)
- Tests (assumes no logic change)
- Build (assumes no breaking change)

If any of these matter, use `/dev` instead.
