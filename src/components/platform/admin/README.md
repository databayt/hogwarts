## School Admin — Overview

The School Admin area is the in-tenant control center for Owners and Admins to configure the school, manage users and roles, handle domains, and review billing status. It follows the same patterns used across the app (App Router, shadcn/ui, Zod, Server Actions) with strict tenant scoping by `schoolId`.

- Tech & conventions: Next.js App Router, TypeScript (strict), Tailwind, shadcn/ui (+ Radix), Zod
- Tenancy guardrails: Every query/mutation includes `schoolId`. Uniqueness is scoped by `schoolId`.
- Auth: NextAuth v5 (Auth.js). Respect session shape from `src/auth.ts`.
- Pricing status: We assume the user can be on a free trial or paid plan. Do not block Admin features on Stripe completion for now. Where relevant, show plan/trial info when available.

### Mirror Pattern

- Components live here: `src/components/school/admin/*`
- Route mirrors under: `src/app/(school)/admin/*`
- Each `page.tsx` imports `{FolderName}Content` from this folder. When adding a new segment, create a sibling `content.tsx` under components and have the page import and render it.

### MVP Responsibilities

- Users & Roles: list users in school, assign roles (Owner/Admin/Teacher/Student/Parent/Accountant)
- Invites: send invites; accept links handled by Auth block
- School Settings: profile, logo, timezone (Africa/Khartoum), locale (ar/en)
- Domain Settings: manage subdomain; request custom domain (stores request only)
- Billing Summary: show current plan or trial status; link to manage/upgrade when Stripe is ready
- Imports (initial scaffolding): CSV import entry points for students/teachers (validation later)

### Proposed Directory Structure (incremental)

- `users/` — list, role assignment
- `invites/` — create + list invites
- `settings/` — school settings form + validation
- `domains/` — domain management UI
- `billing/` — readonly plan/trial summary and portal button (when available)
- `imports/` — upload CSV stubs (future)

### Conventions and Guardrails

- UI primitives in `src/components/ui/*`; atoms in `src/components/atom/*`
- Validation co-located as `validation.ts`; infer types with Zod; parse again on server
- Server Actions: start with "use server"; typed returns; `revalidatePath`/`redirect` on success
- Multi-tenant safety: include `schoolId` in every `where` and payload; uniqueness scoped by `schoolId`
- Observability: log `requestId` and `schoolId` for traceability

### Implementation Plan

Tracked in `ISSUE.md` in this folder. High-level order:
1) Shell & route protection (Owner/Admin only)
2) Users & Roles basics
3) School Settings (profile, locale, timezone)
4) Domain Settings (subdomain + custom domain request)
5) Billing Summary (read-only; portal button when Stripe ready)
6) Invites
7) Imports scaffolding
8) Tests (unit + integration)

### Local Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

### References

- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- Pricing & Stripe (read-only usage here for now): `src/components/marketing/pricing/*`


