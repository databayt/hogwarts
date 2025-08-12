## School App — Journey and Scope

This directory contains the in-tenant school application for Owners/Admins/Teachers/Parents/Students. Pricing can be considered in a bypassed state for now (assume free trial or paid) so we can progress on core school automation features.

### Journey: First-Time School Setup → Daily Operations

1) Access and Shell
   - Protected routes under `src/app/(school)/*` using session with `schoolId`.
   - Sidebar/header shell with tenant-aware navigation.

2) Admin Setup (Owner/Admin)
   - School settings: name, logo, locale (ar/en), timezone (Africa/Khartoum).
   - Domain settings: subdomain display/edit; custom domain request.
   - Users & Roles: list users, assign roles; send invites.
   - Billing summary: show plan/trial if available, but do not block features.

3) Seed and Core Data
   - Minimal seed of classes/subjects (stub OK initially).
   - CSV import entry points for students/teachers (processing later).

4) Daily Operations
   - Attendance (daily/period) with CSV export and filters.
   - Timetable weekly grid per class/teacher; basic conflict detection.
   - Announcements create/list; scopes: school/class/role; publish/unpublish.
   - Read-only parent/student portals (basic): announcements and timetable summary.

### Structure and Mirror Pattern

- Components: `src/components/school/<feature>/*`
- Routes: `src/app/(school)/<feature>/*`
- Each route `page.tsx` imports `{FolderName}Content` from the mirrored component folder.

### Feature Folders

- `dashboard/` — staff dashboard: attendance, timetable, announcements, lists
- `admin/` — owner/admin controls: users/roles, settings, domains, billing summary, invites

### Conventions (always applied)

- UI primitives in `src/components/ui/*`; atoms in `src/components/atom/*`
- Validation co-located as `validation.ts`; infer with Zod; parse again on server
- Server Actions: start with "use server"; typed returns; `revalidatePath`/`redirect`
- Multi-tenant safety: every query/write includes `schoolId`; uniqueness scoped by `schoolId`
- Imports: use aliases (e.g., `@/components/ui/button`)

### References

- Requirements: `src/app/docs/requeriments/page.mdx`
- Roadmap: `src/app/docs/roadmap/page.mdx`
- Arrangements: `src/app/docs/arrangements/page.mdx`
- Pricing notes: `src/components/marketing/pricing/README.md`


