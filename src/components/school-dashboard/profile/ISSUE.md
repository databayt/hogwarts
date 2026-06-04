# Profile — Production Readiness Tracker

**Status:** Hardened (honest-lean pass)
**Last Updated:** 2026-04-03

This block was previously a high-fidelity UI prototype: most of what users saw
(achievements, stats, organizations, role dashboards, the contribution-graph
fallback, the activity feed) was fabricated mock data on a live route. The
"honest-lean" pass removed every fabrication, wired the sections with a real
backend, and now renders **only real data + explicit empty-states**.

---

## Done in this pass

### Security (P0)

- [x] `getContributionData` role lookup scoped by `schoolId`
      (`findUnique` → `findFirst {id, schoolId}`) — was a cross-tenant
      role/existence probe.
- [x] Deleted dead, unscoped `getUserProfileRole` (0 callers, no tenant guard).
- [x] `fetchParentActivities` message query scoped via `conversation.schoolId`
      (Message has no `schoolId` column); removed the dead `take: 0` payment
      query.

### Validation

- [x] `logUserActivity` now validated by `logUserActivitySchema` (Zod) — was
      free-form input straight to the DB.

### Mock data removed / wired to real data

- [x] `sidebar.tsx` — stripped fabricated stats/achievements/organizations and
      fake info rows; now derives real counts, real `Achievement` rows, real
      contact (permission-gated), and hides empty sections.
- [x] `getProfileBasicData` extended (`attachRoleStats`) with real, scoped
      counts/lists: student class/subject counts + average % + achievements,
      teacher class count + students taught + class list, guardian children.
- [x] `pinned.tsx` wired to the real `getPinnedItems`/`updatePinnedItems`
      backend with owner-only drag-reorder persistence and an empty-state.
- [x] `graph.tsx` — removed the `Math.random()` mock fallback; renders a real
      (zero-filled when empty) grid.
- [x] `activity.tsx` — removed the `Math.random()` generator; wired to
      `getRecentActivity` with an honest empty-state.
- [x] Role dashboards (student/teacher/parent) rewritten to real data +
      empty-states; `staff.tsx` removed (no real per-staff data).
- [x] `client.tsx` — removed fabricated tab count badges, the fake
      "unlocked Achievements" banner, the "1,086 contributions" hardcoded
      count, and the dead footer/contribution-settings controls.

### Dead code / DRY

- [x] Deleted unused fetchers: `getStudentProfile`, `getTeacherProfile`,
      `getParentProfile`, `getStaffProfile`, `getUserProfileWithGitHubFields`.
- [x] `SELF_EDITABLE_STEPS` unified into a single export in
      `detail/permissions.ts`.

### i18n

- [x] `ACTIVITY_LABELS` moved to a client-resolved `profile.overview.activityLabels`
      dict map (EN + AR); deleted dead `MONTHS`/`WEEKDAYS`.
- [x] Route error literal "Not authenticated" → error code; `detail/content.tsx`
      maps server error codes → translated `profile.errors.*`.
- [x] New empty-state / label keys added to both `en` and `ar` profile.json
      (parity verified).

### Tests

- [x] 108 green across 6 files (was 92). Added cross-tenant regressions,
      real-stat derivations, `logUserActivity` Zod cases, and new suites for
      `edit-role-actions.ts` and `detail/actions.ts` (previously untested).

---

## Deferred (the honest boundary)

### P1

- [ ] **Activity-feed population** — `logUserActivity` is validated and the feed
      reads it, but no cross-block flow writes `UserActivity` yet, so the feed
      is honestly empty in production. Wire producers (attendance, submissions,
      payments, …) in a follow-up.

### P2

- [ ] Per-subject grade %, attendance-rate card, grading queue, top students,
      timetable-based "today's classes", per-child GPA/attendance — need
      heavier multi-aggregate queries or data not collected per user.
- [ ] Pinned **editor** UI (add/remove); only read + reorder are wired.
- [ ] `updateProfileSettings` returns `NOT_IMPLEMENTED` — `User` has no
      theme/notification/allowMessages columns (needs additive schema work).
- [ ] Avatar crop/resize; email-verification flow on email change.
- [ ] Achievement title/description on-demand translation (shown in stored
      language; name/bio already pass through `getDisplayText`).

### Notes

- `detail/actions.ts` (`getProfileById`/`canViewProfile`) is the strict-RBAC
  foundation for a future admin user-detail page — kept and now tested, but not
  yet mounted on a route.
- Action-result contracts are inconsistent (ad-hoc `{success,data}` vs
  `ActionResponse<T>` vs `detail`'s `currentUser` + post-fetch check) — unify in
  a later pass.

---

**Last Review:** 2026-04-03
