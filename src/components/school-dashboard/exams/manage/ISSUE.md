# Manage -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Multi-step exam creation form (3 steps)
- [x] Exam status workflow (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
- [x] Calendar view for scheduling
- [x] Marks entry interface with real-time validation
- [x] Analytics dashboard (averages, distribution, rankings)
- [x] Search, filter, and sort on exam list
- [x] Conflict detection (same class, overlapping time)
- [x] Export to CSV and PDF
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [ ] Route pages created in app directory (BLOCKER)

---

## Known Issues

### P0 -- Critical

1. **No route pages** -- `src/app/.../exams/manage/` directory does not exist

### P1 -- High

1. **No automatic status transitions** -- Exams do not auto-move to IN_PROGRESS at start time
2. **Form state lost on refresh** -- Multi-step form does not persist to sessionStorage

### P2 -- Medium

1. **No recurring exams** -- Cannot schedule weekly quizzes automatically
2. **No exam templates** -- Cannot save exam as reusable template from manage block
3. **Integer-only marks** -- No decimal/half marks support
4. **Limited conflict detection** -- Only checks same class; does not check teacher or room availability
5. **Calendar drag-and-drop** -- Rescheduling via drag not implemented

---

## Enhancements (Post-MVP)

- Exam clone feature
- Bulk exam creation for multiple classes
- Automatic status transitions via cron
- Advanced conflict detection (teacher, room, student same-day limits)
- Partial/decimal marks support
- Offline marks entry

---

**Last Review:** 2026-03-19
