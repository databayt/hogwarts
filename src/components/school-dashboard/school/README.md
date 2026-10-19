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

1. Shell & route protection (Owner/Admin only)
2. Users & Roles basics
3. School Settings (profile, locale, timezone)
4. Domain Settings (subdomain + custom domain request)
5. Billing Summary (read-only; portal button when Stripe ready)
6. Invites
7. Imports scaffolding
8. Tests (unit + integration)

### Local Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm tests
```

### References

- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- Pricing & Stripe (read-only usage here for now): `src/components/marketing/pricing/*`

---

## Technology Stack & Dependencies

This feature is built with the following technologies (see [Platform README](../README.md) for complete stack details):

### Core Framework

- **Next.js 15.4+** - App Router with Server Components ([Docs](https://nextjs.org/docs))
- **React 19+** - Server Actions, new hooks (`useActionState`, `useFormStatus`) ([Docs](https://react.dev))
- **TypeScript** - Strict mode for type safety

### Database & ORM

- **Neon PostgreSQL** - Serverless database with autoscaling ([Docs](https://neon.tech/docs/introduction))
- **Prisma ORM 6.14+** - Type-safe queries and migrations ([Docs](https://www.prisma.io/docs))

### Forms & Validation

- **React Hook Form 7.61+** - Performant form state management ([Docs](https://react-hook-form.com))
- **Zod 4.0+** - Runtime schema validation (client + server) ([Docs](https://zod.dev))

### UI Components

- **shadcn/ui** - Accessible components built on Radix UI ([Docs](https://ui.shadcn.com/docs))
- **TanStack Table 8.21+** - Headless table with sorting/filtering ([Docs](https://tanstack.com/table))
- **Tailwind CSS 4** - Utility-first styling ([Docs](https://tailwindcss.com/docs))

### Server Actions Pattern

All mutations follow the standard server action pattern:

```typescript
"use server"
export async function performAction(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = schema.parse(input)
  await db.model.create({ data: { ...validated, schoolId } })
  revalidatePath("/feature-path")
  return { success: true }
}
```

### Key Features

- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL (where applicable)
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---


## Name display (2026-10-14, #434)

`/school/configuration/name-display` — `School.nameDisplay`: `first-second`
(default — given + father's name) or `first-last`. Read with
`schoolNameDisplay()` (`@/lib/school-name-format`, request-cached) and applied by
`shortNameParts()` / `displayName()` (`@/lib/name-utils`) in the students,
teachers, parents and staff listings and the profile. Applications, credentials,
slips, certificates and exports keep the **full** name. Separate from
`nameFormat`, which only controls how names are **typed** (one field or two).
Names split by `tokenizeName()` — عبد الله, أبو بكر, نور الدين, فضل الله stay
one name.

## Teaching mode and holidays (2026-10-19)

- `/school/configuration/teaching-mode`: In person · Live · Both → `School.conferenceDeliveryMode`
  through the live block's `updateDeliveryMode`. Choosing Live switches the provider to in-app rooms
  when LiveKit is configured. The detailed knobs stay on `/school/configuration/live-classes`.
- `/school/configuration/holidays`: HOLIDAY / CANCELLED `ScheduleException` rows
  (`holidays-actions.ts`, admins only). Days are sent as `YYYY-MM-DD` and stored at noon school time.
  The live sweep stops creating classes on these days, and the timetable shows the school as closed.

