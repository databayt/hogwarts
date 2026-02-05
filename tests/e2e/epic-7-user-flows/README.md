# Epic 7: User Flow Distinction Tests

Tests for the user flow distinction between SaaS Marketing and School Marketing.

## Problem Statement

The login flow needs to distinguish between:

1. **Fresh user in SaaS Marketing** - Potential SaaS customer wanting to create a school
2. **Fresh user in School Marketing** - Potential student/teacher wanting to join an existing school

## Key Behaviors

### SaaS Marketing (ed.databayt.org / localhost:3000)

| Action              | Expected Result                              |
| ------------------- | -------------------------------------------- |
| Click "Login"       | After auth → **STAY on SaaS marketing**      |
| Click "Get Started" | After auth → **/onboarding** (create school) |

### School Marketing (demo.databayt.org / demo.localhost:3000)

| Action           | User Type     | Expected Result                              |
| ---------------- | ------------- | -------------------------------------------- |
| Click "Login"    | Any           | After auth → **STAY on school marketing**    |
| Click "Platform" | School member | After auth → **/dashboard**                  |
| Click "Platform" | Non-member    | After auth → **/access-denied**              |
| Click "Platform" | DEVELOPER     | After auth → **/dashboard** (always allowed) |

## Critical Rule

```
/onboarding is ONLY reachable via "Get Started" button in SaaS Marketing hero section.
No other path leads there.
```

## Test Files

- `saas-login-flow.spec.ts` - Tests for SaaS marketing login behavior
- `school-login-flow.spec.ts` - Tests for school marketing login behavior

## Running Tests

```bash
# Run all Epic 7 tests
pnpm test:e2e tests/e2e/epic-7-user-flows/

# Run specific test file
pnpm test:e2e tests/e2e/epic-7-user-flows/saas-login-flow.spec.ts
pnpm test:e2e tests/e2e/epic-7-user-flows/school-login-flow.spec.ts
```

## Test Accounts

All test accounts use password: `1234`

| Email                | Role      | schoolId | Use For                        |
| -------------------- | --------- | -------- | ------------------------------ |
| `dev@databayt.org`   | DEVELOPER | null     | Platform admin, can access all |
| `user@databayt.org`  | USER      | null     | Fresh user, no school          |
| `admin@databayt.org` | ADMIN     | demo     | Demo school administrator      |

## Implementation Details

### Login Action (src/components/auth/login/action.ts)

The login action now accepts options with context:

```typescript
interface LoginOptions {
  callbackUrl?: string | null
  context?: "saas" | "school" // Login context
  subdomain?: string | null // School subdomain (when context is "school")
}
```

Redirect logic:

1. **Explicit callbackUrl** → Follow it (with membership checks for /dashboard)
2. **No callbackUrl** → Stay on current marketing page based on context

### User Button (src/components/auth/user-button.tsx)

Login URL includes context params:

- SaaS: `/login?context=saas`
- School: `/login?context=school&subdomain=demo`

### Login Form (src/components/auth/login/form.tsx)

Reads context params and passes to login action:

- `context` - "saas" or "school"
- `subdomain` - The school subdomain (when context is "school")
