# Authentication Module

## Overview

This authentication module is built on Next.js App Router with Auth.js (NextAuth v5), providing a comprehensive solution for multi-tenant school management authentication. It supports OAuth providers (Google, Facebook), email/password credentials, two-factor authentication, email verification, and password reset functionality.

## Multi-Tenant School Management Architecture

### How Authentication Supports Multi-Tenancy

The authentication system is designed to support a multi-tenant school management platform with the following key features:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Marketing Page (ed.databayt.org)                               │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────┐                                            │
│  │   Get Started   │ ◄── School Owner/Principal clicks          │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │   OAuth Login   │ or  │ Credentials     │                    │
│  │ (Google/FB)     │     │ (Email/Pass)    │                    │
│  └────────┬────────┘     └────────┬────────┘                    │
│           │                       │                             │
│           └───────────┬───────────┘                             │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ User Created    │                                │
│              │ (no schoolId)   │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │   Onboarding    │                                │
│              │ /onboarding     │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────────────────────────┐            │
│              │      initializeSchoolSetup()       │            │
│              │  - Creates School record           │            │
│              │  - Links User.schoolId to School   │            │
│              │  - Sets User.role = ADMIN          │            │
│              └────────┬───────────────────────────┘            │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Complete Steps  │                                │
│              │ (16 steps)      │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────────────────────────┐            │
│              │   Subdomain Setup                  │            │
│              │   school.databayt.org              │            │
│              └────────┬───────────────────────────┘            │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Smart Redirect  │                                │
│              │ to Subdomain    │                                │
│              └─────────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### User Registration Options for Schools

The system provides **flexibility for schools** in how they manage user accounts:

#### Option 1: Self-Registration via OAuth (Recommended)
Students/Teachers authenticate themselves:
```
Student → school.databayt.org/login → Google/Facebook OAuth → Onboarding
```
- No admin work required
- Users verify their own email
- Streamlined experience

#### Option 2: Bulk Account Creation
School admin creates accounts:
```
Admin → Import CSV → Bulk user creation with schoolId → Send credentials
```
- Full admin control
- Pre-assigned roles
- Users get username/password

#### Option 3: Invitation System (Planned)
Admin invites specific users:
```
Admin → Generate invite link with role → User clicks → OAuth or Credentials → Linked to school
```
- Controlled onboarding
- Pre-assigned roles
- Combines admin control with user convenience

## Features

### Core Authentication
- **Multi-Provider Auth**: Google, Facebook, Email/Password
- **JWT-Based Sessions**: 24-hour expiry with automatic refresh
- **Session Tokens**: Cross-subdomain cookies (`.databayt.org`)
- **Email Verification**: Required for credentials, automatic for OAuth
- **Password Reset**: Secure token-based flow
- **Two-Factor Authentication**: Optional 2FA support

### Multi-Tenant Features
- **School Isolation**: `schoolId` field on User model
- **Compound Uniqueness**: Same email across different schools
- **Subdomain Routing**: `school.databayt.org` → school context
- **Smart Redirects**: OAuth → user's school subdomain
- **Role-Based Access**: 8 roles with hierarchy

### User Roles
```typescript
enum UserRole {
  DEVELOPER  // Platform admin (no schoolId, cross-school access)
  ADMIN      // School administrator
  TEACHER    // Teaching staff
  STUDENT    // Enrolled student
  GUARDIAN   // Parent/guardian
  ACCOUNTANT // Finance staff
  STAFF      // General staff
  USER       // Default role
}
```

## Directory Structure

```
src/components/auth/
├── login/
│   ├── action.ts         # Login server action with smart redirect
│   └── form.tsx          # Login form component
├── join/
│   ├── action.ts         # Registration action
│   └── form.tsx          # Registration form
├── reset/
│   ├── action.ts         # Password reset request
│   └── form.tsx          # Reset form
├── password/
│   ├── action.ts         # Password change action
│   ├── token.ts          # Token generation
│   └── form.tsx          # New password form
├── verification/
│   ├── action.ts         # Email verification
│   ├── 2f-token.ts       # 2FA token management
│   ├── 2f-confirmation.ts
│   ├── verificiation-token.ts
│   └── form.tsx
├── setting/
│   └── action.ts         # User settings update
├── error/
│   ├── error-card.tsx
│   └── form-error.tsx
├── user.ts               # User queries (multi-tenant aware)
├── user-info.tsx         # User display component
├── user-button.tsx       # User dropdown menu
├── social.tsx            # OAuth buttons
├── role-gate.tsx         # Role-based access control
├── card-wrapper.tsx      # Auth form wrapper
├── header.tsx            # Form headers
├── back-button.tsx       # Navigation
├── login-button.tsx      # Login trigger
├── logout-button.tsx     # Logout trigger
├── logout-action.ts      # Logout server action
├── form-error.tsx        # Error display
├── form-success.tsx      # Success display
├── validation.ts         # Zod schemas
├── tokens.ts             # Token utilities
├── mail.ts               # Email sending
├── auth.ts               # Auth utilities
├── account.ts            # Account management
├── admin-action.ts       # Admin actions
├── admin-auth-guard.tsx  # Admin protection
├── prisma-adapter.ts     # Custom Prisma adapter
├── tenant-login.tsx      # Tenant-aware login
├── tenant-login-redirect.tsx
├── use-current-user.ts   # Current user hook
├── use-current-role.ts   # Current role hook
├── use-preview-role.ts   # Role preview (dev)
├── cookie-debug.tsx      # Debug utilities
└── debug-auth.tsx        # Auth debugging
```

## Core Files

### `src/auth.ts` (Main Configuration)
- NextAuth configuration
- JWT and session callbacks
- Cookie configuration for cross-subdomain
- Smart redirect callback (800+ lines)
- School domain lookup for redirects

### `src/auth.config.ts` (Providers)
- Google OAuth configuration
- Facebook OAuth configuration
- Credentials provider with bcrypt

### `src/middleware.ts` (Route Protection)
- Locale detection (ar/en)
- Subdomain detection and rewriting
- Auth cookie validation
- Protected route enforcement

### `src/routes.ts` (Route Definitions)
- Public routes (/, /docs, /pricing, etc.)
- Protected routes (/dashboard, /onboarding)
- Auth routes (/login, /join)

## Multi-Tenant Integration

### Session Extension
```typescript
// Extended session with school context
session.user = {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string | null;  // Key for multi-tenancy
  isPreviewMode?: boolean;
}
```

### Tenant Context
```typescript
// src/lib/tenant-context.ts
export async function getTenantContext(): Promise<TenantContext> {
  // Priority: impersonation cookie → subdomain header → session.schoolId
  return {
    schoolId: string | null;
    role: UserRole | null;
    isPlatformAdmin: boolean;
    requestId: string | null;
  };
}
```

### School Access Control
```typescript
// src/lib/school-access.ts
export async function ensureUserSchool(userId: string): Promise<SchoolCreationResult> {
  // Check if user has school
  // If not, create new school and link user
  // Set user role to ADMIN
}

export async function canUserAccessSchool(userId: string, schoolId: string): Promise<SchoolAccessResult> {
  // DEVELOPER can access any school
  // User can access own school
  // User can claim orphaned schools
}
```

## What's Working Well

### Strengths
1. **Cross-subdomain cookies** - `.databayt.org` domain enables seamless SSO
2. **Smart redirect after login** - Users go directly to their school subdomain
3. **Role hierarchy** - Clear permission levels from USER to DEVELOPER
4. **School isolation** - `schoolId` field ensures data separation
5. **Compound uniqueness** - `@@unique([email, schoolId])` allows same email across schools
6. **OAuth integration** - Google/Facebook with automatic email verification
7. **Session management** - JWT with 24h expiry and refresh
8. **Two-factor auth** - Optional 2FA for enhanced security
9. **Password reset flow** - Secure token-based recovery
10. **Tenant context** - Centralized school context retrieval

### OAuth + Credentials: Best Practice for School Management?

**Yes, this is the right approach.** Here's why:

| Method | Use Case | Benefits |
|--------|----------|----------|
| **OAuth (Google/Facebook)** | Self-registration by students/teachers | No password management, verified email, quick onboarding |
| **Credentials** | Admin-created accounts | Full control, no email required, bulk creation |

**Recommendation**: Offer both and let schools choose their preferred workflow.

## Areas for Improvement

### P0 - Critical Issues

#### 1. Excessive Debug Logging (auth.ts)
**Issue**: 800+ lines of console.log in redirect callback
**Impact**: Performance, security info exposure
**Fix**: Wrap all debug logs in `process.env.NODE_ENV === 'development'`

#### 2. Missing School Link in OAuth Registration
**Issue**: New OAuth users created without `schoolId`
**Flow**: OAuth → User created → Onboarding → School created → User linked
**Risk**: Gap where user exists without school context
**Fix**: Ensure onboarding is mandatory for new users

#### 3. `getUserByEmail` Returns Any User
**Issue**: Returns first user with email, not tenant-specific
**Risk**: Could return wrong user in edge cases
**Fix**: Add optional `schoolId` parameter for tenant-specific lookup

### P1 - High Priority

#### 1. Missing Invitation System
**Current**: Users self-register or admin creates manually
**Needed**: Invitation links with pre-assigned roles
```typescript
// Proposed
interface Invitation {
  code: string;
  schoolId: string;
  role: UserRole;
  email?: string;  // Optional pre-fill
  expiresAt: Date;
}
```

#### 2. No Bulk User Creation
**Current**: One-by-one account creation
**Needed**: CSV import with role assignment
```typescript
// Proposed flow
Admin → Upload CSV → Validate → Create users with schoolId → Send credentials
```

#### 3. Session Refresh Workarounds
**Issue**: Multiple hacks (hash, updatedAt, sessionToken) for session refresh
**Root**: NextAuth doesn't easily refresh on user data change
**Fix**: Implement proper session invalidation strategy

### P2 - Medium Priority

#### 1. Redirect Logic Complexity
**Issue**: 1000+ line redirect callback with multiple fallback methods
**Risk**: Hard to maintain, edge case bugs
**Fix**: Simplify to clear priority chain

#### 2. Orphaned School Access
**Issue**: Any user can claim schools with no users
**Risk**: Security concern
**Fix**: Add explicit ownership claim flow

#### 3. Preview Role System
**Issue**: Cookie-based role preview for development
**Risk**: Could be exploited if cookie is accessible
**Fix**: Restrict to development environment only

### P3 - Nice to Have

1. Account linking (same user, multiple schools)
2. Social login for existing credentials users
3. Magic link authentication
4. WebAuthn/passkey support
5. Session activity logging

## Recommended Enhancements

### 1. Invitation System
```typescript
// New files needed
src/components/auth/invitation/
├── action.ts       # Generate/validate invitations
├── form.tsx        # Invitation acceptance form
└── types.ts        # Invitation types

// Database model
model Invitation {
  id        String   @id @default(cuid())
  code      String   @unique
  schoolId  String
  role      UserRole
  email     String?
  usedAt    DateTime?
  expiresAt DateTime
  createdBy String

  school    School   @relation(fields: [schoolId], references: [id])
}
```

### 2. School Join Code
```typescript
// Allow users to join school with code
model School {
  // ... existing fields
  joinCode     String?   @unique  // e.g., "HOGWARTS-2024"
  joinEnabled  Boolean   @default(true)
  defaultRole  UserRole  @default(STUDENT)
}
```

### 3. Onboarding Entry Points
```
Marketing Page → Get Started → Choose Path:
├── "I'm creating a new school" → Full onboarding (16 steps)
├── "I have a join code" → Join school → Role assignment
└── "I was invited" → Accept invitation → Profile setup
```

## Environment Variables

```bash
# Required
AUTH_SECRET=your_auth_secret
DATABASE_URL=postgresql://...

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Email
RESEND_API_KEY=

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=https://ed.databayt.org  # Production
```

## Usage Examples

### Server-Side Auth Check
```typescript
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Access school context
  const schoolId = session.user.schoolId;

  return <Dashboard schoolId={schoolId} />;
}
```

### Client-Side Hooks
```typescript
"use client";
import { useCurrentUser } from "@/components/auth/use-current-user";
import { useCurrentRole } from "@/components/auth/use-current-role";

export function UserProfile() {
  const user = useCurrentUser();
  const role = useCurrentRole();

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <p>Role: {role}</p>
    </div>
  );
}
```

### Role-Based Access
```typescript
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";

<RoleGate allowedRole={UserRole.ADMIN}>
  <AdminPanel />
</RoleGate>
```

### Multi-Tenant Query
```typescript
import { getTenantContext } from "@/lib/tenant-context";

export async function getStudents() {
  const { schoolId } = await getTenantContext();

  if (!schoolId) throw new Error("No school context");

  return db.student.findMany({
    where: { schoolId }  // Always include schoolId!
  });
}
```

## Deployment Notes

### Vercel Configuration
1. Set `NEXTAUTH_URL` to production URL
2. Configure OAuth callback URLs in provider consoles
3. Ensure Prisma binary targets include `rhel-openssl-3.0.x`

### OAuth Callback URLs
- Google: `https://ed.databayt.org/api/auth/callback/google`
- Facebook: `https://ed.databayt.org/api/auth/callback/facebook`

### Cookie Domain
Production cookies use `.databayt.org` for cross-subdomain SSO.

## Recommended Next Steps

### Immediate (P0)
1. **Remove debug logging from auth.ts** - 800+ lines of console.log causing performance issues

### Short-term (P1)
2. **Implement invitation system with roles** - Schools invite users with pre-assigned roles
3. **Add school join codes** - Simple codes like "HOGWARTS-2024" for easy joining

### Medium-term (P1)
4. **Build bulk user creation via CSV** - Import students/teachers from spreadsheets

See [ISSUE.md](./ISSUE.md) for detailed implementation plans.

## Test Coverage

### Current Status
- **Test Files**: 5
- **Total Tests**: 123 passing
- **Coverage**: Core authentication flows tested

### Test Files

| File | Tests | Description |
|------|-------|-------------|
| `__tests__/validation.test.ts` | 49 | Zod schema validation for all auth forms |
| `__tests__/user.test.ts` | 22 | User utilities (getUserByEmail, getOrCreateOAuthUser) |
| `__tests__/tokens.test.ts` | 16 | Token generation (2FA, password reset, verification) |
| `__tests__/login/action.test.ts` | 24 | Login action with 2FA, smart redirect |
| `__tests__/join/action.test.ts` | 12 | Registration action with multi-tenant safety tests |

### Known Issues Documented in Tests

The test suite includes tests that document known P0 issues:

1. **`getUserByEmail` multi-tenant issue** (`user.test.ts`)
   - Test: `P0 ISSUE: returns user without tenant scoping`
   - Issue: Returns any user with email, not tenant-scoped
   - Required Fix: Add optional schoolId parameter

2. **OAuth user schoolId assignment** (`user.test.ts`)
   - Test: `P0 ISSUE: creates user without schoolId`
   - Issue: New OAuth users have no schoolId
   - Required Fix: Link to school during onboarding

3. **Registration without school context** (`join/action.test.ts`)
   - Test: `P0 ISSUE: creates user without schoolId`
   - Issue: Users created without multi-tenant isolation
   - Required Fix: Require school context during registration

### Running Tests

```bash
# Run all auth tests
pnpm test src/components/auth/__tests__

# Run specific test file
pnpm test src/components/auth/__tests__/validation.test.ts

# Run with watch mode
pnpm test src/components/auth/__tests__ --watch
```

## Related Documentation

- [ISSUE.md](./ISSUE.md) - Issue tracker for auth module
- [Onboarding Docs](/docs/onboarding) - School creation flow
- [Multi-Tenant Architecture](/docs/architecture) - System architecture

---

**Last Updated**: December 2024
**Module Status**: Production Ready (with noted improvements)
