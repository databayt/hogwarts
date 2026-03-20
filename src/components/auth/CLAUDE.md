# Auth Block

## Context

Multi-tenant authentication layer (NextAuth v5): OAuth (Google, Facebook), credentials, 2FA, email verification, password reset, cross-subdomain SSO (85% complete, no blockers for core auth).

## Before You Start

1. Read `README.md` here for routes, file structure, and core config files
2. Key files outside this block: `src/auth.ts` (777 lines), `src/auth.config.ts`, `src/routes.ts`, `src/middleware.ts`
3. Read `src/auth.ts` JWT/session callbacks before modifying auth behavior

## Key Decisions

- `src/auth.ts` is the central config (777 lines) -- JWT callbacks embed `schoolId` and `role` in tokens
- Cross-subdomain SSO via `.databayt.org` cookie domain -- all schools share one auth session
- OAuth callback URL preserved via httpOnly cookies (not URL params) -- see `src/auth.ts` redirect logic
- `authjs.role` cookie synced on login for middleware RBAC checks (edge-compatible)
- Custom Prisma adapter in `prisma-adapter.ts` handles multi-tenant user lookup
- Login redirect logic: USER without school → stays on SaaS marketing (NOT onboarding)

## Danger Zones

- `src/auth.ts` -- 777 lines, extremely complex; small changes break auth across all tenants
- `src/routes.ts` -- RBAC matrix; incorrect changes lock out roles or expose protected routes
- `prisma-adapter.ts` -- custom adapter; changes affect all OAuth flows
- Cookie domain (`.databayt.org`) -- changing this breaks cross-subdomain SSO
- `authjs.role` cookie -- must stay in sync with JWT role; stale cookie = access denied

## Related Blocks

- [Onboarding](../onboarding/CLAUDE.md) -- new users directed to onboarding after registration
- [School Dashboard](../school-dashboard/CLAUDE.md) -- requires authenticated session with schoolId
- [SaaS Dashboard](../saas-dashboard/CLAUDE.md) -- DEVELOPER role auth gate

## After You Finish

1. Update `README.md` -- if routes or auth behavior changed
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test all auth flows: login, OAuth, register, reset password
4. Verify cross-subdomain: login on `demo.localhost:3000`, check session on `localhost:3000`
