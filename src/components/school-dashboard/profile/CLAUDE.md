# Profile Block

## Context

GitHub-style user profile on the school-dashboard route
`/{lang}/profile/[[...id]]` (own profile when no id; another user when an id is
given). After the 2026-04 "honest-lean" pass it renders **only real,
tenant-scoped data + explicit empty-states** — there is no mock/placeholder data
anywhere in this block. Treat that as an invariant.

## Before you start

1. Read `README.md` (capabilities, file map, real-vs-deferred).
2. Read `ISSUE.md` (what was hardened + the deferred boundary).

## Live render path (small)

`page.tsx` → `getProfileBasicData(targetId, lang)` → `ProfileDetailContent`
(`detail/content.tsx`) → `ProfileContent` (`client.tsx`) → `ProfileSidebar`

- `ContributionGraph` + `ContributionActivity` + `PinnedItems` + one role tab
  (`student`/`teacher`/`parent`; staff is overview-only).

## Key rules / decisions

- **No mock data.** Sections without real backing render a dictionary-driven
  empty-state — never fabricated numbers, names, achievements, or dates.
- **Tenant scoping.** Every DB read is scoped by `schoolId`. Self-service writes
  (`updateProfile`/`Bio`/`GitHubProfile`/avatar) scope by `session.user.id`
  (the user's own row). `Message` has no `schoolId` — scope it via
  `conversation: { schoolId }`.
- **Real stats** are derived in `attachRoleStats` inside `getProfileBasicData`
  (student class/subject counts + avg % + `Achievement` rows; teacher class
  count + students taught + class list; guardian children). Add new derived
  fields there, scoped by `schoolId`.
- **Dictionary namespace is `dictionary.profile.*`** →
  `internationalization/dictionaries/{en,ar}/profile.json`. EN and AR must stay
  key-symmetric. Contribution-graph activity labels live under
  `profile.overview.activityLabels` and are resolved client-side.
- **RBAC.** Light client-side masking uses `viewerPermission` from
  `computeViewerPermission`. The strict `filterProfileData` matrix lives in
  `detail/permissions.ts` and is consumed by `detail/actions.ts` (kept + tested,
  not yet mounted on a route). `SELF_EDITABLE_STEPS` has a single source in
  `detail/permissions.ts`.

## Danger zones

- Don't reintroduce fabricated data — if a real source isn't available, empty-state it.
- Missing `schoolId` on any read = cross-tenant leak. The cross-tenant
  regression tests in `__tests__/contribution.test.ts` guard this.
- The activity feed (`getRecentActivity` / `logUserActivity`) is real but
  **unpopulated** — no cross-block flow writes `UserActivity` yet. It is honestly
  empty; don't fake it.

## After you finish

1. `pnpm tsc --noEmit` → 0 errors.
2. `pnpm vitest run src/components/school-dashboard/profile` → all green.
3. Update `README.md` / `ISSUE.md` if scope changed.
4. Test on `demo.localhost:3000` as `admin@databayt.org` / `1234`.
