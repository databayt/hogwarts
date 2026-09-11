# Profile — Production Readiness Tracker

**Status:** READY
**Completion:** ~98%
**Last Updated:** 2026-09-11

---

## 2026-09-11 — the phone layout follows GitHub's own

Measured against four iPhone captures of `github.com/abdout` in
`public/profile-github/` (1170x2532, so CSS = px / 3). What the reference
actually says, and what changed:

- [x] **Tab rail first.** GitHub's phone profile leads with the tab row, then
      the profile header, then the panel. `client.tsx` now wraps the whole
      mobile tree in one `<Tabs>`: rail, header, panel. Tab labels no longer
      hide under `sm:` — the phone shows icon + label + count, and the row
      scrolls sideways instead of wrapping.
- [x] **64px avatar beside the name**, not a 208px portrait above it
      (measured: 61.3 CSS diameter, 16px gap, page padding 16px). `sidebar.tsx`
      takes a `compact` branch off the same `useSidebar().isMobile` that picks
      the layout. Name stays 24px bold / 20px light — the reference measures
      within a pixel of that.
- [x] **Status row.** Full-width, 44px, 6px radius (the reference box is a
      rounded rectangle, not a pill). Owner-only, and it opens the edit form,
      which is where the status field already lives — no new control, no dead
      button. The emoji bubble is dropped from the avatar when this row renders:
      at 64px it crowded the name and repeated the row.
- [x] **Phone type scale.** Bio 16px, section headings (Achievements,
      Organizations, Pinned, Activity) 18px semibold, pinned card title +
      description 14px. All `md:`-reset to the desktop sizes, and `md` is 768 —
      the same breakpoint `useIsMobile` uses, so the layouts can't disagree.
- [x] **Year picker.** The desktop year rail is a column of buttons with no
      room on a phone, so the phone gets a dropdown on the graph heading (the
      thing it controls). The rail moved from `sm:flex` to `md:flex` so the two
      never both show.
- [x] **Show more activity.** The feed is server-capped at 10; the phone shows 6
      and reveals the rest. The button never claims to fetch more than is there.
- [x] `school.profile.sidebar.setStatus`, `overview.year`,
      `overview.showMoreActivity` (en + ar, same edit).

Fixed while in here:

- [x] **`MainContent` was a component declared inside the render.** New identity
      every render meant the whole subtree remounted on every state change —
      invisible while the phone had no controls, and a reset of pinned-item
      state the moment the year dropdown landed. It is plain JSX now.
- [x] **Hydration mismatch on the pinned cards.** dnd-kit numbers
      `aria-describedby` off a module-level counter that runs once on the server
      and again in the browser; the tree only started hydrating (rather than
      remounting) once `MainContent` was fixed, which exposed it. `DndContext`
      now carries a fixed `id`.
- [x] **Activity month headers** were formatted through `toLocaleDateString`
      with `ar-SA` while the entries under them used `formatDate` — the two
      disagreed about digit shapes on the Arabic page. Both go through
      `formatDate` now, still in UTC.

Not adopted from the reference: "Customize your pins" (pins are reordered and
removed inline — there is no separate surface to link to) and the contribution
banner.

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

## 2026-08-15 — student → application link

- [x] `getProfileView` selects the student's `application` (id, number,
      channel, status) on both the User-backed and orphan-entity paths;
      `ProfileViewData.application` (typed `ProfileApplicationView | null`).
      Populated only for `ADMIN` / `STAFF` viewers (`ADMISSION_VIEWERS`) — the
      admission detail page is RBAC-gated, so the link is not offered to
      OWNER/RELATED/PUBLIC who cannot open it.
- [x] Sidebar renders an "Application <number>" row linking to
      `/{lang}/admission/applications/{id}` (clean path). Null-safe: most
      demo students have no application until the legacy backfill runs.
- [x] `school.profile.sidebar.application` key (en + ar).

## Done This Pass (2026-07-19 — data-alive + role polish)

- **New seed `profile-activity`** (wired into `seedMain` + `db:seed:single`):
  current-year section attendance marked by the demo teacher (student + teacher
  graphs light up), UserActivity feed rows for demo accounts + roster/teachers/
  guardians, role-appropriate pinned items from real rows, parent↔teacher
  conversation with parent-sent messages (parent graph), expense approvals
  spread across admin/staff/accountant (staff graph), demo-student achievements
  in distinct categories, status/website/social/timezone User fields, badge
  recompute. Fully idempotent (existing-row guards + deterministic PRNG).
- **Badge artwork fixed**: source PNGs found in `/public/github` were never on
  the CDN → uploaded 26 files to the CDN origin bucket as `hogwarts/<icon>.png`
  (`prisma/scripts/upload-badge-art.ts`); `profile-images` avatar seed fixed
  (bucket-owner-enforced: no ACL; upload to `databayt-cdn`, not the app bucket).
- **BADGE_CATALOG titles/descriptions now Arabic** (single-language storage —
  ar is the schools' content language; EN localizes via the getLabels batch).
- **Sidebar renders the fields the form edits**: website, social links (LTR,
  external), joined/enrolled date, pronouns beside the role label.
- **Achievements tab is real** — earned-badge grid (art, level chip, earn date)
  instead of duplicating the role dashboard; staff gained an Organizations tab.
- **Parent children cards link to the child's profile** (orphan-entity path).
- **Localization coverage**: activity titles/descriptions, lastName, section/
  department names, pinned descriptions + metadata stat labels, and roleDetail
  lists (subjects/classes/children) joined the getLabels batch; subjects stat
  now counts DISTINCT subjects (matches the tab count).
- **UTC date rendering** across feed/graph/sidebar/achievements — fixes an SSR
  hydration mismatch for near-midnight timestamps (server TZ ≠ browser TZ) and
  off-by-one-day graph tooltips in negative-offset timezones; graph grid is now
  week-aligned (was chunked from Jan 1 regardless of weekday) with a GitHub-style
  "{count} {label} in {year}" total.
- Browser-verified on demo (AR + EN): student, teacher, parent, admin; 79/79
  profile tests + dictionary parity green.

## Done Earlier (2026-06-15 — full build-out)

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

- ~~DB tables deploy-pending~~ — applied to prod 2026-06-15. On the next deploy run
  `pnpm db:seed:single profile-extras && pnpm db:seed:single profile-activity`
  against the prod demo so its profile surfaces populate (ensure-demo
  short-circuits an already-seeded school).

### P2

- Contribution graph is keyed by `User.id` — wizard-created students with no User
  row (the orphan path parents click through to) show an honest empty graph even
  when the student has attendance. Keying student graphs by the Student entity
  would light them.

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
