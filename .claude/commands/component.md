---
description: Generate React component with full boilerplate
requiresArgs: true
---

Create component $1:

1. Invoke /agents/react to generate component structure
2. Invoke /agents/typescript for TypeScript types
3. Invoke /agents/test to create test file
4. Invoke /agents/prettier to format files

Follow project patterns from @CLAUDE.md.

Generate:
- `components/$1/index.tsx` - Component implementation
- `components/$1/types.ts` - TypeScript interfaces
- `components/$1/$1.test.tsx` - Vitest tests

Requirements:
- TypeScript strict mode
- Props interface exported
- Default export component
- Tailwind for styling
- Test coverage 95%+
