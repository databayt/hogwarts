# Teachers — Production Readiness Tracker

**Status:** 🟢 READY
**Completion:** 85%
**Last Updated:** 2026-10-03

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] CSV bulk import with error reporting
- [x] Department assignments (TeacherDepartment many-to-many)
- [x] Class and subject assignments
- [x] Contact information management
- [x] Search and filtering (name, email, status)
- [x] Export to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Multi-step wizard form (information, contact, employment, qualifications, expertise, experience, location, attachments, photo)
- [x] Server-side pagination and sorting
- [x] Row actions (View, Edit, Delete)
- [x] RBAC authorization checks
- [ ] Loading skeletons and empty states

## Fixed 2026-10-03 (wizard, f29c39a22)

- One-word names (full-name schools) save and finish; the server no longer requires a last name
- A blank employee number is stored as NULL. `""` made every later teacher without a number fail at Create (unique per school)
- Every wizard action returns an `ACTION_ERRORS` code, and toasts are translated (no Zod JSON, Prisma text or English literals)
- Create from the step or the footer goes through `wizard/finish.ts`: a failure toasts and stays put, and success shows "Teacher added"
- Birth-date picker has month/year dropdowns (1940 → today) — #426, 190a60a6c. #427 ("details not saved") was the one-word-name failure above
- Open: a full name of three or more words drops the middle words (the teacher model has no middleName; "أحمد محمد علي" saves as "أحمد علي"); the experience/employment date pickers still have no year dropdown; the gender select defaults to Male on a new draft; the main teacher create/update in `actions.ts` (outside the wizard) still saves `employeeId` as given; grade chips read "G1…G12" in Arabic

## Known Issues

### P1 — High

- [ ] Qualification tracking needs UI polish (degrees, certifications)
- [ ] Teaching load analytics not yet calculated from timetable

### P2 — Medium

- [ ] Performance page is a stub route
- [ ] No document expiry tracking for certificates/licenses
- [ ] Settings page incomplete

## Enhancements (Post-MVP)

- [ ] Teaching load analytics (periods per week, contact hours)
- [ ] Leave management system
- [ ] Performance review tracking
- [ ] Professional development tracking
- [ ] Substitute teacher assignment workflow
- [ ] Bulk department/status operations

---

**Last Review:** 2026-03-19
