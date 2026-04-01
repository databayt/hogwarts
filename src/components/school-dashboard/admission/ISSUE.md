# Admission (Dashboard) — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 95%
**Last Updated:** 2026-04-01

---

## MVP Checklist

- [x] Campaign CRUD (create, read, update, delete)
- [x] Application list with search, filters, pagination
- [x] Application detail view with status display
- [x] Application status transitions (submit, review, shortlist, admit, reject)
- [x] Merit list generation and display
- [x] Enrollment list with offer/fee/document status
- [x] Student placement dialog (assign to grade/class)
- [x] Bulk placement operations
- [x] Admission settings page
- [x] RBAC authorization (ADMIN, STAFF, ACCOUNTANT)
- [x] Zod validation schemas
- [x] Unit tests for actions and validation
- [x] Email notifications on status changes (immediate via dispatchAdmissionNotification)
- [ ] Application fee payment integration verification

## Known Issues

### P0 — Critical

- None

### P1 — High

- ~~Email notifications for status transitions~~ (DONE — immediate sending via dispatchAdmissionNotification)
- Payment recording flow for application fees needs integration testing with payment block

### P2 — Medium

- Bulk placement could benefit from progress indicator for large batches
- Merit list sorting criteria should be configurable per campaign

## Enhancements (Post-MVP)

- Dashboard analytics: admission funnel conversion metrics
- Export applications to CSV/Excel
- Automated waitlist management (auto-offer when seats free up)
- Interview/entrance exam scheduling integration
- Document verification workflow with checklist
- Parent portal for application status tracking (currently in school-marketing)

---

**Last Review:** 2026-03-19
