# Events -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-07-17

---

## 2026-07-17 -- Optimization + i18n pass

Verified in-browser on `demo.localhost/ar/events` (33 seeded events). tsc 0 errors for
the block, 21/21 tests pass. NOT deployed.

### Fixed -- correctness

- **Status enum mismatch (live bug)**: the UI, `config.ts`, `types.ts` and the dictionary
  used `IN_PROGRESS`, which does **not** exist in the Prisma `EventStatus` enum
  (`PLANNED | ONGOING | COMPLETED | CANCELLED | POSTPONED`). The status filter therefore
  sent an invalid enum value to Prisma, and `ONGOING`/`POSTPONED` rows rendered raw in
  both locales. Aligned the UI to the schema; `types.ts` now derives from `$Enums`.
- **Tenant scope**: `cancelEventRegistration` looked up and updated an `EventRegistration`
  via the global `(eventId, userId)` unique key with no `schoolId`, so acting in school A
  could cancel the caller's own registration in school B — while the `schoolId`-scoped
  `currentAttendees` decrement no-opped, permanently inflating B's count.
- **Wizard-draft leak**: `content.tsx` and `getEvents` did not filter `wizardStep: null`,
  so abandoned blank drafts polluted the list, its count, and pagination.
- **Title column header** rendered as "Events"/"الفعاليات" in both locales -- it read
  `dictionary.title` (the page title). Added a dedicated `titleColumn` key.
- **Locale-less navigation**: `router.push("/events")` after wizard completion and
  `/events/${id}` from the grid dropped the locale prefix.

### Fixed -- i18n

- Zod messages now come from `school.events.validation.*` via `createEventSchema(v)`
  factories (main form + all 3 wizard steps). The keys already existed, unwired.
- `getEvents`/`getEventsCSV` take `displayLang`: rows are `localize()`d and TBD/All
  placeholders resolved, so search/load-more/export no longer regress to English.
- 6 sub-route `metadata` exports -> `generateMetadata` off the dictionary.
- Error boundaries, CSV headers + enum values, calendar/detail/grid enum badges wired.
- Calendar received no `lang` at all (defaulted to English months/days) and never
  localized titles; detail page never passed `displayLang`.
- Server actions: raw error codes (`EVENT_UPDATE_FAILED`) leaked into toasts -> now
  `resolveActionError`. New `EVENT_TITLE_REQUIRED` code replaces a hardcoded string.
- `DataTable` `translations` prop was never passed -> "Load More"/"No results." English.
- Dictionary: 170 -> 192 leaf keys, en/ar parity, zero untranslated.

### Removed

- `management.tsx` (976 LOC) -- exported `EventManagement`, imported nowhere. Held the
  bulk of the block's hardcoded English.
- `queries.ts` speculative library (~380 LOC) -- every export except `getEventsForMonth`
  was unused, and it had drifted (hardcoded English labels, stale enum values).
- `table.tsx` dead `getStatusBadge` + `handleEdit` and 4 unused imports.

### Perf

- `content.tsx` / `getEvents` / `getEventsCSV` now `select` only rendered columns
  (was fetching `description` + `notes` `@db.Text` on every row of every page).
- `getEventsCSV` was fully unbounded -> `take: 10000` (matches sibling listings).
- `settings/content.tsx` + `create/content.tsx` were `"use client"` with no hooks.

### Still open

- `detail.tsx` ships its static Card grid as client JS for two `router.back()` buttons.
- `calendar-client.tsx` hand-rolls MONTH/DAY name tables instead of `formatDate`/`Intl`.
- Events is absent from `.claude/blocks.json` and has no `content/docs-*/events.mdx`.

---

## MVP Checklist

- [x] Event CRUD operations with Zod validation
- [x] Three-step wizard (information, schedule, settings)
- [x] Event type categorization (Academic, Sports, Cultural, Parent Meeting, Celebration, Workshop, Other)
- [x] Date/time scheduling with location
- [x] Calendar view (monthly calendar client component)
- [x] Attendance tracking page
- [x] Event categories management
- [x] Recurring events configuration page
- [x] Event settings page
- [x] Event detail view with attendees
- [x] Multi-tenant isolation (schoolId scoping)
- [x] RBAC authorization
- [x] Table with search, sort, filter, pagination
- [x] Unit tests (actions + validation)
- [ ] iCal export
- [ ] Email reminders/notifications

## Known Issues

### P0 -- Critical

_None_

### P1 -- High

- [ ] Email reminder system not yet wired (notification dispatch exists but event triggers missing)

### P2 -- Medium

- [ ] Calendar view lacks drag-and-drop rescheduling
- [ ] Recurring event editing does not propagate to future instances

## Enhancements (Post-MVP)

- [ ] iCal/ICS export for external calendar sync
- [ ] Email/push reminders before event start
- [ ] Event photos and gallery
- [ ] Attendee check-in via QR code
- [ ] Conflict detection (overlapping events)
- [ ] Event templates for quick creation

---

**Last Review:** 2026-03-19
