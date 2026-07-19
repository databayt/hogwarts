## Profile — User Profile Management

### Overview

The Profile block renders a GitHub-style profile page for any school user, with
role-specific views (student, teacher, parent, staff), a real contribution
graph, an activity feed, earned badges, school organizations, pinned items, and
inline editing of personal info. **All data shown is real and tenant-scoped** —
the block was rebuilt (2026-06-15) to remove the previous prototype's fabricated
data (hardcoded stats, `Math.random()` activity, mock "Student of the Year"
achievements and "Chess Club" organizations).

### Capabilities by Role

- **Admin (same school)**: view any user's profile with full fields; edit role data
- **Teacher / Staff (same school)**: view profiles (sensitive fields masked for non-privileged)
- **Student / Guardian**: view own profile + same-school peers (limited fields)
- **All roles**: avatar upload, bio/profile edit, pinned-item reorder/remove,
  contribution graph, activity feed, earned badges, organization memberships
- **Platform DEVELOPER**: cross-school view (the only cross-tenant role)

### Routes

| Route                  | Page            | Status |
| ---------------------- | --------------- | ------ |
| `/{lang}/profile`      | Own profile     | Ready  |
| `/{lang}/profile/{id}` | View other user | Ready  |

The route uses an `[[...id]]` optional catch-all — no id shows your own profile,
with an id shows another user's (id may be a `User` id, or a wizard-created
`Student`/`Teacher` id with no `User` row). Has `loading.tsx` + `error.tsx`.

### File Structure

```
src/components/school-dashboard/profile/
  queries.ts            # getProfileView — the single TYPED read (real stats/badges/orgs/pinned/activity, permission-masked). NOT "use server".
  actions.ts            # "use server" mutations + getContributionData + getRecentActivity + recomputeMyBadges
  badges.ts             # recomputeProfileBadges — earning engine (derives badges from real attendance/results/merit/activity/student-Achievement). Idempotent.
  validation.ts         # Zod schemas (updateGitHubProfile, pinnedItem, …)
  types.ts              # ProfileRole + contribution-graph types only (lean)
  client.tsx            # Orchestrator: tabs (real counts), sidebar + overview layout
  achievements.tsx      # Achievements tab: earned-badge grid (art, level chip, earn date)
  sidebar.tsx           # Avatar, name, real stats, earned badges, organizations, edit entry,
                        # website + social links + joined/enrolled date (GitHub-style info rows)
  form.tsx              # Edit form: avatar upload + GitHub-style fields (a11y-labelled)
  graph.tsx             # Contribution heatmap (SWR → getContributionData; empty grid when no data; keyboard-accessible cells)
  activity.tsx          # Real UserActivity feed grouped by month (no fabrication)
  pinned.tsx            # Real pinned items: display + owner reorder/remove (persisted)
  student/teacher/parent/staff.tsx  # Role tab dashboards (real subjects / classes / children / organizations)
  edit-role-data.tsx    # Self-edit dialog wiring (lazy-loads listing wizard step forms)
  edit-role-actions.ts  # getOwnEntity (teacher/student self-edit data)
  detail/
    content.tsx         # Client wrapper: error state + ProfileDetailLoading
    permissions.ts      # getPermissionLevel (cross-tenant-safe) + field-mask helpers
    types.ts            # Permission/detail types
```

Tests live at `src/tests/school-dashboard/profile/` (Vitest) — `actions.test.ts`,
`contribution.test.ts`, `validation.test.ts`, `detail/permissions.test.ts`, and
the Playwright `profile-flows.spec.ts`.

### Data Model (additive, 2026-06-15)

- `ProfileBadge` (`profile_badges`) — earned badges per user, awarded by the engine
- `Organization` (`organizations`) + `OrganizationMembership` (`organization_memberships`) — school clubs/committees/teams and memberships
- Existing: `UserActivity`, `PinnedItem`, student-only `Achievement`

Migration-of-record: `prisma/migrations/20260615000000_add_profile_badges_organizations/`
(**applied to prod 2026-06-15**).

### Seeds

- `pnpm db:seed:single profile-extras` — organizations, memberships, badge recompute
- `pnpm db:seed:single profile-activity` — current-year life (2026-07-19): section
  attendance marked by the demo teacher, UserActivity feed, role-appropriate pinned
  items, a parent↔teacher conversation, expense approvals spread across
  admin/staff/accountant, demo-student achievements, GitHub-style User fields, and
  a badge recompute. Idempotent; both run inside `seedMain`.
- Badge artwork is served from the CDN (`hogwarts/<icon>.png`); source PNGs live in
  `/public/github`, re-upload with `npx tsx prisma/scripts/upload-badge-art.ts`.

### Status

**Completion:** ~98% | **Blockers:** none

### Integration Points

- **Auth/session** — identity, role, schoolId, viewer permission
- **Attendance / Results / Applications** — feed the contribution graph + badge earning
- **Students/Teachers/Guardians** — role-specific relations (sections, departments, children, classes, subjects)
- **File upload pipeline** — avatar upload (`@/components/file/upload`)
- **Translation** — names/bio/badge/org titles localized on-demand (batched `getLabels`)
