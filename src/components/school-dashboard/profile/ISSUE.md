# Profile — Production Readiness Tracker

**Status:** READY (DB deploy-pending)
**Completion:** ~95%
**Last Updated:** 2026-06-15

---

## MVP Checklist

- [x] View own profile with role-specific layout
- [x] View other users' profiles (cross-tenant-safe permission checks)
- [x] Edit personal information (GitHub-style fields)
- [x] Update bio
- [x] Upload avatar (now updates `User.image` **and** role `profilePhotoUrl`)
- [x] Contribution graph (real data, keyboard-accessible, honest empty state)
- [x] Activity feed (real `UserActivity`, no fabrication)
- [x] Pinned items (real data + owner reorder/remove, persisted)
- [x] Earned badges (real, derived by the earning engine)
- [x] Organizations / memberships (real, tenant-scoped)
- [x] Role tab dashboards (real subjects / classes / children / organizations)
- [x] Multi-tenant scoping in all reads/actions
- [x] Zod validation on all inputs (incl. mobile PUT)
- [x] Dictionary-driven UI (en + ar parity); fixed `dictionary.school.profile` path bug
- [x] `error.tsx` + `loading.tsx` route boundaries
- [ ] Two-factor authentication setup (enhancement)
- [ ] Session management (view/revoke active sessions) (enhancement)
- [ ] Privacy settings (control profile visibility) (enhancement)

## Done This Pass (2026-06-15 — full build-out)

- **De-fabrication**: removed hardcoded sidebar stats/achievements/organizations,
  `Math.random()` activity, mock pinned items, fake tab counts and the fake
  "achievements unlocked" / "1,086 contributions" banner.
- **New data layer**: `queries.ts` (`getProfileView`) returns a typed, real,
  permission-masked view model; `badges.ts` earning engine; new Prisma models.
- **Security (audit-confirmed)**:
  - P1 `getPermissionLevel` cross-school elevation — ADMIN/STAFF/TEACHER/ACCOUNTANT now require same school (DEVELOPER is the only cross-tenant role).
  - P1 `getContributionData` role lookup now `findFirst({ id, schoolId })` (no cross-tenant enumeration).
  - P1 dead `getUserProfileRole` IDOR — **deleted**.
  - P2 `getRecentActivity` now has a viewer-permission gate.
  - P2 mobile `PUT /api/mobile/profile` now Zod-validated.
  - P2 `fetchParentActivities` unscoped payment stub — **removed**.
- **Dead code removed**: `getStudentProfile/getTeacherProfile/getParentProfile/getStaffProfile`,
  `getUserProfileWithGitHubFields`, `updateProfile/updateProfileBio/updateProfileSettings`,
  `getUserProfileRole`, `canSelfEdit/getSelfEditableSteps`, ~700 lines of dead types.
- **a11y**: graph cells are focusable buttons with labels; icon-only buttons labelled;
  form inputs label-associated; loading skeleton matches real layout.

## Known Issues / Follow-ups

### P1

- **DB tables deploy-pending** — apply `20260615000000_add_profile_badges_organizations`
  to the prod default branch before this ships, then `pnpm db:seed:single profile-extras`.

### P2

- Adding a NEW pinned item from the UI is not yet wired (display + reorder + remove
  are). Needs an item picker sourced from subjects/classes/children.
- `profile-flows.spec.ts` predates the rebuild — update selectors + add a
  cross-school isolation case + the chrome-error skip pattern.
- `filterProfileData` / `canViewField` in `permissions.ts` document the field-mask
  policy but `queries.ts` masks inline — consider consolidating onto them.

## Enhancements (Post-MVP)

- 2FA (TOTP/SMS), session management, privacy/visibility settings
- Avatar crop/resize before upload; email-change verification flow
- Profile completeness indicator

---

**Last Review:** 2026-06-15
