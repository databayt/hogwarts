## Auth -- Multi-tenant authentication with OAuth, credentials, and role-based access

### Overview

The auth block provides the full authentication layer for the Hogwarts platform, built on Auth.js (NextAuth v5). It supports Google and Facebook OAuth, email/password credentials, two-factor authentication, email verification, password reset, and cross-subdomain SSO via `.databayt.org` cookies. All authentication is multi-tenant aware, with `schoolId` embedded in sessions and JWT tokens.

### Capabilities by Role

- **DEVELOPER**: Platform-wide access across all schools, SaaS dashboard
- **ADMIN**: School administrator, created during onboarding, manages school users
- **TEACHER / STUDENT / GUARDIAN / ACCOUNTANT / STAFF**: School-scoped access based on role permissions
- **USER**: Default role for new registrations, no school association until onboarding or join

### Routes

| Route                             | Page                             | Status |
| --------------------------------- | -------------------------------- | ------ |
| `/{lang}/(auth)/login`            | Login form (OAuth + credentials) | Ready  |
| `/{lang}/(auth)/join`             | Registration form                | Ready  |
| `/{lang}/(auth)/reset`            | Password reset request           | Ready  |
| `/{lang}/(auth)/new-password`     | Set new password (token-based)   | Ready  |
| `/{lang}/(auth)/new-verification` | Email verification               | Ready  |
| `/{lang}/(auth)/error`            | Auth error display               | Ready  |
| `/{lang}/(auth)/access-denied`    | Access denied page               | Ready  |

### File Structure

```
src/components/auth/
  login/
    action.ts              # Login server action with smart redirect
    form.tsx               # Login form component
  join/
    action.ts              # Registration action
    form.tsx               # Registration form
  reset/
    action.ts              # Password reset request
    form.tsx               # Reset form
  password/
    action.ts              # Password change action
    token.ts               # Token generation
    form.tsx               # New password form
  verification/
    action.ts              # Email verification
    2f-token.ts            # 2FA token management
    2f-confirmation.ts     # 2FA confirmation logic
    verificiation-token.ts # Verification token utilities
    form.tsx               # Verification form
  setting/
    action.ts              # User settings update
  __tests__/
    validation.test.ts     # Zod schema tests (49)
    user.test.ts           # User utility tests (22)
    tokens.test.ts         # Token generation tests (16)
    login/action.test.ts   # Login action tests (24)
    join/action.test.ts    # Registration tests (12)
    a11y.test.tsx          # Accessibility tests
  user.ts                  # User queries (multi-tenant aware)
  user-info.tsx            # User display component
  user-button.tsx          # User dropdown menu
  social.tsx               # OAuth provider buttons
  role-gate.tsx            # Role-based access control wrapper
  card-wrapper.tsx         # Auth form wrapper
  header.tsx               # Form headers
  back-button.tsx          # Navigation
  login-button.tsx         # Login trigger
  logout-button.tsx        # Logout trigger
  logout-action.ts         # Logout server action
  form-error.tsx           # Error display
  form-success.tsx         # Success display
  error-card.tsx           # Error card component
  validation.ts            # Zod schemas for all auth forms
  tokens.ts                # Token utilities
  mail.ts                  # Email sending (Resend)
  auth.ts                  # Auth utilities
  account.ts               # Account management
  password.ts              # Password utilities
  admin-action.ts          # Admin actions
  admin-auth-guard.tsx     # Admin protection gate
  prisma-adapter.ts        # Custom Prisma adapter for NextAuth
  tenant-login.tsx         # Tenant-aware login component
  tenant-login-redirect.tsx # Tenant login redirect handler
  use-current-user.ts      # Current user hook
  use-current-role.ts      # Current role hook
  use-preview-role.ts      # Role preview hook (dev)
  cookie-debug.tsx         # Debug utilities
  debug-auth.tsx           # Auth debugging component
```

**Total**: 55 files (30 core + 19 subdirectory + 6 test files)

### Core Configuration Files (outside block)

| File                 | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `src/auth.ts`        | NextAuth config, JWT/session callbacks, redirect logic |
| `src/auth.config.ts` | Provider configuration (Google, Facebook, Credentials) |
| `src/middleware.ts`  | Route protection, subdomain detection, locale handling |
| `src/routes.ts`      | Public/protected/auth route definitions                |

### Status

**Completion:** 85% | **Blockers:** None for core auth. Invitation system and bulk user creation are post-MVP.

Core authentication (OAuth, credentials, 2FA, email verification, password reset, cross-subdomain SSO, role-based access) is production-ready. Remaining work is feature additions (invitations, join codes, bulk import) and technical debt cleanup (debug logging, redirect complexity).

### Integration Points

- [Onboarding block](../onboarding/README.md) -- New users without `schoolId` are directed to onboarding after registration
- `src/lib/tenant-context.ts` -- Centralized school context retrieval used by all server actions
- `src/lib/school-access.ts` -- School creation and ownership verification during onboarding
- `src/middleware.ts` -- Subdomain detection and auth cookie validation on every request
