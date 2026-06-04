## Profile — User Profile Management

### Overview

The Profile block renders a GitHub-style user profile on the school-dashboard
route `/{lang}/profile/[[...id]]` — own profile when no id, another user's
profile when an id is supplied. It shows **only real, tenant-scoped data**:
identity, a contribution graph aggregated from real activity tables, an
activity feed, pinned items, derived role stats, and self-service edit forms.
Sections without real backing data render an explicit empty-state rather than
fabricated content.

### Capabilities by role

- **All roles**: view own profile, edit GitHub-style fields (display name, bio,
  website, timezone, pronouns, status, social links), upload avatar, view the
  contribution graph (real attendance/submissions/results/etc.), manage pinned
  items (drag-to-reorder, persisted), view the activity feed.
- **Student**: real average grade, enrolled subjects, real achievements
  (`Achievement` model), self-edit contact details.
- **Teacher**: real class count, students taught, class list; self-edit
  contact / qualifications / experience.
- **Guardian**: real linked-children list + count.
- **Staff / Admin**: identity + contribution graph + pinned (no fabricated
  per-staff dashboard — school-wide KPIs live in the dashboard block).

### Routes

| Route                  | Page            | Status |
| ---------------------- | --------------- | ------ |
| `/{lang}/profile`      | Own profile     | Ready  |
| `/{lang}/profile/{id}` | View other user | Ready  |

Optional catch-all `[[...id]]` — no id → own profile; id → another user.
Client-facing paths omit the internal `/s/{subdomain}/` segment.

### File structure

```
src/components/school-dashboard/profile/
  actions.ts            # Server actions: getProfileBasicData (+ attachRoleStats),
                        #   getContributionData, getPinnedItems/updatePinnedItems,
                        #   getRecentActivity, logUserActivity, update* mutations
  validation.ts         # Zod schemas (profile/bio/settings/github/pinned/logActivity)
  types.ts              # Types (ProfileRole, ActivityType, ContributionGraphData, …)
  client.tsx            # ProfileContent — tabs + layout (Overview + one role tab)
  sidebar.tsx           # Real identity, derived stats, real achievements, empty-aware
  form.tsx              # Edit GitHub-style fields
  graph.tsx             # Contribution graph (real data; empty grid when none)
  activity.tsx          # Activity feed via getRecentActivity (empty-aware)
  pinned.tsx            # Pinned items wired to the real backend (reorder persists)
  student.tsx / teacher.tsx / parent.tsx   # Real-data role dashboards (empty-aware)
  edit-role-data.tsx    # Lazy-loaded self-edit wizard steps
  edit-role-actions.ts  # getOwnEntity / canSelfEdit / getSelfEditableSteps
  detail/
    content.tsx         # ProfileDetailContent (what the route renders) + error mapping
    actions.ts          # getProfileById / canViewProfile (strict RBAC; not yet routed)
    permissions.ts      # Permission matrix + SELF_EDITABLE_STEPS (single source)
    types.ts
  __tests__/            # actions, contribution, validation, edit-role-actions
  detail/__tests__/     # permissions, actions
```

### What is real vs deferred

**Real now:** identity, contribution graph, edit forms, pinned items (read +
reorder-persist), student achievements/average/subjects, teacher class
counts + list, guardian children list. All server reads are `schoolId`-scoped
(self-writes scope by `session.user.id`).

**Deferred (honest empty-states, not fabricated):** the activity feed is empty
until `logUserActivity` is wired into cross-block flows; per-subject grades,
attendance-rate card, grading queue, top students, timetable schedules, and the
pinned add/remove editor are not built. `updateProfileSettings` returns
`NOT_IMPLEMENTED` (no settings columns). See `ISSUE.md`.

### Tests

`pnpm vitest run src/components/school-dashboard/profile` — 108 tests across 6
files (actions, contribution, validation, edit-role-actions, detail/permissions,
detail/actions). Covers auth, multi-tenant scoping, cross-tenant regressions,
validation, and the real-stat derivations.
