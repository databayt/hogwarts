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
- [x] **Admin credential generation for non-students (2026-06-15)** —
      `membership/resetMemberPassword` mints a crypto-random temp password
      (`@/lib/credentials`) for teachers/staff/accountants/guardians, sets
      `mustChangePassword`, delivers via `deliverCredentials`, and returns the
      plaintext for ad-hoc sharing. School-scoped so the platform DEVELOPER account
      (no `schoolId`) can never be targeted. Complements `forcePasswordReset`
      (which only flips the must-change flag). Closes the student-only parity gap.
- [x] **Bulk import returns a credentials sheet (2026-06-15)** — `bulk` CSV
      import now mints crypto-random, unguessable temp passwords (was guessable
      `student<id>`/`teacher<id>` and a shared static `parent123`) and login-valid
      usernames (CSV names with spaces/Arabic were rejected by the login schema, so
      those users couldn't sign in). `bulkSmartImport` surfaces
      `credentials[]` → key-icon download in `bulk/content.tsx` (CSV-injection
      guarded). See `auth/ISSUE.md` for the full hardening pass.

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

## Resolved (2026-08-15) — bulk import parity with the onboarding import

`/school/bulk` and the onboarding CSV step both call `importStudents`, but were
two independently hand-rolled UIs sharing no code, no type and no result
rendering — and between them dropped three of the five things the engine
returns (`warnings`, `accessCodes` shown by neither; `credentials` by only one).

- [x] Shared results renderer `src/components/file/import/result-panel.tsx`
      (`ImportResultPanel`, `ImportResultData`, `downloadCredentialsCsv`) —
      counts, per-row errors, **warnings** (why `imported` < row count),
      **parent access codes**, credentials CSV. `/school/bulk` renders it in a
      details strip beneath the compact People cards; onboarding renders it
      inside the drop zone. One implementation, both flows.
- [x] Local `ImportResult` interface + `csvCell` / `downloadCredentials`
      removed from `bulk/content.tsx` in favour of the shared module.
- [x] i18n: `<Badge>Soon</Badge>` (no key at all) → `bulk.soon`; two
      `"Import failed"` literals → `bulk.importFailed`; `bulk.warnings|
accessCodes|expires|downloadLogins` added (en + ar). Remaining
      `t.key || "English"` fallbacks follow the house optional-chaining rule.
- [x] `bulkSmartImport` also revalidates `/admission/applications` for
      students — the Applications tab now lists BULK_IMPORT rows.
- [ ] The four CSV templates (`STUDENT_TEMPLATE` etc.) carry English sample
      rows regardless of locale. Header keys must stay canonical (the header
      map matches them); sample data could be localized. Not done.
- [ ] `bulk/actions.ts` still throws raw `Error`s (and imports
      `ACTION_ERRORS`/`actionError` without calling them). The
      `ActionResponse` migration is unfinished — same in
      `onboarding/import/actions.ts`.
- [ ] `src/components/file/import/importer.tsx` (`Importer`, 591 lines) is
      dead code — exported by two barrels, imported by nothing. Delete or
      finish as a separate decision.

## Resolved (2026-08-14) — bulk import revalidated paths that don't exist

`bulk/actions.ts` revalidated bare `/students`, `/teachers`, `/staff`,
`/parents`. Those listing pages actually live at
`/[lang]/s/[subdomain]/<name>` — the `(listings)` route group is not part of the
path — so no call could match a cache tag. Now built as a route pattern with
`"page"` (required once `[lang]`/`[subdomain]` are in the path).

**Not a live bug today**: `pnpm build` reports 691 of 692 routes as `ƒ`
(dynamic), so nothing was cached to go stale. It matters the day a listing
adopts `'use cache'`. Repo-wide count and the three failure modes:
`.claude/findings/revalidate-path-repo-wide.md`.

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
