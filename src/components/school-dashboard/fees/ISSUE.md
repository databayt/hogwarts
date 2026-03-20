# Fees — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 25%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Fee dashboard UI scaffolding with tabs
- [x] Validation schemas (Zod)
- [x] Type definitions
- [x] Action stubs
- [x] Unit tests for validation and actions
- [ ] Fee structure configuration (CRUD)
- [ ] Payment collection system
- [ ] Outstanding fee tracking
- [ ] Discount and scholarship management
- [ ] Refund processing
- [ ] Financial reporting
- [ ] Payment gateway integration (Stripe)

## Known Issues

### P0 -- Critical

None

### P1 -- High

- Payment gateway integration not started -- required for online fee collection
- Database schema for fee models proposed but not yet migrated to Prisma

### P2 -- Medium

- Receipt generation not implemented
- No automated payment reminders
- Financial report export (PDF/Excel) not built
- Role-based access (accountant vs admin vs parent) not fully enforced

## Enhancements (Post-MVP)

- [ ] Multiple payment gateway support (Stripe, Razorpay, bank transfer)
- [ ] Recurring payment / auto-debit setup
- [ ] Multi-currency support
- [ ] Late fee auto-calculation
- [ ] Parent portal fee view and payment
- [ ] Bulk fee collection
- [ ] Bank reconciliation tools
- [ ] Accounting software sync

---

**Last Review:** 2026-03-19
