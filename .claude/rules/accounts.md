---
paths:
  - "prisma/seeds/**"
  - "src/auth.ts"
  - "src/lib/multi-tenant-prisma-adapter.ts"
  - "src/lib/school-access.ts"
  - "src/components/auth/**"
---

# Test Account Protection (CRITICAL)

## Protected Accounts

These accounts have IMMUTABLE roles — NEVER write code that changes them:

| Email              | Role      | Purpose                        |
| ------------------ | --------- | ------------------------------ |
| `dev@balqalam.com` | DEVELOPER | Platform admin, SaaS dashboard |

The legacy `dev@databayt.org` address stays in `PROTECTED_EMAILS` until every
environment has run `prisma/seeds/migrate-login-domain.ts` — an unmigrated row
must not lose its DEVELOPER role.

## Resettable Accounts

These accounts CAN be reset (manually via seed scripts) for fresh testing:

| Email                    | Role | Purpose                    |
| ------------------------ | ---- | -------------------------- |
| `user@balqalam.com`      | USER | Onboarding wizard testing  |
| `applicant@balqalam.com` | USER | Application wizard testing |

## Rules

1. **Bulk role updates** (`updateMany` with `role:`) MUST exclude protected emails via `PROTECTED_EMAILS`
2. **OAuth adapter** must return `role` field from DB — omitting it causes JWT to lose the role
3. **Seed scripts** must use `ADMIN_USERS` from `prisma/seeds/constants.ts` as source of truth for roles
4. **Never hardcode role assignments** — always reference `constants.ts` for what role an email should have

## Dangerous Patterns

```typescript
// DANGEROUS: bulk role reset without exclusion
await prisma.user.updateMany({
  where: { schoolId: { in: ids } },
  data: { role: "USER" }, // This catches DEVELOPER users too!
})

// SAFE: exclude protected accounts
await prisma.user.updateMany({
  where: {
    schoolId: { in: ids },
    email: { notIn: PROTECTED_EMAILS },
  },
  data: { role: "USER" },
})
```

## Key Files

| File                                     | Danger                                     |
| ---------------------------------------- | ------------------------------------------ |
| `prisma/seeds/reset-test-user.ts`        | Bulk `updateMany` can wipe DEVELOPER role  |
| `prisma/seeds/constants.ts`              | Source of truth for account roles          |
| `src/lib/multi-tenant-prisma-adapter.ts` | OAuth adapter must return `role` field     |
| `src/auth.ts` (JWT callback)             | Role refresh logic at lines 588-633        |
| `src/lib/school-access.ts`               | `syncUserSchoolContext()` can change roles |
