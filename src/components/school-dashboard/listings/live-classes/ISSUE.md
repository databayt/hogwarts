# Live Classes — Status

## Shipped

- DB-backed listings against `db.liveClassSession` (LIVE on prod Neon — no schema
  or migration changes made by this block).
- Create / edit modal form (announcements triplet + admission campaign date-range
  picker): title, teacher (required), optional subject/section, date range +
  start/end time, external meeting URL, optional provider, description.
- List / search / edit / soft-delete; table + grid views; optimistic delete.
- Multi-tenant isolation: every query scoped by `schoolId` + `deletedAt: null`;
  teacher FK verified in-tenant; `provider: "external"` on every create.
- RBAC: ADMIN/DEVELOPER full (incl. delete); STAFF/TEACHER create+edit; others
  read-only.
- Full i18n (`liveClasses` namespace, en + ar) — no hardcoded strings.
- Route: `/[lang]/live-classes` (clean path; `/s/[subdomain]` is internal only).

## Deferred / out of scope

- **LiveKit / video rooms** — this listing is external-meeting-link only.
  `roomName` / `roomSid` are left null. The built-in SFU feature lives on branch
  `feat/live-classes`.
- **Path reconciliation** — this block sits at `(listings)/live-classes/`; the
  LiveKit feature uses `(school-dashboard)/live-classes/`. The team must pick one
  home when `feat/live-classes` merges.
- **Participants / recordings / reminders** — `LiveClassParticipant`,
  `LiveClassRecording`, `LiveClassEvent`, and reminder notifications are not wired
  by this listing.
- **Stable per-(subject, section, term) default links** (`LiveClassDefaultLink`)
  — not surfaced here; each session carries its own `meetingUrl`.
- **Tests** — unit/integration coverage to follow (mirror the announcements /
  admission test layout).

## Notes

- `status` defaults to `scheduled`; the `live`/`ended`/`cancelled`/`failed`
  transitions are not auto-driven (no LiveKit webhook for external sessions) —
  admins can set status manually on edit.
- Empty-teacher case: the teacher select shows a disabled "add a teacher first"
  state; the page/table still render fine.
