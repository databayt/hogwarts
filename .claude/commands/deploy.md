---
description: Deploy to environment (staging/production)
requiresArgs: false
---

# Deploy to Vercel

Push changes and monitor Vercel deployment until READY or ERROR.

## Argument: $ARGUMENTS

- No args: Deploy current changes to current branch
- `status`: Check latest deployment status
- `logs`: Fetch build logs from latest/failed deployment

## Vercel Project

- **Project ID**: `prj_jI7ezom5AbJfMbeB8F9lquA94OMP`
- **Team ID**: `team_byS1aI4jmz4mSh0RNx8dR12J`

## Instructions

### If argument is "status":

1. Call `list_deployments` with projectId and teamId
2. Show the last 5 deployments with state, commit message, and timestamp
3. Highlight current production deployment

### If argument is "logs":

1. Call `list_deployments` to find the latest ERROR deployment
2. Call `get_deployment_build_logs` with limit 200
3. Extract and show the last 40 meaningful lines (skip blank lines)
4. Provide root cause analysis

### If argument is empty or "production":

Execute the full deployment pipeline:

#### Phase 1: Validate

Run in parallel:

```bash
pnpm tsc --noEmit
```

```bash
pnpm lint --quiet
```

- If TypeScript fails: show errors, STOP
- If lint fails: run `pnpm lint --fix`, re-check, STOP if still failing

#### Phase 2: Commit

1. Run `git status --short` to see changes
2. Run `git diff --staged` and `git diff` to understand changes
3. Run `git log --oneline -5` for commit message style
4. Stage relevant files (prefer specific files over `git add -A`)
5. Create commit with conventional type:

```bash
git commit -m "<type>: <description>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

#### Phase 3: Push

```bash
git push origin $(git branch --show-current)
```

#### Phase 4: Monitor Vercel Deployment

This is the critical phase. Use MCP tools (NOT CLI).

1. **Find deployment**: Call `list_deployments` (projectId + teamId). Match the latest deployment by commit SHA.

2. **Poll loop**: Call `get_deployment` every 60 seconds until `readyState` is `READY` or `ERROR`.
   - While `BUILDING` or `QUEUED`: wait 60s, poll again
   - Max wait: 50 minutes (Vercel Hobby timeout is 45 min)

3. **On READY**:

```
============================================
DEPLOYMENT SUCCESSFUL
============================================
Branch: <branch>
Commit: <short-sha> <message>
URL:    <deployment-url>
State:  READY
============================================
```

4. **On ERROR**:
   - Call `get_deployment_build_logs` with limit 200
   - Extract last 40 meaningful lines
   - Analyze the error:

| Error Pattern                                          | Root Cause                             | Fix                                                |
| ------------------------------------------------------ | -------------------------------------- | -------------------------------------------------- |
| `SIGKILL` / no output after "Creating optimized build" | OOM - exceeded 8GB                     | Reduce routes, check .vercelignore excludes docs   |
| Build timeout (>45 min)                                | Too many routes for 2-core machine     | Reduce routes via .vercelignore                    |
| `FUNCTION_INVOCATION_FAILED`                           | Serverless function too large (>250MB) | Add to outputFileTracingExcludes in next.config.ts |
| TypeScript errors                                      | Type check disabled but still failing  | Fix the type error                                 |
| Module not found                                       | Missing dependency or bad import       | Fix import path or install dependency              |
| Prisma error                                           | Schema out of sync                     | Run prisma generate in postinstall                 |

- Show error summary and suggest fix
- Ask user: "Fix and redeploy?"

## Known Constraints (Vercel Hobby Plan)

- **8GB RAM, 2 cores** build machine
- **45-minute** build timeout
- **~287 routes** is the safe maximum (docs excluded via .vercelignore)
- **Cache warming**: GitHub Actions cron pushes empty commits every 12h to prevent cold builds
- **Dependabot builds**: Auto-canceled via ignoreCommand in vercel.json
- **Bundler**: Turbopack (Next.js 16 default) - do NOT add --webpack flag
- **No heap limit**: Let Turbopack manage its own memory (no NODE_OPTIONS)

## Quick Reference

| Command          | Purpose                               |
| ---------------- | ------------------------------------- |
| `/deploy`        | Full cycle: validate + push + monitor |
| `/deploy status` | Check deployment states               |
| `/deploy logs`   | Analyze failed build logs             |
