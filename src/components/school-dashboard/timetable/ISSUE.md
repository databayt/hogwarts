# Timetable -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Weekly schedule builder with visual grid
- [x] Flexible working days configuration (Sun-Thu, Mon-Fri, custom)
- [x] Lunch break positioning (configurable per school/term)
- [x] Conflict detection engine (teacher/room/class double-booking)
- [x] Class view and teacher view switching
- [x] Room view
- [x] A4 print-ready output with proper styling
- [x] Term-based schedules (different schedule per term)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Slot editor with suggestions for free periods
- [x] Server actions with proper validation
- [x] TypeScript strict mode compliance (no `any` violations)
- [x] Typography system compliance (semantic HTML)
- [x] Auto-generate scheduling algorithm
- [x] Schedule templates (create and apply)
- [x] Analytics and reporting
- [x] Substitution management
- [x] PDF export
- [x] Role-based views (admin, teacher, student, guardian)
- [ ] Drag-and-drop slot editor (currently click-based)
- [ ] Mobile-optimized view (component exists, needs polish)
- [ ] ARIA grid pattern for accessibility

## Known Issues

### P1 -- High

- [ ] Role checks on mutations not fully enforced (ADMIN/OWNER only)
- [ ] Print view needs final tuning for varied day counts (fonts/margins)
- [ ] Integration tests for overlapping slots and weekend pattern rendering

### P2 -- Medium

- [ ] React.memo not applied to TimetableCell (performance at scale)
- [ ] No virtual scrolling for large timetables
- [ ] Conflict detection algorithm could be optimized for bulk operations
- [ ] No keyboard navigation (arrow keys) in grid cells
- [ ] Screen reader announcements missing

## Enhancements (Post-MVP)

- [ ] Drag-and-drop timetable editing with auto-suggestions
- [ ] Recurring event exceptions (holidays, special schedules)
- [ ] Teacher preference tracking for auto-scheduling
- [ ] Zustand store migration (from multiple useState)
- [ ] Virtual scrolling for large timetables
- [ ] Progressive loading strategy
- [ ] Copy schedule from previous term
- [ ] Grade-level and class-level schedule config overrides

---

**Last Review:** 2026-03-19
