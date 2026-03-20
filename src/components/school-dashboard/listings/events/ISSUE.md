# Events -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-03-19

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
