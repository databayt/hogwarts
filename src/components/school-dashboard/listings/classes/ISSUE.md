# Classes — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Homeroom teacher assignment (teacherId on Class)
- [x] Student enrollment (many-to-many via StudentClass)
- [x] Subject linking per class
- [x] Capacity limits configuration
- [x] Search and filtering (name, subject, teacher, term)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Multi-step wizard form (information, schedule, management)
- [x] Timetable integration (term, periods, classroom)
- [x] Class detail view
- [x] Subject teacher assignment UI (`subject-teachers.tsx` exists)
- [x] Course management UI
- [ ] Subject teacher server actions fully wired
- [ ] Loading skeletons and empty states

## Known Issues

### P0 — Critical

None.

### P1 — High

- [ ] Subject teacher assignment: UI component exists (`subject-teachers.tsx`) but `assignSubjectTeacher` / `removeSubjectTeacher` actions may not be fully wired
- [ ] Teacher availability validation (conflict detection) not implemented

### P2 — Medium

- [ ] No visual enrollment capacity indicators (progress bars)
- [ ] Class performance analytics not yet implemented
- [ ] Attendance summary per class not yet implemented

## Enhancements (Post-MVP)

- [ ] Seating arrangement management
- [ ] Waitlist functionality for full classes
- [ ] Bulk enrollment from student list
- [ ] Transfer wizard (move students between classes)
- [ ] Class-specific announcement board
- [ ] Schedule export to PDF/iCal
- [ ] Class cards view (alternative to table)

---

**Last Review:** 2026-03-19
