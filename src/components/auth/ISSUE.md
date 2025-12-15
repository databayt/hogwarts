# Authentication Block - Production Readiness Tracker

## Overview

This document tracks issues, improvements, and technical debt in the authentication module. The auth system is **production-ready** for core authentication but has areas for optimization and new features for multi-tenant school management.

## Current Status

| Category                          | Status           |
| --------------------------------- | ---------------- |
| Core Authentication               | Production Ready |
| Multi-Tenant Support              | Production Ready |
| OAuth Providers (Google/Facebook) | Production Ready |
| Email Verification                | Production Ready |
| Two-Factor Auth                   | Production Ready |
| Cross-Subdomain SSO               | Production Ready |
| Invitation System                 | Not Implemented  |
| Bulk User Creation                | Not Implemented  |
| School Join Codes                 | Not Implemented  |

---

## P0 - Critical Issues (Must Fix)

### 1. Excessive Debug Logging in Production

**Status**: Open
**Priority**: P0
**Files**: `src/auth.ts` (lines 337-1034)
**Impact**: Performance degradation, potential security info leakage

**Current State**:

```typescript
// Over 800 lines of console.log statements in redirect callback
log('=====================================');
log('REDIRECT CALLBACK START');
log('=====================================');
log('Input Parameters:', { url, baseUrl, ... });
// ... hundreds more
```

**Required Fix**:

```typescript
// Wrap ALL debug logging
const isDev = process.env.NODE_ENV === "development"
const log = isDev ? console.log : () => {}
```

**Acceptance Criteria**:

- [ ] Zero console.log in production builds
- [ ] All debug logs wrapped in environment check
- [ ] Performance improvement verified

---

### 2. getUserByEmail Returns Non-Tenant-Specific User

**Status**: Open
**Priority**: P0
**Files**: `src/components/auth/user.ts` (lines 6-19)
**Impact**: Could return wrong user in multi-tenant edge cases

**Current State**:

```typescript
export const getUserByEmail = async (email: string) => {
  const users = await db.user.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
  })
  return users[0] || null // Returns ANY user with this email
}
```

**Required Fix**:

```typescript
export const getUserByEmail = async (email: string, schoolId?: string) => {
  if (schoolId) {
    return db.user.findFirst({
      where: { email, schoolId },
    })
  }
  const users = await db.user.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
  })
  return users[0] || null
}
```

**Acceptance Criteria**:

- [ ] Add optional schoolId parameter
- [ ] Update all callers to pass schoolId when available
- [ ] Add tenant-specific lookup for credentials login

---

### 3. New OAuth Users Lack School Context

**Status**: Open
**Priority**: P0
**Files**: `src/components/auth/user.ts`, `src/auth.ts`
**Impact**: Users exist in limbo without schoolId until completing onboarding

**Current Flow**:

```
OAuth Login → User Created (no schoolId) → Redirect → ??? → Onboarding
```

**Required Fix**:

1. Detect new OAuth users in JWT callback
2. Force redirect to onboarding for users without schoolId
3. Ensure onboarding creates school-user link atomically

**Acceptance Criteria**:

- [ ] New OAuth users redirected to /onboarding
- [ ] No user can access dashboard without schoolId (except DEVELOPER)
- [ ] Onboarding creates school-user link in single transaction

---

## P1 - High Priority (Should Fix Before Production)

### 1. Missing Invitation System

**Status**: Not Implemented
**Priority**: P1
**Effort**: 3-5 days

**Business Need**:
Schools want to invite specific users with pre-assigned roles instead of open registration.

**Proposed Design**:

```typescript
// Database model
model Invitation {
  id        String   @id @default(cuid())
  code      String   @unique
  schoolId  String
  role      UserRole
  email     String?
  maxUses   Int      @default(1)
  usedCount Int      @default(0)
  expiresAt DateTime
  createdBy String
  createdAt DateTime @default(now())
  school    School   @relation(fields: [schoolId], references: [id])
}
```

**Components Needed**:

```
src/components/auth/invitation/
├── action.ts       # Create, validate, use invitation
├── form.tsx        # Accept invitation UI
├── admin-form.tsx  # Create invitation UI
├── types.ts        # TypeScript types
└── validation.ts   # Zod schemas
```

---

### 2. Missing Bulk User Creation

**Status**: Not Implemented
**Priority**: P1
**Effort**: 2-3 days

**Business Need**:
Schools want to import students/teachers from CSV without manual entry.

**Acceptance Criteria**:

- [ ] CSV upload with column mapping
- [ ] Validation before import
- [ ] Batch creation with rollback
- [ ] Option to auto-send credentials
- [ ] Import report

---

### 3. Missing School Join Codes

**Status**: Not Implemented
**Priority**: P1
**Effort**: 1-2 days

**Business Need**:
Schools want simple codes for students to join.

**Schema Change**:

```prisma
model School {
  joinCode      String?   @unique  // e.g., "HOGWARTS-2024"
  joinEnabled   Boolean   @default(true)
  defaultRole   UserRole  @default(STUDENT)
}
```

---

### 4. Remove Facebook URL Hash (#_=_)

**Status**: Partially Implemented
**Files**: `src/components/auth/social.tsx`
**Issue**: Facebook appends #_=_ to redirect URLs

**Current Solution**: Client-side cleanup on component mount
**Better Solution**: Server-side cleanup in redirect callback

---

## P2 - Medium Priority

### 1. Redirect Logic Complexity

**Status**: Technical Debt
**Files**: `src/auth.ts` (redirect callback)
**Issue**: 700+ lines with multiple fallback methods
**Recommendation**: Extract to utility functions, simplify chain

---

### 2. Orphaned School Security

**Status**: Open
**Files**: `src/lib/school-access.ts`
**Issue**: Any user can claim schools with no users
**Fix**: Add explicit ownership claim flow

---

### 3. Preview Role Security

**Status**: Open
**Files**: `src/auth.ts`
**Issue**: Cookie-based role preview in production
**Fix**: Restrict to development environment only

---

### 4. Session Refresh Workarounds

**Status**: Technical Debt
**Files**: `src/auth.ts` (JWT callback)
**Issue**: Multiple hacks (hash, updatedAt, sessionToken) for session refresh
**Fix**: Proper session invalidation strategy

---

## P3 - Low Priority (Post-Launch)

### Future Enhancements

1. Account linking (same user, multiple schools)
2. Magic link authentication
3. WebAuthn/passkey support
4. Session activity logging
5. More OAuth providers (GitHub, Apple)

---

## Resolved Issues

### OAuth & Deployment

- [x] **Prisma Client Initialization Error on Vercel**
  - Solution: Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]`
  - Status: Fixed

- [x] **Facebook OAuth 500 Error**
  - Solution: Fixed callback URLs, error handling, environment variables
  - Status: Fixed

- [x] **Conflicting Facebook credentials**
  - Solution: Environment validation added
  - Status: Fixed

- [x] **Google OAuth redirect_uri_mismatch**
  - Solution: Registered correct callback URLs in Google Cloud Console
  - Status: Fixed

### Core Features

- [x] Basic NextAuth setup with OAuth providers
- [x] Email/password authentication with bcrypt
- [x] Two-factor authentication
- [x] Email verification flow
- [x] Password reset functionality
- [x] Role-based access control (8 roles)
- [x] Multi-tenant user isolation via schoolId
- [x] Cross-subdomain cookie configuration
- [x] Smart redirect after login to school subdomain

---

## Multi-Tenant Authentication Analysis

### What's Working Well

| Feature                 | Status    | Notes                          |
| ----------------------- | --------- | ------------------------------ |
| Cross-subdomain cookies | Excellent | `.databayt.org` enables SSO    |
| Smart redirect          | Excellent | Users → their school subdomain |
| Role hierarchy          | Excellent | 8 clear permission levels      |
| School isolation        | Good      | schoolId on User model         |
| Compound uniqueness     | Good      | Same email across schools      |
| OAuth integration       | Good      | Google/FB working              |
| Session management      | Good      | JWT with 24h expiry            |
| Tenant context          | Good      | Centralized retrieval          |

### OAuth + Credentials: Best Practice?

**Yes**, this is the right approach for school management:

| Method          | Use Case               | Benefits                               |
| --------------- | ---------------------- | -------------------------------------- |
| **OAuth**       | Self-registration      | No password management, verified email |
| **Credentials** | Admin-created accounts | Full control, bulk creation            |

**Recommendation**: Offer both, let schools choose.

---

## Technical Debt

| Issue                        | File       | Priority |
| ---------------------------- | ---------- | -------- |
| Debug logs in production     | auth.ts    | P0       |
| 1000+ line redirect callback | auth.ts    | P2       |
| Missing tests                | all        | P2       |
| Hardcoded URLs in social.tsx | social.tsx | P3       |

---

## Testing Status

### Current Coverage

| Test Type         | Status  | Tests          |
| ----------------- | ------- | -------------- |
| Unit tests        | ✅      | 123 passing    |
| Integration tests | Pending | -              |
| E2E tests         | Pending | Critical paths |

### Test Files

| File                             | Tests | Status     |
| -------------------------------- | ----- | ---------- |
| `__tests__/validation.test.ts`   | 49    | ✅ Passing |
| `__tests__/user.test.ts`         | 22    | ✅ Passing |
| `__tests__/tokens.test.ts`       | 16    | ✅ Passing |
| `__tests__/login/action.test.ts` | 24    | ✅ Passing |
| `__tests__/join/action.test.ts`  | 12    | ✅ Passing |

### Tests Document Known Issues

The test suite explicitly documents P0 issues:

```typescript
// user.test.ts
it("P0 ISSUE: returns user without tenant scoping", async () => {
  // Documents that getUserByEmail doesn't scope by schoolId
  expect(mockedDb.user.findMany).toHaveBeenCalledWith({
    where: { email: "shared@example.com" }, // Missing schoolId!
  })
})

it("P0 ISSUE: creates user without schoolId", async () => {
  // Documents that OAuth users have no schoolId
  expect(createCall.data.schoolId).toBeUndefined()
})
```

### Running Tests

```bash
# Run all auth tests
pnpm test src/components/auth/__tests__

# Run with --run flag (no watch)
pnpm test src/components/auth/__tests__ --run
```

### Tests Still Needed

- [ ] `reset/action.test.ts` - Password reset flow
- [ ] `password/action.test.ts` - Password change action
- [ ] `verification/action.test.ts` - Email verification
- [ ] `setting/action.test.ts` - User settings
- [ ] `role-gate.test.tsx` - Role-based access control
- [ ] E2E: Full login flow
- [ ] E2E: OAuth callback handling
- [ ] E2E: Cross-subdomain SSO

---

## Debugging Guide

### Facebook OAuth Issues

1. Check callback URL: `https://ed.databayt.org/api/auth/callback/facebook`
2. Verify app is in "Live" mode
3. Check environment variables
4. Use debug endpoint: `/api/auth/debug/facebook`

### Google OAuth Issues

1. Check callback URL: `https://ed.databayt.org/api/auth/callback/google`
2. Verify redirect URIs in Google Cloud Console
3. Check OAuth consent screen configuration

### Prisma Issues

1. Add binary targets to schema.prisma
2. Run `prisma generate` before build
3. Check `/api/debug/prisma` endpoint

### Session Issues

1. Check cookie domain (`.databayt.org`)
2. Verify AUTH_SECRET is set
3. Check JWT expiry (24h)

---

## Recommended Next Steps

| Priority             | Task                 | Description                                  | Effort   |
| -------------------- | -------------------- | -------------------------------------------- | -------- |
| **P0 - Immediate**   | Remove debug logging | 800+ lines of console.log in auth.ts         | 1 day    |
| **P1 - Short-term**  | Invitation system    | Schools invite users with pre-assigned roles | 3-5 days |
| **P1 - Short-term**  | School join codes    | Simple codes like "HOGWARTS-2024"            | 1-2 days |
| **P1 - Medium-term** | Bulk user creation   | CSV import for students/teachers             | 2-3 days |

---

## Sprint Planning

### Current Sprint (Week 1)

1. [P0] Remove debug logging from auth.ts
2. [P0] Fix getUserByEmail tenant awareness
3. [P0] Ensure OAuth users redirect to onboarding

### Next Sprint (Week 2-3)

1. [P1] Implement invitation system with roles
2. [P1] Add school join codes
3. [P1] Implement bulk user creation via CSV

### Future Sprints

- Session refresh improvements
- Redirect logic refactoring
- Testing suite
- Security hardening

---

## Success Metrics

| Metric                  | Current | Target |
| ----------------------- | ------- | ------ |
| Login success rate      | 95%     | 99%    |
| OAuth callback issues   | 5/week  | 0      |
| Session-related bugs    | 3/week  | 0      |
| Time to first dashboard | 8s      | 3s     |
| Test coverage           | 0%      | 80%    |

---

## Related Documentation

- [README.md](./README.md) - Module overview and architecture
- [Authentication Docs](/docs/authentication) - User-facing documentation
- [Onboarding ISSUE.md](/src/components/onboarding/ISSUE.md) - Related issues

---

**Last Updated**: December 2024
**Owner**: Platform Engineering Team
**Target**: Q1 2025
