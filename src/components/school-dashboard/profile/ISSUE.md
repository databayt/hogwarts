# Profile — Production Readiness Tracker

**Status:** READY
**Completion:** ~98%
**Last Updated:** 2026-09-12

---

## 2026-09-12 — a demo year that looks lived-in

The phone layout landed on a profile whose data was thin enough to look broken.
Measured before touching anything (`admin@balqalam.com`, 2026):

| account                    | what its graph could count                | active days |
| -------------------------- | ----------------------------------------- | ----------- |
| admin / staff / accountant | expense approvals only                    | 35-37       |
| teacher                    | attendance marked, results graded         | **0**       |
| student                    | attendance, submissions, results, borrows | 5           |
| parent                     | messages sent                             | 12          |

- [x] **`profile-activity` had never run against this year.** Running it filled
      the teacher (176 days) and the student (181 days) from real attendance
      rows. CLAUDE.md already says to run it when a profile looks empty; it now
      also says to _measure_ first, because the seed's own guards hide which
      half of the data is missing.
- [x] **The demo accounts get a working year, not a recent month.** The feed
      seeded ~30 rows across the last 150 days, which reads as an abandoned
      account on a year-wide graph. Demo accounts now get rows on ~two thirds of
      the school days of the year to date, 1-3 a day. The guard rises from 5
      rows to 90 for them, so the upgrade happens once and then holds.
- [x] **Staff and parents count their logged activity.** `fetchStaffActivities`
      promised this in its own comment and never did it, so an admin's graph
      counted expense approvals and nothing else while the feed directly beneath
      listed a year of work. Students and teachers deliberately do NOT count
      `UserActivity`: their rows narrate domain events already counted from
      attendance/submissions/results, and counting both counts each day twice.
      Admin went from 40 contributions to 314.
- [x] **The year in progress stops at today.** The grid ran to December 31, so a
      September visit showed a third of the wall permanently empty and pushed
      the live weeks off a phone.
- [x] **The graph opens on the most recent weeks.** A year of squares is wider
      than a phone, and it was opening on January. Note the RTL branch: an RTL
      scroller counts from the right, so the far end is a _negative_ scrollLeft.

Asked for and removed (they are GitHub's, but not wanted here): the role label
under the name, the status row (the emoji still rides the avatar), and the tab
count badges.

Also this pass:

- [x] **The profile sat 16px further in than the app header.** The dashboard
      container already insets the page; the mobile branch was adding a second
      `px-4`, so the avatar did not line up with the menu icon. Measured, not
      eyeballed: header 16→374, profile content 32→358.
- [x] **The edit form drew a second avatar.** GitHub's edit mode keeps the one
      portrait; ours added a 64px copy with a "change photo" button beside it.
      The upload moved onto the single portrait, which carries a camera badge
      while editing. Form labels read at 16px on a phone, as in the reference.
- [x] **Harry Potter's home town rendered in English on the Arabic page.** The
      seed stored "Little Whinging" (and an English address and medical note)
      while the school's content language is Arabic, and `city` was the one
      visible string `getProfileView` never put through the translation batch.
      Both fixed; the existing rows were updated in place.

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
- [x] `school.profile.overview.year`, `overview.showMoreActivity` (en + ar,
      same edit). `sidebar.setStatus` came and went with the status row.

Fixed while in here:

- [x] **`MainContent` was a component declared inside the render.** New identity
      every render meant the whole subtree remounted on every state change —
      invisible while the phone had no controls, and a reset of pinned-item
      state the moment the year dropdown landed. It is plain JSX now.
- [x] **Intermittent hydration mismatch on the pinned cards** (pre-existing, not
      introduced by this pass — it reproduces on loads that predate it).
      dnd-kit's `useUniqueId` numbers `aria-describedby` off a module-level
      counter. The module lives for the life of the server process, so the Nth
      profile render since the last reload emits `DndDescribedBy-<N-1>` while
      the browser starts from `-0` on every page load. It therefore matches only
      on the first render after a reload, which is why it looks intermittent in
      dev — and why it is not intermittent at all in the long-lived Cloudflare
      container, where every load after the first ships a mismatched
      `aria-describedby`. `DndContext` now carries a fixed `id`, which
      `useUniqueId` returns verbatim instead of counting.
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
