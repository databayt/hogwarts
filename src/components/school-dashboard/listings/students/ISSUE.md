# Students — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] CSV bulk import with error reporting
- [x] Class enrollment management (many-to-many via StudentClass)
- [x] Guardian relationships (StudentGuardian linking) -- RESOLVED 2026-03-13
- [x] Search and filtering (name, status, class)
- [x] Export student data to CSV
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Server-side pagination and sorting
- [x] Multi-step wizard add form (personal, contact, enrollment, location, health, prev-ed, attachments, photo)
- [x] Row actions (View, Edit, Delete with confirmation dialog)
- [x] Breadcrumb with student name on detail page
- [x] RBAC authorization checks
- [ ] Loading skeletons and empty states
- [ ] Photo upload and avatar display

## Known Issues

### P1 — High

- [ ] Photo upload not yet functional (wizard step exists, storage not wired)
- [ ] Document attachments step exists but file storage not wired

### P2 — Medium

- [ ] Performance/analysis/reports pages are stub routes
- [ ] className filter not yet mapped to Prisma where clause in content.tsx
- [ ] No loading skeletons for table

## Enhancements (Post-MVP)

- [ ] Bulk class assignment (select multiple students)
- [ ] Status change history log with timestamps
- [ ] Academic history tracking
- [ ] Health records integration
- [ ] Attendance summary per student
- [ ] Grade progression tracking
- [ ] Transfer between schools

---

**Last Review:** 2026-03-19
