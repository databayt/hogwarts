---
description: Create server action or API route
requiresArgs: true
---

Create API: $1

1. Invoke /agents/api to design endpoint
2. Invoke /agents/prisma for database operations
3. Invoke /agents/multi-tenant to verify schoolId scoping
4. Invoke /agents/test to generate tests

Requirements:

- Zod validation
- schoolId included in all queries
- revalidatePath() or redirect() called
- Error handling
- TypeScript types
