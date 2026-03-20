## Fees — Financial Management System

### Overview

Financial management module for school fee collection, payment tracking, fee structure configuration, scholarships, discounts, and refunds. Currently in planning/early implementation stage with validation schemas, action stubs, and basic UI components scaffolded. Multi-tenant scoped with `schoolId` on all financial records.

### File Structure

```
src/components/school-dashboard/fees/
├── content.tsx                     # Fee dashboard with tab navigation
├── dashboard.tsx                   # Dashboard statistics overview
├── management.tsx                  # Fee management interface
├── fee-structures-list.tsx         # Fee structure listing
├── payments-list.tsx               # Payment history listing
├── scholarships-list.tsx           # Scholarship listing
├── refunds-list.tsx                # Refund listing
├── actions.ts                      # Server actions for fee operations
├── validation.ts                   # Zod schemas for fee data
├── types.ts                        # TypeScript type definitions
├── __tests__/
│   ├── actions.test.ts             # Action tests
│   └── validation.test.ts         # Validation tests
├── README.md
└── ISSUE.md
```

### Status

**Completion:** 25% | **Blockers:** Payment gateway integration not started

UI scaffolding and validation schemas in place. Core payment processing, gateway integration, and financial reporting not yet implemented.

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/fees/`
- **Students**: Fee assignment on enrollment
- **Admission**: Admission fee collection and verification
- **Stripe/Payment Gateway**: Future integration for online payments
- **Prisma Models**: Fee-related models in prisma schema (proposed, not yet migrated)
