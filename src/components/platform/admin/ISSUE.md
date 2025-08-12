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


