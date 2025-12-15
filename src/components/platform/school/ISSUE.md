## School Admin — Backlog and Acceptance Criteria

This backlog tracks the in-tenant Admin area to MVP. Follow shadcn/ui, mirror pattern, Zod validation, and tenant scoping (`schoolId`) in every query/mutation.

Status legend: [x] done, [~] in progress, [ ] todo

### 1) Shell & Protection

- [ ] Layout and route guard for Owner/Admin
  - Acceptance: non-admins redirected to login or dashboard; shell renders children

### 2) Users & Roles

- [ ] List school users with role chips and quick filters
  - Acceptance: server pagination/sort/filter; URL-synced; tenant-safe
- [ ] Assign roles (Owner/Admin/Teacher/Student/Parent/Accountant)
  - Server: Zod-validated action; audit optional; `revalidatePath`
  - Acceptance: role updates persist; correct authorization enforced

### 3) School Settings

- [ ] Settings form (name, logo, timezone, locale)
  - Validation: Zod; parse on server; `revalidatePath`
  - Acceptance: updates persist; optimistic UI optional; tenant-safe

### 4) Domain Settings

- [ ] Subdomain display and edit (with availability check)
  - Acceptance: prevents conflicts; writes scoped to school
- [ ] Custom domain request form (store request + status)
  - Acceptance: creates `Domain` record scoped to `schoolId`

### 5) Billing Summary (Read-only for now)

- [ ] Display current plan or trial status using pricing session helpers
  - Acceptance: free-trial vs paid reflected; portal/manage button shown when action available

### 6) Invites

- [ ] Create invite (email, role, optional class)
  - Acceptance: token generated; email stub or console log in dev
- [ ] List invites and revoke
  - Acceptance: updates list; tenant-safe

### 7) Imports (Scaffolding)

- [ ] Upload CSV entry points for students and teachers (no processing yet)
  - Acceptance: validates file type/size; stores placeholder record

### 8) Testing

- [ ] Unit tests for validation and server actions (Vitest)
- [ ] Integration tests for queries with tenant scoping
  - Acceptance: green tests; no cross-tenant leakage

### 9) Documentation

- [ ] Keep `README.md` updated with progress, commands, and references
  - Acceptance: checklist reflects current state; links correct

Dependencies and references:

- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- Pricing helpers: `src/components/marketing/pricing/lib/*`, `src/components/marketing/pricing/config/*`

---

## Technology Stack & Version Requirements

This feature uses the platform's standard technology stack (see [Platform ISSUE.md](../ISSUE.md#technology-stack--version-requirements) for complete details):

### Core Stack

- **Next.js 15.4+** with App Router and Server Components
- **React 19+** with Server Actions and new hooks
- **TypeScript 5.x** in strict mode
- **Neon PostgreSQL** with autoscaling and branching
- **Prisma ORM 6.14+** for type-safe database access

### UI & Forms

- **shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS 4** with OKLCH colors
- **React Hook Form 7.61+** for form state management
- **Zod 4.0+** for schema validation
- **TanStack Table 8.21+** for data tables

### Authentication & Security

- **NextAuth.js v5** with JWT sessions
- Multi-tenant isolation via `schoolId` scoping
- CSRF protection and secure cookie handling
- Type-safe environment variables

### Development & Testing

- **Vitest 2.0+** for unit testing
- **Playwright 1.55+** for E2E testing
- **ESLint + Prettier** for code quality
- **pnpm 9.x** as package manager

### Key Patterns

- **Server Actions**: All mutations use "use server" directive
- **Multi-Tenant**: Every query scoped by `schoolId` from session
- **Type Safety**: End-to-end TypeScript with Prisma + Zod
- **Validation**: Double validation (client UX + server security)

For detailed version requirements and architecture patterns, see [Platform Technology Stack](../ISSUE.md#technology-stack--version-requirements).
