# Hogwarts - Epic & Story Breakdown

**Document Version:** 1.0
**Last Updated:** January 2024
**Total Epics:** 12
**Total Stories:** 150+
**Estimated Timeline:** 12-18 months for MVP

---

## Epic Overview

| Epic # | Epic Name | Goal | Stories | Complexity | Dependencies |
|--------|-----------|------|---------|------------|--------------|
| 1 | Foundation & Infrastructure | Establish core multi-tenant architecture | 15 | High | None |
| 2 | Authentication & Authorization | Complete user management and RBAC | 18 | High | Epic 1 |
| 3 | School Configuration | School setup and academic structure | 12 | Medium | Epic 1, 2 |
| 4 | Student Management | Comprehensive student lifecycle | 20 | Medium | Epic 2, 3 |
| 5 | Teacher & Staff Management | Teacher profiles and workflows | 15 | Medium | Epic 2, 3 |
| 6 | Class & Subject Management | Academic organization | 18 | Medium | Epic 3, 4, 5 |
| 7 | Attendance System | Daily and period-wise tracking | 16 | Medium | Epic 4, 6 |
| 8 | Assessment & Grading | Assignments, grades, reports | 22 | High | Epic 6 |
| 9 | Fee Management | Fee structures and payments | 18 | High | Epic 4 |
| 10 | Communication | Announcements and parent portal | 12 | Medium | Epic 4, 5 |
| 11 | Reporting & Analytics | Dashboards and insights | 14 | Medium | All previous |
| 12 | Polish & Launch | Performance, security, docs | 10 | High | All previous |

**Total Stories:** 190
**Implementation Approach:** Vertical slicing (each story delivers end-to-end value)

---

## Epic 1: Foundation & Infrastructure

**Goal:** Establish robust multi-tenant architecture that serves as the foundation for all features.

**Value Proposition:** Without proper multi-tenancy, we cannot safely serve multiple schools from one platform. This epic creates the infrastructure that ensures complete data isolation and scalability.

**Prerequisites:** None (Foundation epic)

**Acceptance Criteria for Epic Completion:**
- ✅ Multi-tenant database schema with `schoolId` scoping
- ✅ Subdomain routing working (`school.databayt.org`)
- ✅ Basic Next.js 15 + React 19 + Prisma 6 setup
- ✅ Development, staging, production environments configured
- ✅ CI/CD pipeline with automated tests
- ✅ First deployable version to Vercel
- ✅ Multi-tenant isolation verified with automated tests

---

### Story 1.1: Initialize Next.js Project with TypeScript Strict Mode

**As a** developer
**I want** to set up Next.js 15 with App Router and TypeScript strict mode
**So that** we have a modern foundation with type safety from day one

**Acceptance Criteria:**
- [x] Next.js 15.4.4 installed with App Router (not Pages Router)
- [x] TypeScript 5.x configured with strict mode enabled
- [x] ESLint + Prettier configured with project-specific rules
- [x] Turbopack enabled for development and production builds
- [x] Build completes without errors
- [x] Development server starts on `http://localhost:3000`

**Technical Notes:**
- Use `create-next-app@latest` with TypeScript template
- Configure `next.config.ts` with Turbopack optimizations
- `.eslintrc.json` includes Next.js and TypeScript recommended rules
- Prettier config: 2 spaces, single quotes, trailing commas

**Testing:**
- Manual: Run `pnpm dev` → Verify Next.js welcome page loads
- Build: Run `pnpm build` → Verify production build succeeds

**Vertical Slice:** Basic deployable Next.js app (even if just welcome page)

---

### Story 1.2: Configure Prisma with PostgreSQL (Neon)

**As a** developer
**I want** Prisma ORM connected to PostgreSQL
**So that** we can define multi-tenant schema with type-safe queries

**Acceptance Criteria:**
- [x] Prisma 6.14.0 installed
- [x] `DATABASE_URL` environment variable configured for Neon serverless PostgreSQL
- [x] Prisma client generated successfully
- [x] Database connection pooling configured (max 100 connections)
- [x] Prisma Studio accessible via `pnpm prisma studio`
- [x] Basic test query executes successfully

**Technical Notes:**
- Use Neon serverless PostgreSQL for development and production
- Connection string format: `postgresql://user:password@host/database?sslmode=require`
- Enable connection pooling in Neon dashboard
- Prisma schema location: `prisma/schema.prisma`

**Testing:**
- Run `pnpm prisma studio` → Verify Prisma Studio opens
- Run `pnpm prisma db push` → Verify schema syncs to database
- Execute test query: `await prisma.$queryRaw\`SELECT 1\`` → Returns 1

**Vertical Slice:** Database connection working, can query database

---

### Story 1.3: Create Multi-Tenant Base Schema

**As a** developer
**I want** base Prisma models with `schoolId` scoping
**So that** all data is isolated by tenant from the start

**Acceptance Criteria:**
- [x] `School` model created with: id, name, domain, logoUrl, address, email, timezone
- [x] `User` model created with: id, email, password, role, schoolId (nullable for DEVELOPER role)
- [x] `@@unique([email, schoolId])` constraint on User (allow same email across schools)
- [x] Prisma migration created: `pnpm prisma migrate dev --name init-multi-tenant`
- [x] Migration applies successfully to database
- [x] Test: Create School, create User with schoolId, verify constraint works

**Technical Notes:**
- School `domain` field is subdomain (e.g., "hogwarts" for `hogwarts.databayt.org`)
- User `schoolId` is nullable only for DEVELOPER role (platform admins)
- Enums: `UserRole` with DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF, USER

**Testing:**
- Create school: `await prisma.school.create({ data: { name: "Test School", domain: "test" } })`
- Create user: `await prisma.user.create({ data: { email: "admin@test.com", schoolId: school.id, role: "ADMIN" } })`
- Test uniqueness: Attempt duplicate email in same school → Error
- Test uniqueness: Same email in different school → Success

**Vertical Slice:** Can create schools and users, tenant isolation enforced at database level

---

### Story 1.4: Implement Subdomain Routing Middleware

**As a** user
**I want** to access my school via subdomain (school.databayt.org)
**So that** I land in my school's context automatically

**Acceptance Criteria:**
- [x] Middleware intercepts all requests
- [x] Extracts subdomain from hostname
- [x] Rewrites URL to `/[lang]/s/[subdomain]/...` route
- [x] Production pattern: `school.databayt.org` → `/en/s/school/...`
- [x] Vercel preview pattern: `tenant---branch.vercel.app` → `/en/s/tenant/...`
- [x] Development pattern: `school.localhost:3000` → `/en/s/school/...`
- [x] Non-subdomain requests (www, apex) → Redirect to marketing site
- [x] Subdomain stored in headers for downstream access

**Technical Notes:**
- Middleware file: `src/middleware.ts`
- Use `NextRequest.nextUrl.hostname` to extract subdomain
- Rewrite (not redirect) to maintain URL in browser
- Locale detection: Cookie → Accept-Language header → default (en)

**Testing:**
- Access `test.localhost:3000` → Should rewrite to `/en/s/test/`
- Access `localhost:3000` → Should redirect to `www.databayt.org`
- Deploy to Vercel preview → `tenant---branch.vercel.app` works

**Vertical Slice:** Subdomain routing functional, can serve different schools

---

### Story 1.5: Create Tenant Context Helper

**As a** developer
**I want** a helper function to get current school context from request
**So that** all features can easily scope queries by `schoolId`

**Acceptance Criteria:**
- [x] `getTenantContext()` function created in `src/lib/tenant-context.ts`
- [x] Function reads subdomain from headers (set by middleware)
- [x] Looks up School by domain in database
- [x] Returns `{ schoolId, school }` or throws error if school not found
- [x] Error message: "School not found for domain: {domain}"
- [x] Function works in both Server Components and Server Actions

**Technical Notes:**
```typescript
import { headers } from 'next/headers'
import { db } from '@/lib/db'

export async function getTenantContext() {
  const headersList = headers()
  const subdomain = headersList.get('x-subdomain') // Set by middleware

  if (!subdomain) {
    throw new Error('Subdomain not found in request')
  }

  const school = await db.school.findUnique({
    where: { domain: subdomain }
  })

  if (!school) {
    throw new Error(`School not found for domain: ${subdomain}`)
  }

  return { schoolId: school.id, school }
}
```

**Testing:**
- Call from Server Component → Returns correct school
- Call with invalid subdomain → Throws error
- Call from Server Action → Returns correct school

**Vertical Slice:** All features can now get tenant context easily

---

### Story 1.6: Configure Environment Variables with Type Safety

**As a** developer
**I want** type-safe environment variables
**So that** configuration errors are caught at build time

**Acceptance Criteria:**
- [x] `@t3-oss/env-nextjs` package installed
- [x] `src/env.mjs` created with schema for all environment variables
- [x] Variables validated: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, etc.
- [x] Build fails if required variables missing
- [x] TypeScript autocomplete works for `env.DATABASE_URL`

**Technical Notes:**
```typescript
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
    NEXTAUTH_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
})
```

**Testing:**
- Build without DATABASE_URL → Build fails with clear error
- Import `env.DATABASE_URL` → TypeScript provides autocomplete

**Vertical Slice:** Environment variables type-safe and validated

---

### Story 1.7: Set Up CI/CD Pipeline with GitHub Actions

**As a** developer
**I want** automated testing and deployment on every push
**So that** code quality is maintained and deployments are safe

**Acceptance Criteria:**
- [x] `.github/workflows/ci.yml` created
- [x] On push to any branch: Run `pnpm lint`, `pnpm tsc`, `pnpm test`
- [x] On push to `main`: Deploy to Vercel production
- [x] On push to feature branches: Deploy to Vercel preview
- [x] Build status badge in README.md
- [x] Failed builds prevent PR merge

**Technical Notes:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm tsc
      - run: pnpm test
```

**Testing:**
- Push to branch → CI runs automatically
- Introduce linting error → CI fails
- Fix error → CI passes

**Vertical Slice:** Automated CI/CD pipeline operational

---

### Story 1.8: Create Database Singleton with Global Caching

**As a** developer
**I want** a single Prisma client instance shared across hot reloads
**So that** development doesn't hit connection limits

**Acceptance Criteria:**
- [x] `src/lib/db.ts` created with global-cached Prisma client
- [x] In development: Prisma client cached in `globalThis`
- [x] In production: New client per serverless function (no caching)
- [x] Connection pooling configured in Prisma
- [x] No "Too many clients" errors during development

**Technical Notes:**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Testing:**
- Hot reload in development multiple times → No connection errors
- Query database: `await db.school.findMany()` → Returns schools

**Vertical Slice:** Database client working reliably in all environments

---

### Story 1.9: Configure Tailwind CSS 4 with Theme System

**As a** developer
**I want** Tailwind CSS 4 configured with design tokens
**So that** UI is consistent and theme-aware

**Acceptance Criteria:**
- [x] Tailwind CSS 4.0 installed
- [x] `tailwind.config.ts` configured with theme colors, fonts
- [x] CSS variables in `src/styles/globals.css` for light/dark themes
- [x] Typography styles in `src/styles/typography.css`
- [x] Test: Create component with Tailwind classes → Styles apply

**Technical Notes:**
- Theme colors: Primary (blue), Secondary (amber), Success (green), Warning (orange), Error (red)
- Fonts: Tajawal (Arabic), Inter (English)
- Typography: Use semantic HTML, no hardcoded text/font classes

**Testing:**
- Create `<h1>` tag → Styles from typography.css apply
- Use `className="bg-primary"` → Blue background appears

**Vertical Slice:** Styling system operational, ready for UI components

---

### Story 1.10: Set Up shadcn/ui Component Library

**As a** developer
**I want** shadcn/ui components installed
**So that** we can build UI with accessible primitives

**Acceptance Criteria:**
- [x] shadcn/ui CLI initialized with New York style
- [x] Radix UI primitives installed
- [x] Core components added: Button, Input, Card, Dialog, Table
- [x] `src/components/ui/` directory contains components
- [x] `components.json` configured correctly
- [x] Test: Render Button component → Displays correctly

**Technical Notes:**
```bash
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button input card dialog table
```

**Testing:**
- Import `import { Button } from '@/components/ui/button'`
- Render `<Button>Click me</Button>` → Button appears with correct styles

**Vertical Slice:** UI component library ready for use

---

### Story 1.11: Implement Multi-Tenant Isolation Tests

**As a** developer
**I want** automated tests that verify tenant isolation
**So that** we prevent cross-school data leaks

**Acceptance Criteria:**
- [x] Vitest configured with React Testing Library
- [x] Test: Create 2 schools with same email users → Both succeed
- [x] Test: Query users without schoolId filter → Error or zero results
- [x] Test: Query users with schoolId → Only that school's users returned
- [x] Test: User from School A cannot access School B data
- [x] All tests pass in CI pipeline

**Technical Notes:**
```typescript
import { describe, it, expect } from 'vitest'
import { db } from '@/lib/db'

describe('Multi-Tenant Isolation', () => {
  it('allows same email across different schools', async () => {
    const school1 = await db.school.create({ data: { name: 'School 1', domain: 'school1' } })
    const school2 = await db.school.create({ data: { name: 'School 2', domain: 'school2' } })

    const user1 = await db.user.create({ data: { email: 'admin@test.com', schoolId: school1.id, role: 'ADMIN' } })
    const user2 = await db.user.create({ data: { email: 'admin@test.com', schoolId: school2.id, role: 'ADMIN' } })

    expect(user1.id).not.toBe(user2.id)
  })
})
```

**Testing:**
- Run `pnpm test` → All tenant isolation tests pass

**Vertical Slice:** Tenant isolation verified automatically

---

### Story 1.12: Create Landing Page with School Selector

**As a** visitor
**I want** to see a landing page where I can enter my school
**So that** I can navigate to my school's subdomain

**Acceptance Criteria:**
- [x] Landing page at `www.databayt.org` or `localhost:3000`
- [x] Search box: "Enter your school name or code"
- [x] Autocomplete: Suggests schools as user types
- [x] Select school → Redirect to `{school.domain}.databayt.org`
- [x] Display school logo if available

**Technical Notes:**
- API endpoint: `/api/schools/search?q={query}` → Returns matching schools
- Redirect using `window.location.href = 'https://{school.domain}.databayt.org'`

**Testing:**
- Type "Hogwarts" → School appears in dropdown
- Click school → Redirects to `hogwarts.databayt.org`

**Vertical Slice:** Users can find and navigate to their school

---

### Story 1.13: Create 404 and Error Pages

**As a** user
**I want** friendly error pages when something goes wrong
**So that** I understand what happened and what to do next

**Acceptance Criteria:**
- [x] `src/app/not-found.tsx` → 404 page with "Page not found"
- [x] `src/app/error.tsx` → Generic error page with "Something went wrong"
- [x] `src/app/global-error.tsx` → Fallback for severe errors
- [x] Error pages include: Error message, back button, home button
- [x] Error pages styled with Tailwind + school branding (if available)

**Testing:**
- Navigate to `/nonexistent` → 404 page appears
- Trigger error in component → Error page appears with message

**Vertical Slice:** Error handling graceful

---

### Story 1.14: Configure Monitoring with Sentry

**As a** developer
**I want** error tracking and performance monitoring
**So that** we can debug production issues quickly

**Acceptance Criteria:**
- [x] Sentry SDK installed: `@sentry/nextjs`
- [x] `sentry.client.config.ts` and `sentry.server.config.ts` configured
- [x] Source maps uploaded to Sentry for production builds
- [x] Test error triggers Sentry alert
- [x] Performance tracing enabled (track API response times)

**Technical Notes:**
- Sentry DSN from environment variable
- Sample rate: 100% in production (all errors), 10% for performance

**Testing:**
- Trigger error: `throw new Error('Test Sentry')` → Error appears in Sentry dashboard
- View performance traces in Sentry

**Vertical Slice:** Error tracking operational

---

### Story 1.15: Document Multi-Tenant Architecture

**As a** developer joining the project
**I want** architecture documentation
**So that** I understand how multi-tenancy works

**Acceptance Criteria:**
- [x] `docs/architecture/multi-tenant.md` created
- [x] Explains: Subdomain routing, database scoping, tenant context
- [x] Diagrams: Request flow from subdomain to database query
- [x] Code examples: How to scope queries by schoolId
- [x] Testing guide: How to test tenant isolation

**Technical Notes:**
- Include Mermaid diagrams for visual explanation
- Link to relevant code files

**Testing:**
- New developer reads docs → Can explain multi-tenancy in their own words

**Vertical Slice:** Architecture documented for team knowledge

---

## Epic 2: Authentication & Authorization

**Goal:** Implement secure authentication with NextAuth v5 and role-based access control.

**Value Proposition:** Users can safely log in, register, and access features appropriate to their role. Multi-tenant auth ensures users only see data from their school.

**Prerequisites:** Epic 1 complete

**Acceptance Criteria for Epic Completion:**
- ✅ Users can register with email/password or OAuth (Google, Facebook)
- ✅ Users can log in and out
- ✅ 8 user roles implemented with distinct permissions
- ✅ Role-based menu display
- ✅ Password reset flow working
- ✅ Two-factor authentication functional
- ✅ Session management secure (JWT, httpOnly cookies)
- ✅ Audit logs track all authentication events

---

### Story 2.1: Install and Configure NextAuth v5

**As a** developer
**I want** NextAuth v5 configured with JWT strategy
**So that** we have a solid foundation for authentication

**Acceptance Criteria:**
- [x] NextAuth v5 (Auth.js 5.0.0-beta.29) installed
- [x] `src/auth.ts` and `src/auth.config.ts` created
- [x] JWT strategy configured (not database sessions)
- [x] Session includes: userId, schoolId, role, email
- [x] Session callback extends JWT with custom fields
- [x] `/api/auth/[...nextauth]/route.ts` exports handlers

**Technical Notes:**
```typescript
// src/auth.ts
import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)
```

**Testing:**
- Access `/api/auth/signin` → NextAuth sign-in page appears

**Vertical Slice:** NextAuth framework ready

---

### Story 2.2: Implement Email/Password Registration

**As a** visitor
**I want** to register with email and password
**So that** I can create an account and access my school

**Acceptance Criteria:**
- [x] Registration page at `/{lang}/auth/register`
- [x] Form fields: Email, password, confirm password
- [x] Password validation: 12+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- [x] On submit: Hash password (bcrypt cost 12), create user in database
- [x] Send verification email with magic link
- [x] User redirected to "Check your email" page
- [x] schoolId captured from subdomain context

**Technical Notes:**
- Server Action: `registerUser(data: FormData)`
- Use `getTenantContext()` to get schoolId
- Validation: Zod schema in `validation.ts`
- Email: Use Resend with React Email template

**Testing:**
- Register with valid data → User created, email sent
- Register with weak password → Error: "Password must meet requirements"
- Register with existing email in same school → Error: "Email already registered"
- Register with existing email in different school → Success (new account)

**Vertical Slice:** Users can register for their school

---

### Story 2.3: Implement Email/Password Login

**As a** registered user
**I want** to log in with my email and password
**So that** I can access my school's dashboard

**Acceptance Criteria:**
- [x] Login page at `/{lang}/auth/login`
- [x] Form fields: Email, password
- [x] On submit: Verify credentials against database
- [x] On success: Create JWT session, set httpOnly cookie, redirect to dashboard
- [x] On failure: Display "Invalid email or password"
- [x] Rate limiting: Max 5 attempts per 15 minutes per IP
- [x] schoolId from subdomain matches user's schoolId

**Technical Notes:**
- Credentials provider in NextAuth config
- Compare password with bcrypt
- Session cookie: httpOnly, secure, sameSite: lax, domain: `.databayt.org`

**Testing:**
- Login with correct credentials → Redirect to dashboard
- Login with wrong password → Error message
- Login 6 times with wrong password → Account locked 30 minutes
- Login from different school subdomain → Error: "User not found"

**Vertical Slice:** Users can log in to their school

---

(Continuing with Stories 2.4 - 2.18 covering OAuth, 2FA, password reset, session management, role-based access, etc.)

---

### Story 2.4: Implement OAuth Login (Google)

**As a** visitor
**I want** to log in with my Google account
**So that** I don't need to create a password

**Acceptance Criteria:**
- [x] Google OAuth provider configured in NextAuth
- [x] "Sign in with Google" button on login page
- [x] On click: Redirect to Google consent screen
- [x] After consent: Create or update user in database with Google account data
- [x] First-time users: Link account to current school (from subdomain)
- [x] Existing users: Verify schoolId matches subdomain
- [x] Profile photo from Google saved to user record

**Technical Notes:**
- Google Client ID and Secret from environment variables
- OAuth redirect URI: `https://ed.databayt.org/api/auth/callback/google`
- Store OAuth account in `Account` table (NextAuth schema)

**Testing:**
- Click "Sign in with Google" → Google consent screen appears
- Grant consent → Redirect to dashboard as logged-in user
- Second login → Existing account recognized, no duplicate created

**Vertical Slice:** Users can register/login via Google OAuth

---

### Story 2.5: Implement OAuth Login (Facebook)

**As a** visitor
**I want** to log in with my Facebook account
**So that** I have another convenient login option

**Acceptance Criteria:**
- [x] Facebook OAuth provider configured in NextAuth
- [x] "Sign in with Facebook" button on login page
- [x] Similar flow to Google OAuth
- [x] Profile photo from Facebook saved to user record

**Technical Notes:**
- Similar to Story 2.4 but for Facebook provider
- Facebook App ID and Secret from environment variables

**Testing:**
- Click "Sign in with Facebook" → Facebook consent screen appears
- Complete flow → User logged in

**Vertical Slice:** Users can register/login via Facebook OAuth

---

(Stories 2.6 - 2.18 continue with: Password reset flow, Two-factor authentication, Session management, Role-based access, Audit logging, Account settings, Email verification, Profile management, Security settings, Session timeout, Remember me, Account deletion, Terms acceptance)

---

## Epic 3: School Configuration

**Goal:** Allow school administrators to configure their school profile and academic structure.

**Value Proposition:** Schools can set up their unique academic calendar, departments, year levels, and organizational structure without developer intervention.

**Prerequisites:** Epic 1 (Foundation), Epic 2 (Authentication)

**Acceptance Criteria for Epic Completion:**
- ✅ School profile management (name, logo, contact info)
- ✅ Academic year setup with terms and periods
- ✅ Department creation and management
- ✅ Year levels/grades configuration
- ✅ School-wide settings (timezone, language, calendar)
- ✅ Branding customization (logo, colors, theme)

---

### Story 3.1: Create School Profile Management Page

**As a** school admin
**I want** to manage my school's profile
**So that** accurate information is displayed throughout the platform

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/school-profile`
- [x] Form fields: School name, address, email, phone, website, timezone
- [x] Upload school logo (max 5MB, PNG/JPG/SVG)
- [x] On save: Update School table, show success toast
- [x] Validation: Required fields enforced, email format validated
- [x] schoolId scoping: Can only edit own school

**Technical Notes:**
- Server Action: `updateSchoolProfile(data: FormData)`
- File upload: Store to Vercel Blob Storage, save URL to database
- Zod validation schema in `validation.ts`

**Testing:**
- Update school name → Reflected across all pages
- Upload logo → Logo appears in navbar and profile
- Try to edit different school → 403 Forbidden

**Vertical Slice:** School admins can manage school profile

---

### Story 3.2: Create Academic Year Management

**As a** school admin
**I want** to create and manage academic years
**So that** all activities are scoped to the correct time period

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/academic-years`
- [x] List view: Display all academic years (current highlighted)
- [x] Create form: Year name, start date, end date, status (active/inactive)
- [x] Business rule: Only one academic year can be active at a time
- [x] On create: New academic year added, redirect to terms setup
- [x] schoolId scoping: Each school has own academic years

**Technical Notes:**
- Model: `SchoolYear { id, schoolId, name, startDate, endDate, isActive }`
- Server Action: `createAcademicYear(data: FormData)`
- Validation: End date must be after start date

**Testing:**
- Create academic year "2024-2025" → Appears in list
- Activate new year → Previous year set to inactive
- Create overlapping years → Allowed (for future planning)

**Vertical Slice:** School can define academic calendar structure

---

### Story 3.3: Create Term Management Within Academic Year

**As a** school admin
**I want** to divide academic year into terms/semesters
**So that** I can organize curriculum and assessments

**Acceptance Criteria:**
- [x] Within academic year detail page: Section for terms
- [x] Create term: Name (e.g., "Fall Semester"), start date, end date
- [x] Term dates must fall within academic year boundaries
- [x] List view: Display all terms for academic year
- [x] Edit and delete terms (with warnings if used in classes)

**Technical Notes:**
- Model: `Term { id, schoolYearId, name, startDate, endDate }`
- Validation: Terms cannot overlap within same academic year
- Foreign key: `schoolYearId` → `SchoolYear.id`

**Testing:**
- Create "Fall Semester" (Sep 1 - Dec 31) → Success
- Create "Spring Semester" (Jan 1 - May 31) → Success
- Try to create term outside academic year → Error

**Vertical Slice:** Academic year divided into manageable terms

---

### Story 3.4: Create Department Management

**As a** school admin
**I want** to create academic and administrative departments
**So that** I can organize teachers and subjects by department

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/departments`
- [x] List view: Display all departments
- [x] Create form: Department name, description, head of department (optional)
- [x] Examples: Mathematics, Science, Languages, Administration
- [x] Assign department head (select from teachers)
- [x] schoolId scoping: Each school has own departments

**Technical Notes:**
- Model: `Department { id, schoolId, name, description, headTeacherId }`
- Server Action: `createDepartment(data: FormData)`
- Relation: Department can have many teachers via `TeacherDepartment` join table

**Testing:**
- Create "Mathematics Department" → Appears in list
- Assign teacher as head → Teacher's role updated
- Delete department with teachers → Warning: "Unassign teachers first"

**Vertical Slice:** School organized into departments

---

### Story 3.5: Create Year Level/Grade Configuration

**As a** school admin
**I want** to define year levels (grades)
**So that** I can assign students to appropriate levels

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/year-levels`
- [x] List view: Display all year levels (e.g., Grade 1-12, KG1-KG3)
- [x] Create form: Level name, order (for sorting), capacity (optional)
- [x] Drag-and-drop reordering
- [x] schoolId scoping: Each school defines own levels

**Technical Notes:**
- Model: `YearLevel { id, schoolId, name, order, capacity }`
- Server Action: `createYearLevel(data: FormData)`, `reorderYearLevels(levelIds: string[])`
- UI: Use dnd-kit for drag-and-drop

**Testing:**
- Create "Grade 1", "Grade 2", "Grade 3" → Appear in order
- Drag "Grade 3" above "Grade 2" → Order updated
- Assign students to year level → Capacity tracking works

**Vertical Slice:** School has defined grade structure

---

### Story 3.6: Create Period/Class Schedule Configuration

**As a** school admin
**I want** to define class periods
**So that** I can create timetables

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/periods`
- [x] List view: Display all periods (e.g., Period 1: 8:00-9:00 AM)
- [x] Create form: Period number, start time, end time
- [x] Validation: Periods cannot overlap
- [x] Default periods: Generate 6-8 periods automatically on first setup
- [x] schoolId scoping: Each school defines own periods

**Technical Notes:**
- Model: `Period { id, schoolId, periodNumber, startTime, endTime }`
- Server Action: `createPeriod(data: FormData)`, `generateDefaultPeriods()`
- Time format: Store as TIME type in PostgreSQL

**Testing:**
- Create Period 1 (8:00 AM - 9:00 AM) → Success
- Create overlapping period → Error: "Period times overlap"
- Generate default periods → 8 periods created (8 AM - 4 PM)

**Vertical Slice:** Class schedule structure defined

---

### Story 3.7: Create School Branding Customization

**As a** school admin
**I want** to customize my school's branding
**So that** the platform looks like our school

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/branding`
- [x] Upload school logo (navbar, favicon)
- [x] Color customization: Primary color, secondary color, accent color
- [x] Preview changes in real-time
- [x] Apply theme across all pages
- [x] Reset to default theme button

**Technical Notes:**
- Model: `SchoolBranding { id, schoolId, logoUrl, primaryColor, secondaryColor }`
- CSS variables: Update root CSS variables with school colors
- File upload: Store to Vercel Blob, save URL

**Testing:**
- Upload logo → Logo appears in navbar
- Change primary color to red → Buttons/links turn red
- Reset theme → Default Hogwarts theme restored

**Vertical Slice:** School has custom branding

---

### Story 3.8: Create School Settings Page

**As a** school admin
**I want** to configure school-wide settings
**So that** the platform behaves according to our preferences

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings`
- [x] Settings sections: General, Academic, Communication, Security
- [x] General: Timezone, default language, date format
- [x] Academic: Attendance grace period, late policy, grading scale
- [x] Communication: Email notifications, SMS alerts, parent access
- [x] Security: Two-factor authentication required, password policy
- [x] Save button: Update settings, show success toast

**Technical Notes:**
- Model: `SchoolSettings { id, schoolId, timezone, language, dateFormat, ... }`
- Server Action: `updateSchoolSettings(data: FormData)`
- One-to-one relation: School → SchoolSettings

**Testing:**
- Change timezone to "America/New_York" → Times displayed in EST
- Enable 2FA requirement → All users prompted for 2FA
- Disable parent access → Parent portal login disabled

**Vertical Slice:** School configured according to preferences

---

### Story 3.9: Create Academic Calendar View

**As a** school admin
**I want** to view all important dates in a calendar
**So that** I can plan events and holidays

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/calendar`
- [x] Calendar view: Month grid with color-coded events
- [x] Event types: Holidays, exams, parent-teacher meetings, school events
- [x] Click date: Create new event
- [x] Click event: View details, edit, delete
- [x] Export calendar to iCal format

**Technical Notes:**
- Use Recharts or React Big Calendar for calendar UI
- Model: `SchoolEvent { id, schoolId, title, startDate, endDate, type }`
- Server Action: `createEvent(data: FormData)`, `exportCalendar()`

**Testing:**
- Add "Winter Break" (Dec 20 - Jan 5) → Appears on calendar
- Click event → Details modal opens
- Export calendar → ICS file downloaded

**Vertical Slice:** School calendar visible and manageable

---

### Story 3.10: Create Holiday Management

**As a** school admin
**I want** to define school holidays
**So that** attendance is not required on these days

**Acceptance Criteria:**
- [x] Within calendar or settings: Holiday management section
- [x] Create holiday: Name, date, recurring (yes/no)
- [x] Recurring holidays: Automatically apply to all years
- [x] Import default holidays: Country-specific (e.g., US, Saudi Arabia)
- [x] On holiday: Attendance marking disabled
- [x] List view: Display all holidays for academic year

**Technical Notes:**
- Model: `Holiday { id, schoolId, name, date, isRecurring }`
- Server Action: `createHoliday(data: FormData)`, `importNationalHolidays(country: string)`
- Attendance check: Skip holidays when calculating attendance percentage

**Testing:**
- Create "Christmas Day" (Dec 25, recurring) → Applied to all years
- Import Saudi holidays → 10+ holidays added
- Mark attendance on holiday → Warning: "Today is a holiday"

**Vertical Slice:** Holidays integrated into academic calendar

---

### Story 3.11: Create Classroom/Room Management

**As a** school admin
**I want** to manage physical classrooms
**So that** I can assign classes to rooms

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/settings/classrooms`
- [x] List view: Display all classrooms with capacity and type
- [x] Create form: Room number/name, capacity, type (lecture hall, lab, gym)
- [x] Room availability: Mark rooms as unavailable for specific periods
- [x] Assign rooms to classes (in timetable)
- [x] schoolId scoping: Each school manages own classrooms

**Technical Notes:**
- Model: `Classroom { id, schoolId, name, capacity, type }`
- Model: `ClassroomType` enum: LECTURE_HALL, LAB, GYM, LIBRARY, etc.
- Relation: Class → Classroom (assigned room)

**Testing:**
- Create "Room 101" (capacity 30, lecture hall) → Appears in list
- Assign room to "Math Grade 10" class → Room displayed in timetable
- Mark room unavailable → Not shown in room selector

**Vertical Slice:** Physical spaces managed and assignable

---

### Story 3.12: Create School Onboarding Wizard

**As a** new school admin
**I want** a guided setup wizard
**So that** I can configure my school quickly

**Acceptance Criteria:**
- [x] Wizard appears on first login for new schools
- [x] Step 1: School profile (name, logo, contact)
- [x] Step 2: Academic year and terms
- [x] Step 3: Departments
- [x] Step 4: Year levels/grades
- [x] Step 5: Class periods
- [x] Completion: Redirect to dashboard with success message
- [x] Skip option: Can complete later

**Technical Notes:**
- Track completion: `School.setupCompleted` boolean field
- Wizard component: Multi-step form with progress indicator
- Server Action: `completeSchoolSetup(data: FormData)`

**Testing:**
- First login → Wizard appears
- Complete all steps → School fully configured
- Skip wizard → Reminder banner on dashboard

**Vertical Slice:** New schools can be set up in under 10 minutes

---

## Epic 4: Student Management

**Goal:** Comprehensive student lifecycle management from enrollment to graduation.

**Value Proposition:** Schools can efficiently manage student information, documents, health records, and guardians all in one place.

**Prerequisites:** Epic 2 (Authentication), Epic 3 (School Configuration)

**Acceptance Criteria for Epic Completion:**
- ✅ Student enrollment process
- ✅ Student profiles with demographics
- ✅ Guardian/parent management
- ✅ Document uploads and management
- ✅ Health and medical records
- ✅ Student achievements and awards
- ✅ Transfer and withdrawal process

---

### Story 4.1: Create Student Enrollment Form

**As a** school admin/staff
**I want** to enroll new students
**So that** they can access the platform and attend classes

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/students/new`
- [x] Form sections: Personal info, demographics, contact, emergency
- [x] Personal: First name, last name, date of birth, gender, photo
- [x] Demographics: Nationality, religion (optional), blood type
- [x] Contact: Email, phone, address
- [x] Emergency: Emergency contact name, relationship, phone
- [x] Assign to year level during enrollment
- [x] Generate unique student ID automatically
- [x] On save: Create student, send welcome email, redirect to student profile
- [x] schoolId scoping: Student belongs to current school

**Technical Notes:**
- Model: `Student { id, schoolId, firstName, lastName, dateOfBirth, gender, email, phone, ... }`
- Server Action: `enrollStudent(data: FormData)`
- Zod validation: Comprehensive validation schema
- Student ID format: `{year}{school_code}{sequential_number}` (e.g., 2024HW0001)

**Testing:**
- Enroll student with complete info → Student created
- Enroll without required fields → Validation errors shown
- Email format invalid → Error: "Invalid email"
- Student appears in students list immediately

**Vertical Slice:** New students can be enrolled

---

### Story 4.2: Create Student Profile Page

**As a** teacher/admin
**I want** to view comprehensive student profile
**So that** I have all student information in one place

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/students/{studentId}`
- [x] Profile sections: Overview, Attendance, Grades, Fees, Documents
- [x] Overview: Photo, name, student ID, year level, contact info
- [x] Quick stats: Attendance rate, average grade, fees balance
- [x] Timeline: Recent activities (attendance, grades, payments)
- [x] Edit button: Opens edit form
- [x] Print profile: PDF export
- [x] schoolId scoping: Can only view own school's students

**Technical Notes:**
- Fetch student with related data: `include: { yearLevel, classes, attendance, grades }`
- Attendance rate calculation: `(presentDays / totalDays) * 100`
- Average grade: Aggregate all grades across subjects

**Testing:**
- View student profile → All sections display correctly
- Click Edit → Edit form opens
- Print profile → PDF downloads

**Vertical Slice:** Complete student information accessible

---

### Story 4.3: Create Student List with Search and Filters

**As a** teacher/admin
**I want** to view all students with search and filters
**So that** I can quickly find specific students

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/students`
- [x] Table columns: Photo, name, student ID, year level, status, actions
- [x] Search: By name, student ID, email
- [x] Filters: Year level, status (active/inactive), gender
- [x] Sort: By name, student ID, enrollment date
- [x] Pagination: 50 students per page
- [x] Bulk actions: Export CSV, send email
- [x] Click row: Navigate to student profile

**Technical Notes:**
- Use @tanstack/react-table for data table
- Server-side search and filtering
- Export CSV: Generate file with student data

**Testing:**
- Search "John" → Only students named John appear
- Filter by "Grade 10" → Only Grade 10 students shown
- Export CSV → File contains all filtered students

**Vertical Slice:** Students easily searchable and manageable

---

### Story 4.4: Create Guardian/Parent Management

**As a** school admin/staff
**I want** to associate parents/guardians with students
**So that** parents can access their children's information

**Acceptance Criteria:**
- [x] Within student profile: Guardians section
- [x] Add guardian: First name, last name, relationship, email, phone
- [x] Guardian types: Father, Mother, Guardian, Emergency Contact
- [x] One guardian can have multiple students (siblings)
- [x] Send guardian invite: Email with login link
- [x] Guardian portal access: Can view linked students only
- [x] schoolId scoping: Guardian association within school

**Technical Notes:**
- Model: `Guardian { id, schoolId, firstName, lastName, email, phone }`
- Join table: `StudentGuardian { studentId, guardianId, relationship, isPrimary }`
- Server Action: `addGuardian(studentId, data: FormData)`, `sendGuardianInvite(guardianId)`

**Testing:**
- Add parent to student → Guardian appears in student profile
- Parent logs in → Can see their children only
- Add same guardian to sibling → Guardian sees both children

**Vertical Slice:** Parents can be associated and invited

---

### Story 4.5: Create Student Document Management

**As a** school admin/staff
**I want** to upload and manage student documents
**So that** all records are digitized and accessible

**Acceptance Criteria:**
- [x] Within student profile: Documents section
- [x] Document types: Birth certificate, ID card, transcripts, medical records
- [x] Upload form: Document type, file (PDF/image), expiry date (optional)
- [x] File size limit: 10MB per document
- [x] List view: Display all documents with download button
- [x] Download: Original file
- [x] Delete: With confirmation
- [x] schoolId scoping: Documents belong to student in school

**Technical Notes:**
- Model: `StudentDocument { id, studentId, type, fileUrl, expiryDate }`
- File storage: Vercel Blob or S3
- Server Action: `uploadDocument(studentId, data: FormData)`

**Testing:**
- Upload birth certificate → Document saved and downloadable
- Upload 15MB file → Error: "File too large"
- Download document → Original file downloads
- Delete document → File removed from storage

**Vertical Slice:** Student documents digitally managed

---

(Continuing with Stories 4.6-4.20 covering: Student photo management, Health/medical records, Allergies and medications, Emergency contacts, Student achievements/awards, Behavioral records, Attendance summary, Grade summary, Fee payment history, Transfer process, Withdrawal process, Student ID card generation, Student reports, Student search history, Bulk import from CSV)

---

## Epic 5: Teacher & Staff Management

**Goal:** Manage teacher profiles, qualifications, department assignments, and workload.

**Value Proposition:** Teachers have complete profiles showcasing qualifications, and admins can efficiently assign classes and track workload.

**Prerequisites:** Epic 2 (Authentication), Epic 3 (School Configuration)

**Acceptance Criteria for Epic Completion:**
- ✅ Teacher profile creation and management
- ✅ Qualification and certification tracking
- ✅ Department assignments
- ✅ Class/subject assignments
- ✅ Teaching schedule and workload
- ✅ Teacher performance tracking

---

### Story 5.1: Create Teacher Profile Creation

**As a** school admin
**I want** to create teacher profiles
**So that** teachers can access the platform and teach classes

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/teachers/new`
- [x] Form sections: Personal info, professional info, qualifications
- [x] Personal: First name, last name, email, phone, photo, date of birth
- [x] Professional: Employee ID, hire date, employment type (full-time/part-time)
- [x] Qualifications: Degree, major, university, graduation year
- [x] Assign to departments
- [x] On save: Create teacher, send welcome email, create user account
- [x] schoolId scoping: Teacher belongs to current school

**Technical Notes:**
- Model: `Teacher { id, schoolId, userId, employeeId, hireDate, employmentType, ... }`
- Server Action: `createTeacher(data: FormData)`
- Auto-create User account with role=TEACHER

**Testing:**
- Create teacher profile → Teacher created, welcome email sent
- Teacher logs in → Can access teacher dashboard
- Assign to Math department → Teacher appears in department list

**Vertical Slice:** Teachers can be onboarded

---

### Story 5.2: Create Teacher Profile Page

**As a** admin/teacher
**I want** to view comprehensive teacher profile
**So that** I can see qualifications and assigned classes

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/teachers/{teacherId}`
- [x] Profile sections: Overview, Classes, Schedule, Performance
- [x] Overview: Photo, name, employee ID, departments, qualifications
- [x] Classes: List of assigned classes with student count
- [x] Schedule: Weekly timetable
- [x] Performance: Student feedback, attendance record
- [x] Edit button: Opens edit form
- [x] schoolId scoping: Can only view own school's teachers

**Technical Notes:**
- Fetch teacher with related data: `include: { user, departments, classes, schedule }`
- Schedule generation: Group periods by day

**Testing:**
- View teacher profile → All sections display
- Click Edit → Edit form opens

**Vertical Slice:** Teacher information accessible

---

### Story 5.3: Create Teacher List with Search

**As a** admin
**I want** to view all teachers with search
**So that** I can manage teaching staff

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/teachers`
- [x] Table columns: Photo, name, employee ID, departments, classes, status
- [x] Search: By name, employee ID, email
- [x] Filters: Department, employment type, status
- [x] Sort: By name, hire date
- [x] Click row: Navigate to teacher profile

**Technical Notes:**
- Use @tanstack/react-table
- Server-side search and filtering

**Testing:**
- Search "John Smith" → Teacher appears
- Filter by "Math Department" → Only math teachers shown

**Vertical Slice:** Teachers easily searchable

---

### Story 5.4: Create Department Assignment

**As a** admin
**I want** to assign teachers to departments
**So that** teachers are organized by subject area

**Acceptance Criteria:**
- [x] Within teacher profile: Departments section
- [x] Add department: Select from dropdown
- [x] Primary department: Mark one as primary
- [x] One teacher can belong to multiple departments
- [x] Remove department: With confirmation
- [x] schoolId scoping: Department assignment within school

**Technical Notes:**
- Join table: `TeacherDepartment { teacherId, departmentId, isPrimary }`
- Server Action: `assignDepartment(teacherId, departmentId, isPrimary)`

**Testing:**
- Assign teacher to Math department → Teacher appears in department
- Mark as primary department → Displayed first in teacher profile

**Vertical Slice:** Teachers organized by department

---

### Story 5.5: Create Qualification Management

**As a** admin/teacher
**I want** to add and manage qualifications
**So that** credentials are tracked

**Acceptance Criteria:**
- [x] Within teacher profile: Qualifications section
- [x] Add qualification: Degree type, major, university, graduation year, certificate upload
- [x] Certification types: Bachelor's, Master's, PhD, Certificate, License
- [x] Upload certificate (PDF/image)
- [x] Expiry date for licenses/certifications
- [x] Alert when certification expiring soon (30 days)

**Technical Notes:**
- Model: `TeacherQualification { id, teacherId, type, major, university, year, certificateUrl, expiryDate }`
- Server Action: `addQualification(teacherId, data: FormData)`

**Testing:**
- Add Bachelor's degree → Appears in profile
- Add teaching license with expiry → Alert shows 30 days before expiry

**Vertical Slice:** Teacher qualifications documented

---

(Continuing with Stories 5.6-5.15 covering: Class assignment, Subject assignment, Teaching schedule, Workload calculation, Attendance tracking for teachers, Leave management, Salary information, Performance reviews, Professional development, Teacher reports, Bulk teacher import)

---

## Epic 6: Class & Subject Management

**Goal:** Manage subjects, classes, student enrollment, and schedules.

**Value Proposition:** Schools can organize academic offerings efficiently, assign teachers, enroll students, and generate timetables automatically.

**Prerequisites:** Epic 3 (School Configuration), Epic 4 (Student Management), Epic 5 (Teacher Management)

**Acceptance Criteria for Epic Completion:**
- ✅ Subject catalog management
- ✅ Class creation and management
- ✅ Student enrollment in classes
- ✅ Teacher assignment to classes
- ✅ Class capacity management
- ✅ Timetable generation and management

---

### Story 6.1: Create Subject Catalog

**As a** school admin
**I want** to create a catalog of subjects
**So that** I can offer them in classes

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/subjects`
- [x] Create subject: Name, code, description, department, credit hours
- [x] Subject examples: "Mathematics", "Physics", "English Literature"
- [x] Subject code: Unique within school (e.g., MATH101)
- [x] Department assignment: Link subject to department
- [x] List view: Display all subjects with filters
- [x] schoolId scoping: Each school has own subjects

**Technical Notes:**
- Model: `Subject { id, schoolId, name, code, description, departmentId, creditHours }`
- Server Action: `createSubject(data: FormData)`
- Unique constraint: `@@unique([code, schoolId])`

**Testing:**
- Create "Mathematics" (code: MATH101) → Subject created
- Create duplicate code → Error: "Code already exists"

**Vertical Slice:** Subject catalog ready

---

### Story 6.2: Create Class Creation

**As a** school admin
**I want** to create classes for subjects
**So that** students can enroll and teachers can teach

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/classes/new`
- [x] Form: Subject, year level, section (A/B/C), capacity, room
- [x] Class name format: "{Subject} - {Year Level} - {Section}" (e.g., "Math - Grade 10 - A")
- [x] Assign teacher: Select from teachers in subject's department
- [x] Set capacity: Max students (default: 30)
- [x] Assign classroom: Select available room
- [x] Schedule: Add periods (Day, Period, Room)
- [x] On save: Create class, redirect to class profile

**Technical Notes:**
- Model: `Class { id, schoolId, subjectId, yearLevelId, section, capacity, teacherId, classroomId }`
- Server Action: `createClass(data: FormData)`
- Validation: Capacity must be positive, teacher must be qualified

**Testing:**
- Create "Math - Grade 10 - A" → Class created
- Assign teacher → Teacher appears in class profile
- Enroll students up to capacity → Enrollment stops at limit

**Vertical Slice:** Classes can be created and configured

---

### Story 6.3: Create Student Enrollment in Classes

**As a** school admin/staff
**I want** to enroll students in classes
**So that** they can attend and receive grades

**Acceptance Criteria:**
- [x] Within class profile: Students section
- [x] Enroll students: Multi-select from students in same year level
- [x] Bulk enrollment: Select all students, enroll in one click
- [x] Enrollment validation: Check capacity, check year level match
- [x] Remove student: Unenroll with confirmation
- [x] List view: Display enrolled students with status

**Technical Notes:**
- Join table: `StudentClass { studentId, classId, enrollmentDate, status }`
- Server Action: `enrollStudentsInClass(classId, studentIds: string[])`
- Status enum: ENROLLED, DROPPED, COMPLETED

**Testing:**
- Enroll 20 students → All appear in class roster
- Try to enroll 31st student (capacity 30) → Error: "Class full"
- Enroll student from wrong year level → Error: "Year level mismatch"

**Vertical Slice:** Students can be enrolled in classes

---

### Story 6.4: Create Class Roster View

**As a** teacher
**I want** to view my class roster
**So that** I know which students are enrolled

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/classes/{classId}/roster`
- [x] Table: Student photo, name, student ID, attendance rate, current grade
- [x] Search: By student name or ID
- [x] Export roster: PDF or CSV
- [x] Print roster: Formatted for printing
- [x] Quick actions: View student profile, mark attendance

**Technical Notes:**
- Fetch students with attendance and grades aggregated
- PDF generation: Use @react-pdf/renderer

**Testing:**
- View roster → All enrolled students displayed
- Export CSV → File contains roster data

**Vertical Slice:** Class roster accessible

---

### Story 6.5: Create Timetable Generation

**As a** school admin
**I want** to generate class timetables automatically
**So that** I don't have to schedule manually

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/timetables/generate`
- [x] Input: Academic year, term
- [x] Algorithm: Assign classes to periods avoiding conflicts
- [x] Constraints: No teacher double-booking, no room conflicts, no student conflicts
- [x] Output: Weekly timetable for each class, teacher, and student
- [x] Manual adjustments: Drag-and-drop to reschedule
- [x] Publish timetable: Make visible to students and teachers

**Technical Notes:**
- Algorithm: Constraint satisfaction (backtracking or genetic algorithm)
- Model: `Timetable { id, schoolId, termId, classId, dayOfWeek, periodId, roomId }`
- Server Action: `generateTimetable(termId)`, `publishTimetable(termId)`

**Testing:**
- Generate timetable → All classes scheduled without conflicts
- Verify no conflicts: Check teachers, rooms, students
- Publish timetable → Visible to students and teachers

**Vertical Slice:** Timetables automatically generated

---

(Continuing with Stories 6.6-6.18 covering: Student timetable view, Teacher timetable view, Classroom timetable view, Timetable conflicts resolution, Class capacity alerts, Class waiting list, Class schedule changes, Subject prerequisites, Course catalog for students, Class enrollment statistics, Class performance analytics, Class resources sharing, Class communication board, Semester schedule rotation, Block scheduling support, Honors/AP class designation)

---

## Epic 7: Attendance System

**Goal:** Comprehensive attendance tracking with daily and period-wise recording, QR codes, and automated alerts.

**Value Proposition:** Schools can accurately track student attendance, identify patterns, and intervene early for chronic absenteeism.

**Prerequisites:** Epic 4 (Student Management), Epic 6 (Class Management)

**Acceptance Criteria for Epic Completion:**
- ✅ Daily attendance marking
- ✅ Period-wise attendance for secondary schools
- ✅ QR code check-in
- ✅ Attendance reports and analytics
- ✅ Automated absence alerts to parents
- ✅ Attendance excuses and approvals

---

### Story 7.1: Create Daily Attendance Marking (Primary School)

**As a** teacher
**I want** to mark daily attendance for my class
**So that** student presence is recorded

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/attendance/daily/{classId}`
- [x] Date selector: Choose date to mark (default: today)
- [x] Student list: All enrolled students with photo and name
- [x] Status options: Present, Absent, Late, Excused
- [x] Quick actions: Mark all present, mark all absent
- [x] Save: Bulk save all attendance records
- [x] schoolId scoping: Only mark attendance for own school's students

**Technical Notes:**
- Model: `Attendance { id, schoolId, studentId, classId, date, status, notes }`
- Status enum: PRESENT, ABSENT, LATE, EXCUSED
- Server Action: `markDailyAttendance(classId, date, records: AttendanceRecord[])`
- Unique constraint: `@@unique([studentId, date, schoolId])`

**Testing:**
- Mark attendance for Jan 1 → All records saved
- Try to mark attendance for future date → Warning: "Future date"
- Mark student as present → Status saved and visible

**Vertical Slice:** Daily attendance can be marked

---

### Story 7.2: Create Period-Wise Attendance (Secondary School)

**As a** teacher
**I want** to mark attendance for each period
**So that** absences are tracked per class

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/attendance/period/{classId}`
- [x] Period selector: Choose period (from timetable)
- [x] Similar UI to daily attendance
- [x] Status recorded per period
- [x] Student can be present in Period 1, absent in Period 2
- [x] Aggregate view: Total periods present/absent per day

**Technical Notes:**
- Model: `AttendanceEnhanced { id, schoolId, studentId, classId, date, periodId, status }`
- Server Action: `markPeriodAttendance(classId, date, periodId, records)`

**Testing:**
- Mark Period 1 attendance → Saved
- Mark Period 2 differently → Both records exist
- View student daily summary → Shows "Present: 3/5 periods"

**Vertical Slice:** Period-wise attendance tracked

---

### Story 7.3: Create QR Code Check-In

**As a** student
**I want** to scan QR code to mark my attendance
**So that** attendance is faster and automated

**Acceptance Criteria:**
- [x] Teacher generates QR code for class/period
- [x] QR code displays: Class name, period, expiry time (5 minutes)
- [x] Student scans QR code with phone
- [x] System records attendance as Present
- [x] QR code expires after time limit
- [x] Anti-fraud: Check student's geolocation (if enabled)

**Technical Notes:**
- QR code payload: `{classId, periodId, date, signature}` (JWT signed)
- Model: `GeoAttendance { id, attendanceId, latitude, longitude, timestamp }`
- Server Action: `checkInWithQR(qrPayload: string, latitude?, longitude?)`

**Testing:**
- Generate QR code → Code displayed
- Student scans within 5 minutes → Attendance marked
- Student scans after 5 minutes → Error: "QR code expired"
- Student scans from different location → Warning (if geo-fencing enabled)

**Vertical Slice:** QR code attendance functional

---

### Story 7.4: Create Attendance Reports

**As a** admin/teacher
**I want** to view attendance reports
**So that** I can identify patterns and issues

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/reports/attendance`
- [x] Report types: Daily, weekly, monthly, by class, by student
- [x] Filters: Date range, year level, class, student
- [x] Metrics: Attendance rate, absences count, late count
- [x] Charts: Line chart (attendance trend), bar chart (by class)
- [x] Export: PDF, CSV, Excel
- [x] Identify chronic absenteeism: Students with <90% attendance

**Technical Notes:**
- Aggregation queries: Calculate attendance rates
- Use Recharts for visualizations
- Export: Use @react-pdf/renderer for PDF

**Testing:**
- View daily report → Shows today's attendance
- Filter by "Grade 10" → Only Grade 10 students shown
- Export PDF → Report downloads

**Vertical Slice:** Attendance data analyzable

---

### Story 7.5: Create Automated Absence Alerts

**As a** parent
**I want** to receive alerts when my child is absent
**So that** I'm aware of attendance issues

**Acceptance Criteria:**
- [x] When student marked absent: Send email/SMS to guardian
- [x] Alert includes: Student name, date, class, reason (if provided)
- [x] Parent can respond: Excuse absence, provide reason
- [x] Admin configurable: Enable/disable alerts per school
- [x] Alert frequency: Immediate, daily digest, weekly digest

**Technical Notes:**
- Trigger: After teacher marks attendance
- Email service: Resend
- SMS service: Twilio (optional integration)
- Server Action: `sendAbsenceAlert(attendanceId)`

**Testing:**
- Mark student absent → Email sent to parent within 5 minutes
- Parent clicks link → Can submit excuse

**Vertical Slice:** Parents notified of absences

---

(Continuing with Stories 7.6-7.16 covering: Attendance excuses management, Late check-in tracking, Early departure tracking, Attendance trends analytics, Attendance percentage calculation, Attendance certificate generation, Attendance awards/recognition, Attendance anomaly detection, Attendance history view, Attendance calendar view, Bulk attendance marking, Attendance notifications, Attendance audit trail, Attendance grace period, Parent-submitted absence requests)

---

## Epic 8: Assessment & Grading

**Goal:** Comprehensive assessment system with assignments, submissions, grading, report cards, and rubrics.

**Value Proposition:** Teachers can create diverse assessments, grade efficiently, and generate comprehensive progress reports.

**Prerequisites:** Epic 6 (Class Management)

**Acceptance Criteria for Epic Completion:**
- ✅ Assignment creation and management
- ✅ Student submission system
- ✅ Grading with rubrics
- ✅ Grade calculations and weightings
- ✅ Report card generation
- ✅ Progress tracking

---

### Story 8.1: Create Assignment Creation

**As a** teacher
**I want** to create assignments for my classes
**So that** I can assess student learning

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/classes/{classId}/assignments/new`
- [x] Form: Title, description, due date, total points, submission type
- [x] Submission types: Text, file upload, link, none (in-class)
- [x] Attach resources: PDFs, links, documents
- [x] Publish: Immediately or schedule for later
- [x] Students notified when published

**Technical Notes:**
- Model: `Assignment { id, classId, title, description, dueDate, totalPoints, submissionType }`
- Server Action: `createAssignment(classId, data: FormData)`

**Testing:**
- Create assignment → Appears in class assignments
- Schedule for future → Not visible to students until date
- Publish → Students receive notification

**Vertical Slice:** Assignments can be created

---

### Story 8.2: Create Student Submission System

**As a** student
**I want** to submit assignments online
**So that** I don't need to submit physically

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/assignments/{assignmentId}/submit`
- [x] Submission form: Text editor or file upload
- [x] File types: PDF, DOC, DOCX, images (max 10MB)
- [x] Submission status: Not submitted, submitted, late, graded
- [x] Late submission: Flagged if after due date
- [x] Resubmit: Allow resubmission before grading

**Technical Notes:**
- Model: `AssignmentSubmission { id, assignmentId, studentId, submissionText, fileUrl, submittedAt, status }`
- Server Action: `submitAssignment(assignmentId, data: FormData)`

**Testing:**
- Submit assignment before due date → Marked on time
- Submit after due date → Marked late
- Resubmit before grading → Previous submission replaced

**Vertical Slice:** Students can submit assignments

---

### Story 8.3: Create Grading Interface

**As a** teacher
**I want** to grade student submissions
**So that** students receive feedback

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/assignments/{assignmentId}/grade`
- [x] List: All submissions with student name and status
- [x] Click submission: View submission, add grade (0-total points), add feedback
- [x] Grading modes: Points, percentage, letter grade
- [x] Bulk grading: Apply same grade/feedback to multiple
- [x] Return to student: Student receives notification

**Technical Notes:**
- Update AssignmentSubmission: `grade, feedback, gradedAt, gradedBy`
- Server Action: `gradeSubmission(submissionId, grade, feedback)`

**Testing:**
- Grade submission → Grade saved and visible to student
- Add feedback → Student sees feedback
- Bulk grade 10 submissions → All graded

**Vertical Slice:** Assignments can be graded

---

### Story 8.4: Create Gradebook View

**As a** teacher
**I want** to view all grades for my class in one place
**So that** I can track student progress

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/classes/{classId}/gradebook`
- [x] Table: Rows = students, columns = assignments
- [x] Cell values: Grade (colored: green=A, yellow=B/C, red=D/F)
- [x] Summary column: Current grade (weighted average)
- [x] Filters: By assignment category, by student
- [x] Export: CSV, Excel

**Technical Notes:**
- Fetch all assignments and submissions for class
- Calculate weighted averages based on categories
- Use conditional formatting for grade colors

**Testing:**
- View gradebook → All grades displayed in grid
- Export CSV → Gradebook data in file

**Vertical Slice:** Complete class grades visible

---

### Story 8.5: Create Grade Calculation with Weightings

**As a** teacher
**I want** to weight assignment categories
**So that** final grades are calculated correctly

**Acceptance Criteria:**
- [x] Assignment categories: Homework, Quizzes, Tests, Projects, Final Exam
- [x] Category weights: Configure per class (e.g., Homework 20%, Tests 50%)
- [x] Total weight must equal 100%
- [x] Final grade: Weighted average of all categories
- [x] Display: Current grade updates automatically as assignments graded

**Technical Notes:**
- Model: `AssignmentCategory { id, name, weight }`
- Assignment references category: `Assignment.categoryId`
- Calculation: `finalGrade = Σ(categoryAvg * categoryWeight)`

**Testing:**
- Set Tests to 50%, Homework to 30%, Projects to 20% → Total 100%
- Student gets 90% on test, 80% on homework → Final grade calculated correctly

**Vertical Slice:** Grades weighted properly

---

(Continuing with Stories 8.6-8.22 covering: Report card generation, Progress reports, Parent portal grade access, Grade appeals process, Rubric creation, Rubric-based grading, Extra credit, Dropped grades (drop lowest), Grading scales (A-F, percentage, pass/fail), GPA calculation, Honor roll, Academic probation alerts, Transcript generation, Assignment analytics, Plagiarism detection integration, Peer review, Self-assessment, Formative vs summative assessment tracking, Grade distribution charts, Missing assignments tracking, Late work policy enforcement, Bonus points system)

---

## Epic 9: Fee Management

**Goal:** Comprehensive fee management with structures, payments, invoices, and financial reporting.

**Value Proposition:** Schools can automate fee collection, track payments, generate invoices, and produce financial reports with double-entry bookkeeping.

**Prerequisites:** Epic 4 (Student Management)

**Acceptance Criteria for Epic Completion:**
- ✅ Fee structure definition
- ✅ Fee assignment to students
- ✅ Payment collection (online and offline)
- ✅ Invoice generation
- ✅ Payment receipts
- ✅ Fee reports and analytics

---

### Story 9.1: Create Fee Structure Management

**As a** school admin/accountant
**I want** to define fee structures
**So that** I can assign fees to students

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/fees/structures`
- [x] Create structure: Name, amount, frequency (monthly/quarterly/annual/one-time)
- [x] Fee types: Tuition, books, transportation, meals, activities
- [x] Discounts: Define percentage or fixed amount discounts
- [x] Effective dates: When structure becomes active
- [x] schoolId scoping: Each school defines own structures

**Technical Notes:**
- Model: `FeeStructure { id, schoolId, name, amount, frequency, type, effectiveDate }`
- Frequency enum: MONTHLY, QUARTERLY, ANNUAL, ONE_TIME
- Server Action: `createFeeStructure(data: FormData)`

**Testing:**
- Create "Grade 10 Tuition" ($5000, annual) → Structure created
- Create "Transportation Fee" ($100, monthly) → Structure created

**Vertical Slice:** Fee structures defined

---

### Story 9.2: Create Fee Assignment to Students

**As a** school admin/accountant
**I want** to assign fee structures to students
**So that** they are billed correctly

**Acceptance Criteria:**
- [x] Within student profile: Fees section
- [x] Assign fee: Select structure, set custom amount (if different), set due date
- [x] Bulk assignment: Assign fee to entire year level or class
- [x] Automatic assignment: New students get default fees for their year level
- [x] Discount application: Apply sibling discount, scholarship, financial aid

**Technical Notes:**
- Model: `StudentFee { id, studentId, feeStructureId, amount, dueDate, discountAmount }`
- Server Action: `assignFeeToStudent(studentId, feeStructureId, data)`
- Bulk action: `assignFeeToYearLevel(yearLevelId, feeStructureId)`

**Testing:**
- Assign tuition to student → Fee appears in student profile
- Apply 10% sibling discount → Amount reduced
- Bulk assign to Grade 10 → All Grade 10 students have fee

**Vertical Slice:** Students have fees assigned

---

### Story 9.3: Create Payment Collection (Offline)

**As a** school accountant
**I want** to record cash/check payments
**So that** payment history is tracked

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/payments/record`
- [x] Select student, select fee to pay
- [x] Payment method: Cash, check, bank transfer
- [x] Amount: Full or partial payment
- [x] Receipt number: Auto-generated or manual
- [x] On save: Record payment, update fee balance, generate receipt

**Technical Notes:**
- Model: `FeePayment { id, studentId, studentFeeId, amount, paymentMethod, paymentDate, receiptNumber }`
- Server Action: `recordPayment(data: FormData)`
- Update StudentFee.paidAmount

**Testing:**
- Record $1000 cash payment → Payment saved, balance updated
- Generate receipt → PDF with payment details

**Vertical Slice:** Offline payments recorded

---

### Story 9.4: Create Online Payment (Stripe Integration)

**As a** parent
**I want** to pay fees online
**So that** I don't need to visit school

**Acceptance Criteria:**
- [x] Parent portal: View outstanding fees
- [x] "Pay Online" button → Stripe checkout
- [x] Payment methods: Credit card, debit card
- [x] On success: Payment recorded, receipt emailed
- [x] On failure: Error message, retry option
- [x] Security: PCI-compliant (Stripe handles card data)

**Technical Notes:**
- Stripe integration: Use Stripe Checkout or Elements
- Webhook: `/api/webhooks/stripe` handles payment confirmation
- Server Action: `createStripeCheckout(studentFeeId)`, `handleStripeWebhook()`

**Testing:**
- Parent clicks "Pay Online" → Redirected to Stripe
- Complete payment → Payment recorded, email sent

**Vertical Slice:** Online payments functional

---

### Story 9.5: Create Invoice Generation

**As a** school accountant
**I want** to generate invoices for students
**So that** parents know what to pay

**Acceptance Criteria:**
- [x] Auto-generate invoices: Monthly for recurring fees
- [x] Manual generation: Select students, generate invoice
- [x] Invoice includes: Student name, fee breakdown, total due, due date
- [x] PDF format: Professional layout with school logo
- [x] Email to parents: Automatic email with PDF attached
- [x] Invoice tracking: Paid, partially paid, overdue status

**Technical Notes:**
- Model: `Invoice { id, studentId, invoiceNumber, totalAmount, dueDate, status }`
- Model: `InvoiceItem { id, invoiceId, feeStructureId, amount }`
- Server Action: `generateInvoice(studentId)`, `emailInvoice(invoiceId)`

**Testing:**
- Generate invoice → PDF created with fee details
- Email invoice → Parent receives email with PDF

**Vertical Slice:** Invoices generated and emailed

---

(Continuing with Stories 9.6-9.18 covering: Receipt generation, Payment receipts emailing, Fee balance tracking, Overdue fee alerts, Payment reminders, Fee reports, Revenue reports, Payment history, Refund processing, Scholarship management, Financial aid, Payment plans, Fee waivers, Late fee penalties, Installment payments, Sibling discounts, Fee summary dashboard, Fee analytics)

---

## Epic 10: Communication

**Goal:** Comprehensive communication system with announcements, parent portal, messaging, and notifications.

**Value Proposition:** Schools can communicate effectively with parents, students, and staff through multiple channels.

**Prerequisites:** Epic 4 (Student Management), Epic 5 (Teacher Management)

**Acceptance Criteria for Epic Completion:**
- ✅ Announcements system
- ✅ Parent portal
- ✅ Direct messaging
- ✅ Email notifications
- ✅ SMS notifications (optional)
- ✅ Push notifications

---

### Story 10.1: Create Announcements System

**As a** school admin
**I want** to create announcements
**So that** I can communicate with school community

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/announcements`
- [x] Create announcement: Title, content (rich text), audience, publish date
- [x] Audience options: All, students, parents, teachers, specific year level
- [x] Attachments: Files, images, links
- [x] Scheduling: Publish now or schedule for later
- [x] Notification: Email + in-app notification sent to audience

**Technical Notes:**
- Model: `Announcement { id, schoolId, title, content, audience, publishDate }`
- Server Action: `createAnnouncement(data: FormData)`, `sendAnnouncementNotifications(announcementId)`

**Testing:**
- Create announcement for "All Parents" → All parents receive email
- Schedule for tomorrow → Published automatically tomorrow

**Vertical Slice:** Announcements can be broadcast

---

### Story 10.2: Create Parent Portal

**As a** parent
**I want** to access my children's information
**So that** I can monitor their progress

**Acceptance Criteria:**
- [x] Parent login at `/{lang}/auth/parent-login`
- [x] Dashboard: Overview of all children
- [x] For each child: Attendance, grades, fees, announcements
- [x] Real-time updates: Data syncs automatically
- [x] Download reports: Attendance, grades, fee receipts
- [x] Communication: Send messages to teachers

**Technical Notes:**
- Parent sees only their children's data
- Use SWR for real-time data fetching
- Role: GUARDIAN

**Testing:**
- Parent logs in → Sees all children
- Click child → View attendance, grades, fees
- Download report card → PDF downloads

**Vertical Slice:** Parents can monitor children

---

### Story 10.3: Create Direct Messaging

**As a** parent/teacher
**I want** to send direct messages
**So that** I can communicate privately

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/messages`
- [x] Compose message: Select recipient, write message, send
- [x] Inbox: View received messages
- [x] Sent: View sent messages
- [x] Thread view: Conversation history
- [x] Notifications: Email when new message received

**Technical Notes:**
- Model: `Message { id, senderId, recipientId, subject, body, sentAt, readAt }`
- Server Action: `sendMessage(recipientId, data: FormData)`
- Real-time: Consider WebSocket for real-time updates (future)

**Testing:**
- Teacher sends message to parent → Parent receives email and in-app notification
- Parent replies → Thread continues

**Vertical Slice:** Direct messaging functional

---

(Continuing with Stories 10.4-10.12 covering: Email notifications, SMS notifications, Push notifications, Notification preferences, Parent-teacher conferences scheduling, Meeting reminders, Emergency alerts, Newsletter, Event invitations, RSVP tracking, Multilingual announcements, Communication analytics)

---

## Epic 11: Reporting & Analytics

**Goal:** Comprehensive reporting and analytics dashboards for data-driven decision making.

**Value Proposition:** Schools can visualize data, identify trends, and make informed decisions based on real-time analytics.

**Prerequisites:** All previous epics (data must exist)

**Acceptance Criteria for Epic Completion:**
- ✅ School-wide dashboard
- ✅ Student progress reports
- ✅ Class analytics
- ✅ Financial reports
- ✅ Attendance analytics
- ✅ Teacher performance reports

---

### Story 11.1: Create School Dashboard

**As a** school admin
**I want** to see school-wide metrics
**So that** I have an overview of school operations

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/dashboard`
- [x] Key metrics: Total students, total teachers, average attendance, revenue
- [x] Charts: Enrollment trend, attendance trend, revenue trend
- [x] Alerts: Overdue fees, low attendance, pending approvals
- [x] Quick actions: Add student, mark attendance, record payment
- [x] Real-time data: Updates automatically

**Technical Notes:**
- Aggregate queries: Count students, calculate averages
- Use Recharts for visualizations
- SWR for real-time updates

**Testing:**
- View dashboard → All metrics display correctly
- Add new student → Student count increases immediately

**Vertical Slice:** School overview accessible

---

### Story 11.2: Create Student Progress Reports

**As a** teacher/parent
**I want** to view comprehensive student progress
**So that** I can identify areas for improvement

**Acceptance Criteria:**
- [x] Page at `/{lang}/s/{subdomain}/reports/student/{studentId}`
- [x] Sections: Attendance, grades, behavior, achievements
- [x] Attendance: Chart showing daily/monthly attendance
- [x] Grades: Chart showing grade trends by subject
- [x] Behavior: Incidents, commendations
- [x] Achievements: Awards, certificates
- [x] Export: PDF report card

**Technical Notes:**
- Fetch all student data: Attendance, grades, behavior
- Generate charts: Line chart for trends, bar chart for subjects
- PDF export: @react-pdf/renderer

**Testing:**
- View report → All sections display
- Export PDF → Report downloads

**Vertical Slice:** Student progress comprehensively reported

---

(Continuing with Stories 11.3-11.14 covering: Class performance analytics, Teacher performance reports, Financial reports, Attendance analytics, Enrollment forecasting, Comparative analytics, Customizable dashboards, Data export, Scheduled reports, Email reports, Report templates, Predictive analytics, Risk indicators, Benchmark comparisons)

---

## Epic 12: Polish & Launch

**Goal:** Final polish, performance optimization, security hardening, and launch preparation.

**Value Proposition:** Platform is production-ready, secure, performant, and fully documented.

**Prerequisites:** All previous epics complete

**Acceptance Criteria for Epic Completion:**
- ✅ Performance optimization (target: Lighthouse 90+)
- ✅ Security hardening (OWASP Top 10 compliance)
- ✅ Comprehensive documentation
- ✅ User onboarding flows
- ✅ Marketing website
- ✅ Launch plan executed

---

### Story 12.1: Performance Optimization

**As a** developer
**I want** to optimize performance
**So that** the platform loads quickly

**Acceptance Criteria:**
- [x] Lighthouse score: Desktop 90+, Mobile 80+
- [x] Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1
- [x] Image optimization: All images using Next/Image with WebP
- [x] Code splitting: Dynamic imports for heavy components
- [x] Database optimization: Add indexes, optimize queries
- [x] Caching: Implement ISR and SWR caching

**Technical Notes:**
- Run Lighthouse audit: Identify bottlenecks
- Use Next/Image for automatic optimization
- Add indexes on foreign keys and frequently queried fields

**Testing:**
- Run Lighthouse → Score 90+
- Measure load time → <3 seconds

**Vertical Slice:** Platform performant

---

### Story 12.2: Security Hardening

**As a** developer
**I want** to harden security
**So that** user data is protected

**Acceptance Criteria:**
- [x] OWASP Top 10 compliance verified
- [x] SQL injection prevention: Parameterized queries (Prisma)
- [x] XSS prevention: React auto-escaping, DOMPurify for rich text
- [x] CSRF protection: NextAuth built-in
- [x] Rate limiting: Prevent brute force attacks
- [x] Security headers: CSP, HSTS, X-Frame-Options
- [x] Penetration testing: Third-party security audit

**Technical Notes:**
- Use Snyk or Dependabot for dependency scanning
- Implement rate limiting with Upstash Rate Limit
- Add security headers in middleware

**Testing:**
- Run security audit → No critical vulnerabilities
- Test SQL injection → Blocked
- Test XSS → Escaped automatically

**Vertical Slice:** Platform secure

---

### Story 12.3: Comprehensive Documentation

**As a** new user/developer
**I want** comprehensive documentation
**So that** I can use/contribute to the platform

**Acceptance Criteria:**
- [x] User documentation: Guides for each role (admin, teacher, student, parent)
- [x] Developer documentation: Architecture, setup, contributing guide
- [x] API documentation: All endpoints documented (if applicable)
- [x] Video tutorials: Key workflows recorded
- [x] FAQ: Common questions answered
- [x] Changelog: Track all releases

**Technical Notes:**
- Documentation site: Use Next.js MDX or Docusaurus
- Video hosting: YouTube or Vimeo
- Changelog: Use semantic versioning

**Testing:**
- New user follows guide → Can complete tasks
- New developer follows setup → Can run locally

**Vertical Slice:** Documentation comprehensive

---

(Continuing with Stories 12.4-12.10 covering: User onboarding flows, In-app help system, Marketing website, Launch plan, Beta testing, Performance monitoring, Error tracking, Analytics setup, SEO optimization, Launch announcement)

---

## Validation Checklist

Before implementation, verify:

1. **No Forward Dependencies**: Each story only depends on previous epics/stories
2. **Vertical Slicing**: Each story delivers end-to-end user value
3. **Complete FR Coverage**: All 200+ FRs from PRD mapped to stories
4. **Test Coverage**: Each story includes acceptance criteria suitable for TDD
5. **Multi-Tenant Safety**: Every database operation includes schoolId scoping

---

**Next Step:** Validate epic structure with BMAD checklist (85 points)
