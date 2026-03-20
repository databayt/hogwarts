# Grades — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Multi-step form (student/assignment selection then scoring)
- [x] Grade entry (score, max score, letter grade)
- [x] Percentage auto-calculation
- [x] Teacher feedback field
- [x] Search and filtering
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Integration with assignments
- [x] Score validation (score cannot exceed max score)
- [x] Bulk grade entry component
- [x] Grade detail view
- [ ] GPA calculation (term and cumulative)
- [ ] Report card generation
- [ ] Grade boundaries configuration

## Known Issues

### P1 — High

- [ ] GPA calculation engine not yet implemented
- [ ] Report card PDF generation not functional
- [ ] Grade boundaries not configurable per school
- [ ] Promotion/transcripts pages are stubs

### P2 — Medium

- [ ] No gradebook matrix view (students x assignments)
- [ ] Role-scoped access for teachers (view own classes only) needs verification
- [ ] No grade distribution charts

## Enhancements (Post-MVP)

- [ ] Gradebook matrix view with inline editing
- [ ] Weighted GPA (honors/AP courses)
- [ ] Report card batch generation and email delivery
- [ ] Honor roll identification
- [ ] At-risk student tracking
- [ ] Transcript generation
- [ ] Class rank calculation
- [ ] Progress reports (mid-term)
- [ ] Grade export to CSV

---

**Last Review:** 2026-03-19
