## Authentication & RBAC — Readiness Checklist

Scope: Auth.js (NextAuth v5) with credentials + OAuth, session with `schoolId`, role-based gating.

### Evidence

- Config: `src/auth.ts` (session/jwt callbacks; `schoolId`, `role`), `src/auth.config.ts` (providers)
- Middleware: `src/middleware.ts` (route protection patterns documented)
- Components: `src/components/auth/*` (forms, validation, role-gate, tokens, adapter)
- Prisma: `auth.prisma` with `UserRole`, multi-tenant uniqueness `@@unique([email, schoolId])`
- Docs: `/docs/authantication`

### Ship checklist

- [x] Credentials + Google + Facebook providers (env ready)
- [x] Session typed with `schoolId` and `role`
- [x] Role-gate component available
- [ ] Ensure protected routes and server actions enforce role checks consistently
- [ ] Add minimal tests for session shape and role guard utility
- [ ] i18n strings for auth flows

### Decision

- Status: READY — Do a final guard pass on critical routes/actions before enabling multi-role access in production.


