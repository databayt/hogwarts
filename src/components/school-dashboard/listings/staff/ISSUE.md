# Staff -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 80%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Staff CRUD operations with Zod validation
- [x] Staff information form (name, email, position, department)
- [x] Employment status tracking (Active, On Leave, Terminated, Retired)
- [x] Employment type tracking (Full Time, Part Time, Contract, Temporary)
- [x] Department assignment via `departmentId`
- [x] User account linking (optional `userId`)
- [x] Email uniqueness per school (`@@unique([emailAddress, schoolId])`)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] RBAC authorization
- [x] Table with search, sort, filter, pagination
- [x] Centralized queries (`queries.ts`)
- [ ] CSV export
- [ ] Duplicate email detection warning (beyond unique constraint error)

## Known Issues

### P0 -- Critical

_None_

### P1 -- High

- [ ] No wizard flow (single-step form only; other listings use multi-step wizards)

### P2 -- Medium

- [ ] No staff detail sub-pages (employment history, documents)
- [ ] Bulk import from CSV not supported

## Enhancements (Post-MVP)

- [ ] Multi-step wizard for staff onboarding (personal info, employment details, documents)
- [ ] Leave management (request, approval, balance tracking)
- [ ] Attendance tracking (check-in/check-out, late arrival)
- [ ] Document management (contracts, IDs, certifications with expiry alerts)
- [ ] Department hierarchy and organization chart
- [ ] Performance review cycles
- [ ] Payroll integration (salary, payslips, tax)
- [ ] Staff card / grid view
- [ ] CSV export and bulk import
- [ ] Bulk status updates

---

**Last Review:** 2026-03-19
