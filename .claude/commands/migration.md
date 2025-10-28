---
description: Generate Prisma database migration
requiresArgs: true
---

Create migration: $1

1. Invoke /agents/prisma to design schema changes
2. Invoke /agents/multi-tenant to verify schoolId field
3. Generate migration: pnpm prisma migrate dev --name $1 --create-only
4. Review generated SQL
5. Invoke /agents/database-optimizer for index recommendations
6. Apply migration after confirmation

CRITICAL: All models must include schoolId for multi-tenant safety!
