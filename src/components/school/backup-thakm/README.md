## School Dashboard — Overview

The School Dashboard is the in-tenant experience for staff, teachers, students, and guardians to run day‑to‑day operations: attendance, timetable, announcements, and basic settings. It follows the same patterns used by the Operator block (App Router, shadcn/ui, Zod, Server Actions), but all reads/writes are scoped to the current `schoolId`.

- Tech & conventions: Next.js App Router, TypeScript (strict), Tailwind, shadcn/ui (+ Radix), Zod
- Tenancy guardrails: Every query/mutation includes `schoolId`. Uniqueness is scoped by `schoolId`.
- Auth: NextAuth v5 (Auth.js). Respect session shape from `src/auth.ts`.

### Directory Structure (mirror pattern)

- Components: `src/components/school/dashboard/*`
- Route: `src/app/(school)/dashboard/*` (mirror pattern; each `page.tsx` imports `{FolderName}Content` from components)

Current components:

- `content.tsx` — wrapper for Dashboard page content (to be expanded)
- Future feature folders (mirror app): `attendance/`, `timetable/`, `announcements/`, `classes/`, `students/`, `teachers/`, `settings/`

### What “Dashboard” owns (from docs)

Aligned with `src/app/docs/requeriments/page.mdx` and `roadmap/page.mdx`:

- Attendance: daily/period attendance per class; basic reports; CSV export
- Timetable: weekly schedule grid per class/teacher; conflict detection (basic)
- Announcements: create, list, publish/unpublish (scoped to school, class, role)
- Core data quick-actions: students, teachers, classes overview and links
- Settings: school profile, branding, locale (ar/en), timezone; user profile
- Parent/student portal (read-only MVP): announcements, timetable summary

## Implementation Snapshot

Status legend: [x] done, [~] in progress, [ ] todo

- Shell & navigation
  - [x] School header/sidebar with tenant-aware nav
  - [x] Breadcrumbs and quick search (optional)
- Features
  - [x] Attendance (marking UI + data table + CSV export)
  - [x] Timetable (weekly grid with class/teacher view + conflict detection)
  - [~] Announcements (create/list + publish controls)
  - [x] Students/Teachers/Classes overviews (data tables)
  - [x] Settings (school profile, branding, locale, timezone)
  - [x] Profile page (user)

Notes:
- All reads/writes scoped to `schoolId` derived from subdomain/session
- Validation with Zod; parse client and server; return typed results

## Implementation Plan (tracked in ISSUE.md)

1) Attendance: mark present/absent/late; per-class table; URL‑synced filters; CSV export
2) Announcements: create/list; scopes; publish/unpublish; filters
3) Timetable: weekly grid; per class/teacher; conflict highlighting (basic)
4) Core data tables: students, teachers, classes; server pagination/sorting/filtering
5) Settings: school profile, branding, locale/timezone; user profile
6) i18n (ar/en + RTL) for visible strings
7) Tests: unit (utils/actions), integration (tenant scoping)

## Local Development

Commands (pnpm preferred):

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm e2e
```

## Conventions and Guardrails

- UI: shadcn/ui primitives in `src/components/ui/*`; compose atoms in `src/components/atom/*`
- Mirror pattern: each app route imports `{FolderName}Content` from components
- Validation: co‑locate `validation.ts` with `form.tsx`, infer with Zod, parse again on server
- Server Actions: start with "use server", typed returns, `revalidatePath`/`redirect` on success
- Tenancy safety: include `schoolId` in every `where` and payload; uniqueness scoped by `schoolId`
- Observability: log `requestId` and `schoolId` for traceability

## Testing

- Unit & integration: Vitest + React Testing Library (see root `vitest.config.ts`)
  - Test locations: `attendance/__tests__`, `announcements/__tests__`, `timetable/__tests__`
  - Run: `pnpm test`

## CSV export (Attendance)

- Server action: `getAttendanceReportCsv(filters)` in `src/components/school/dashboard/attendance/actions.ts`
  - Filters: `{ classId?, studentId?, status?, from?, to?, limit? }`
- UI: `AttendanceReportExportButton` in `attendance/reports/export-button.tsx` downloads CSV with current filters

## Where to add code next

- `src/components/school/dashboard/attendance/*` + `src/app/(school)/dashboard/attendance/*`
- `src/components/school/dashboard/timetable/*` + `src/app/(school)/dashboard/timetable/*`
- `src/components/school/dashboard/announcements/*` + `src/app/(school)/dashboard/announcements/*`
- `src/components/school/dashboard/settings/*` + `src/app/(school)/dashboard/settings/*`

Refer to `ISSUE.md` in this folder for granular tasks and acceptance criteria.



