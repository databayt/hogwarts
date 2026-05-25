---
epic: 07
sprint: Q3-2026
title: Auth (role-aware UI source)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/325
docs: https://ed.databayt.org/en/docs/auth
last_audited: 2026-05-25
---

# Auth -- Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-04-20

---

## MVP Checklist

- [x] OAuth providers (Google, Facebook)
- [x] Email/password credentials with bcrypt
- [x] JWT-based sessions with 24h expiry
- [x] Cross-subdomain SSO via `.databayt.org` cookies
- [x] Email verification flow
- [x] Password reset flow (token-based)
- [x] Two-factor authentication
- [x] Role-based access control (8 roles)
- [x] Multi-tenant user isolation via `schoolId`
- [x] Smart redirect after login to school subdomain
- [x] Session extension with `schoolId` and `role`
- [x] Tenant context retrieval (`getTenantContext`)
- [x] Custom Prisma adapter for NextAuth
- [x] Unit tests for validation, user queries, tokens, login, join (123 passing)
- [ ] Remove excessive debug logging from `auth.ts`
- [ ] Tenant-scope `getUserByEmail` lookup

## Known Issues

### P0 -- Critical

- [ ] **Hotmail/Outlook not receiving OTP** ([#254](https://github.com/databayt/hogwarts/issues/254)) -- Regression, Microsoft-hosted inboxes silently drop OTP from `noreply@databayt.org` while Gmail works. Most likely sender-reputation decay at Microsoft (not a code bug). `mail.ts` was also masking Resend errors — fixed to log `error.name`/`error.message` and return `false` on failure. Next: inspect Resend dashboard for the bounce reason, consider splitting auth email to a dedicated `auth.databayt.org` sending subdomain.
- [ ] **Excessive debug logging in auth.ts** -- Over 800 lines of `console.log` in the redirect callback. Causes performance degradation and potential security info leakage in production. Fix: wrap in `process.env.NODE_ENV === 'development'` check.
- [ ] **`getUserByEmail` not tenant-scoped** -- Returns first user matching email regardless of school. In multi-tenant edge cases (same email across schools), could return wrong user. Fix: add optional `schoolId` parameter and update all callers.
- [ ] **New OAuth users lack school context** -- OAuth users are created without `schoolId`, relying on onboarding to link them. Gap exists where user has no school association. Fix: ensure mandatory redirect to onboarding for users without `schoolId`.

### P1 -- High

- [ ] **No invitation system** -- Schools cannot invite users with pre-assigned roles. Requires new `Invitation` model, server actions, and UI.
- [ ] **No bulk user creation** -- Admins must create accounts one-by-one. Requires CSV import with role assignment and batch creation.
- [ ] **No school join codes** -- No simple mechanism for students to join a school. Requires `joinCode` field on School model.
- [ ] **Session refresh workarounds** -- Multiple hacks (hash, updatedAt, sessionToken) used to refresh sessions after user data changes. Needs proper session invalidation strategy.

### P2 -- Medium

- [ ] **Redirect logic complexity** -- 700+ line redirect callback in `auth.ts` with multiple fallback methods. Hard to maintain, potential edge case bugs. Extract to utility functions.
- [ ] **Orphaned school access** -- Any user can claim schools with no users. Needs explicit ownership claim flow.
- [ ] **Preview role security** -- Cookie-based role preview is available in production. Restrict to development environment.
- [ ] **Facebook URL hash (#_=_)** -- Facebook appends `#_=_` to redirect URLs. Partially handled client-side, should be cleaned server-side.

## Resolved Issues

- [x] Prisma client initialization error on Vercel (added `binaryTargets`)
- [x] Facebook OAuth 500 error (fixed callback URLs and error handling)
- [x] Conflicting Facebook credentials (environment validation added)
- [x] Google OAuth `redirect_uri_mismatch` (registered correct callback URLs)
- [x] Basic NextAuth setup with all providers
- [x] Cross-subdomain cookie configuration
- [x] Smart redirect after login to school subdomain
- [x] Authentication fallback logic in onboarding (atomic transactions with `$transaction`)
- [x] Role cookie sync on login (`authjs.role` cookie)
- [x] CallbackUrl preservation in login-to-join link and OAuth tenant flow

## Enhancements (Post-MVP)

- [ ] Account linking (same user, multiple schools)
- [ ] Magic link authentication
- [ ] WebAuthn/passkey support
- [ ] Session activity logging
- [ ] Additional OAuth providers (GitHub, Apple)
- [ ] Rate limiting on auth endpoints
- [ ] E2E tests for full login flow, OAuth callbacks, cross-subdomain SSO

---

**Last Review:** 2026-03-19
