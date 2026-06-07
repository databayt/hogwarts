---
description: Fast development loop for small changes (validate → fix → commit → deploy)
---

# Fast Development Loop

Optimized cycle for small changes. Runs quick checks, auto-fixes, commits, and deploys.

## Execute This Loop

### Step 1: Quick Validation (5s)

```bash
pnpm tsc --noEmit && pnpm lint --quiet
```

If errors found:

- Run `pnpm lint --fix` for auto-fixable issues
- Report remaining errors and STOP (don't proceed with broken code)

### Step 2: Test Changed Files (10s)

```bash
pnpm tests --changed --run
```

If tests fail → STOP and report failures

### Step 3: Build Check (15s)

```bash
pnpm build
```

If build fails → STOP and report errors

### Step 4: Auto-Commit

If all checks pass:

1. Stage changes: `git add -A`
2. Generate commit message from changes (conventional format)
3. Commit with message:

```bash
git commit -m "$(cat <<'EOF'
<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### Step 5: Deploy to Staging

```bash
git push origin HEAD
```

Vercel auto-deploys on push. Monitor deployment status.

### Step 6: Report

```
═══════════════════════════════════════
✅ DEVELOPMENT LOOP COMPLETE
═══════════════════════════════════════
TypeScript: ✅ 0 errors
Lint:       ✅ Passed
Tests:      ✅ X passed
Build:      ✅ Xs
Commit:     ✅ <hash>
Deploy:     ✅ Pushed to <branch>

🔗 Preview: https://<branch>---hogwarts.vercel.app
═══════════════════════════════════════
```

## Failure Handling

If any step fails:

1. Report the specific failure
2. Suggest fix command
3. Do NOT proceed to next steps
4. User can re-run `/dev` after fixing

## When to Use

| Change Size                    | Command            | Time  |
| ------------------------------ | ------------------ | ----- |
| Tiny (typo, style)             | `/dev`             | ~30s  |
| Small (bug fix, small feature) | `/dev`             | ~30s  |
| Medium (new component)         | `/validate`        | ~2min |
| Large (new feature)            | `/ship production` | ~5min |

## Skip Options

- Skip tests: "skip tests" in prompt
- Skip deploy: "no deploy" in prompt
- Staging only: default behavior
- Production: use `/ship production` instead
