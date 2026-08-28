---
name: "source-command-fix-all"
description: "Auto-fix all code quality issues"
---

# source-command-fix-all

Use this skill when the user asks to run the migrated source command `fix-all`.

## Command Template

Run all auto-fixers:

1. Format code: npx prettier --write src/\*_/_.{ts,tsx,js,jsx}
2. Lint: pnpm lint --fix
3. Type check: pnpm tsc --noEmit
4. Prisma format: pnpm prisma format

Report results:

- Files formatted
- Lint issues fixed
- Type errors (if any)
- Action needed (if any)
