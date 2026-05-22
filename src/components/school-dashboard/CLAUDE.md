# School Dashboard Block

## Context

Admin control center for individual schools (30+ sub-features, 85% complete). Every query MUST include `schoolId` for tenant isolation. Uses DataTable + columns + content pattern throughout.

## Before You Start

1. Read `README.md` here for routes, sub-feature inventory, and status matrix
2. Read `ISSUE.md` here for priorities (P1: report cards, file attachments)
3. Sub-features have their own README.md/ISSUE.md -- read the specific one you're working on

## Key Decisions

- Every sub-feature follows the triplet pattern: `*-content.tsx` (server) + `*-table.tsx` (client) + `*-columns.tsx` (client)
- Column definitions with hooks MUST be in client components (SSE prevention -- see root CLAUDE.md)
- `config.ts` at root defines sidebar navigation for all sub-features
- RBAC is per-feature via `authorization.ts` files -- each sub-feature defines its own permission matrix
- `getTenantContext()` is mandatory in every server action for `schoolId` resolution
- Listings (students, teachers, classes, etc.) share a common DataTable atom pattern with `list-params.ts` for URL state
- **Timetable and Attendance are section-based**: Sections (Grade 1-A) are the operational unit. Timetable slots have `sectionId` + `subjectId`. Attendance roster comes from `Section.students` (not `StudentClass`)

## Danger Zones

- Missing `schoolId` in any query = cross-tenant data leak (CRITICAL)
- `config.ts` sidebar config -- adding/reordering items affects all roles
- Column definitions in server components cause SSE crashes (move to client components)
- Finance module has 14 sub-modules with complex interdependencies
- Client-facing URLs must use `/${locale}/path` WITHOUT `/s/${subdomain}/` — the middleware handles mapping. Using `/s/` in Link/redirect/router.push leaks internal paths to browser.
- ALL UI text must use dictionary keys — no hardcoded English. Forms: `dictionary.school.*.form.*`, toasts: `ToastHelper`, validation: `ValidationHelper`, server errors: error codes.

## Sub-Features

| Feature    | Dir           | Status  | Has README/ISSUE     |
| ---------- | ------------- | ------- | -------------------- |
| admission  | `admission/`  | ~70% 🔴 | Yes/Yes (3 live P0s) |
| attendance | `attendance/` | Ready   | Yes/Yes              |
| dashboard  | `dashboard/`  | Ready   | Yes                  |
| exams      | `exams/`      | Ready   | Yes                  |
| finance    | `finance/`    | Ready   | Yes (per sub-module) |
| listings   | `listings/`   | Ready   | No                   |
| timetable  | `timetable/`  | Ready   | Yes/No               |
| settings   | `settings/`   | Ready   | No                   |

## Related Blocks

- [Onboarding](../onboarding/CLAUDE.md) -- creates the school this dashboard manages
- [School Marketing](../school-marketing/CLAUDE.md) -- public-facing site for same school
- [Auth](../auth/CLAUDE.md) -- session with schoolId and role

## After You Finish

1. Update the sub-feature's `ISSUE.md` and `README.md` if they exist
2. Run `pnpm tsc --noEmit` to verify no regressions
3. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000`
