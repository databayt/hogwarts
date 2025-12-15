---
description: Full validation with specialized agents (post-change workflow)
---

Run comprehensive validation using specialized agents after code changes.

## Phase 1: Static Analysis (Parallel)

Invoke these agents **in parallel** using the Task tool:

1. **TypeScript Agent** (`/agents/typescript`)
   - Run `pnpm tsc --noEmit`
   - Check for type errors, any types, missing return types
   - Validate Zod schemas match TypeScript types

2. **Tailwind Agent** (`/agents/tailwind`)
   - Check for hardcoded text-_/font-_ classes (should use semantic HTML)
   - Validate RTL-aware utilities (ms-_, me-_, ps-_, pe-_)
   - Ensure theme colors used (bg-background, text-foreground)

3. **React Agent** (`/agents/react`)
   - Check for performance anti-patterns (inline functions, missing deps)
   - Validate hooks usage (proper dependency arrays)
   - Ensure React.memo/useMemo/useCallback where needed

## Phase 2: Framework Validation (Sequential)

4. **Next.js Agent** (`/agents/nextjs`)
   - Validate Server/Client component boundaries
   - Check Server Actions have "use server", schoolId, revalidatePath
   - Ensure mirror pattern followed (routes ↔ components)
   - Verify error.tsx and loading.tsx exist

## Phase 3: Build & Test (Sequential)

5. **Build Agent** (`/agents/build`)
   - Run `pnpm build`
   - Check bundle sizes (<100KB per route target)
   - Verify no build warnings/errors
   - Ensure Prisma client is generated

6. **Test Agent** (`/agents/test`)
   - Run `pnpm test`
   - Check coverage (95%+ target)
   - Verify all tests pass

## Phase 4: Deploy Decision

If all phases pass, ask user:

- "Deploy to staging?" → Run `/deploy staging`
- "Deploy to production?" → Run `/deploy production`
- "Skip deployment" → End validation

## Output Format

```
## Validation Summary

### Phase 1: Static Analysis
- TypeScript: [PASS/FAIL] - [details]
- Tailwind: [PASS/FAIL] - [details]
- React: [PASS/FAIL] - [details]

### Phase 2: Framework
- Next.js: [PASS/FAIL] - [details]

### Phase 3: Build & Test
- Build: [PASS/FAIL] - [time]s, [bundle size]
- Tests: [PASS/FAIL] - [passed]/[total], [coverage]%

### Overall: [PASS/FAIL]

[If PASS] Ready to deploy. Options:
1. /deploy staging
2. /deploy production
3. Skip
```

## Quick Mode

For faster validation (skip agents, run commands only):

```bash
pnpm tsc --noEmit && pnpm lint && pnpm test && pnpm build
```
