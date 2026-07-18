---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: readme
owner: Abdout
maturity: Built
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-06-13
---

## Admission (Dashboard) — School-side admission management pipeline

### Overview

Administrative dashboard for managing the full admission lifecycle: campaign creation, application review, merit list generation, student placement, and enrollment confirmation. Provides tabbed views for each stage of the admission funnel with DataTable-driven UIs, bulk operations, and RBAC-protected server actions.

This is a cross-block feature. The dashboard side (this block) handles admin review and enrollment. The marketing side (`school-marketing/admission/` + `school-marketing/application/`) handles the public-facing application wizard. Both share `prisma/models/admission.prisma`.

### Capabilities by Role

- **DEVELOPER / ADMIN**: Full access -- create/edit campaigns, review applications, enter scores, generate merit lists, confirm enrollment, manage settings, view leads
- **STAFF**: Review applications, update status, place students into classes, view leads
- **ACCOUNTANT**: View applications and leads (read-only tabs), record admission payments
- **TEACHER / STUDENT / GUARDIAN**: No admission access

### Routes

| Route                                                                  | Page               | Status                                       |
| ---------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission`                   | Campaigns list     | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications`      | Applications list  | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications/[id]` | Application detail | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/merit`             | Merit list         | Ready (score entry + weighted ranking)       |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/enrollment`        | Enrollment list    | Ready (PlacementDialog wired)                |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/settings`          | Admission settings | Partial — exposes ~12 of ~30 settings fields |

### File Structure

```
src/components/school-dashboard/admission/
├── actions.ts                      # Server actions (campaigns, applications, merit, enrollment, notifications, updateApplicationScores)
├── authorization.ts                # RBAC permission checks
├── permissions.ts                  # Tab/UI config per role (ACCOUNTANT now in VIEW_ROLES)
├── queries.ts                      # Read-only DB queries with filters/pagination/sorting
├── validation.ts                   # Zod schemas (campaign, application)
├── warning-messages.ts             # Enrollment warning message definitions
├── list-params.ts                  # Shared list parameter types
├── campaigns-content.tsx           # Campaigns tab (server component)
├── campaigns-columns.tsx           # Campaign DataTable column definitions
├── campaigns-table.tsx             # Campaign DataTable (client)
├── campaign-form.tsx               # Campaign create/edit form (client)
├── applications-content.tsx        # Applications tab (server component)
├── applications-columns.tsx        # Application DataTable column definitions
├── applications-table.tsx          # Application DataTable (client)
├── application-detail-content.tsx  # Single application detail view (server)
├── application-detail-actions.tsx  # Application detail action buttons (client)
├── merit-content.tsx               # Merit list tab (server component)
├── merit-columns.tsx               # Merit DataTable column definitions
├── merit-table.tsx                 # Merit DataTable (client)
├── score-entry-inline.tsx          # Inline entrance/interview score entry (client) [NEW]
├── enrollment-content.tsx          # Enrollment tab (server component)
├── enrollment-columns.tsx          # Enrollment DataTable column definitions
├── enrollment-table.tsx            # Enrollment DataTable (client) — PlacementDialog wired
├── placement-dialog.tsx            # Student placement dialog with seat counts (client)
├── access-denied.tsx               # Role-gated tab denial panel (shared)
├── settings-content.tsx            # Admission settings (client component)
├── leads/                          # Leads tab [NEW]
│   ├── leads-content.tsx           # Leads tab server component (inquiries + tour bookings)
│   ├── leads-columns.tsx           # Leads DataTable column definitions
│   └── leads-table.tsx             # Leads DataTable with status/follow-up/convert actions
├── settings/
│   ├── actions.ts                  # Settings server actions
│   ├── validation.ts               # Settings validation schemas
│   └── __tests__/actions.test.ts   # Settings action tests
├── ai/
│   ├── types.ts                    # AI document types (classification, extraction, merit)
│   ├── schemas.ts                  # Zod schemas for AI structured output
│   ├── prompts.ts                  # AI system prompts
│   ├── classify.ts                 # Claude Vision document classification (budget-gated + RBAC)
│   ├── actions.ts                  # AI processing server actions (RBAC-gated)
│   ├── bank-receipt-schema.ts      # Bank receipt extraction schema (optional fields)
│   ├── document-review-panel.tsx   # Document review UI (client)
│   └── documents-section.tsx       # Documents section wrapper (client)
└── __tests__/
    ├── actions.test.ts                     # Main action tests
    ├── validation.test.ts                  # Validation tests
    ├── enrollment-notifications.test.ts    # Notification tests
    ├── enrollment-pipeline.test.ts         # Pipeline tests
    └── offer-expiry.test.ts               # Offer expiry tests
```

### Status

**Completion:** ~90% | **Status:** 🟢 production-ready core (audited 2026-06-13)

Full admit→accept→pay→enroll→fee pipeline verified. Merit ranking (score entry + weighted 60/40), AI document cron, PlacementDialog, Leads tab, ACCOUNTANT RBAC, tour TOCTOU, OTP hardening, all public writes rate-limited, webhook retry-on-catch, multi-installment amortization all shipped. Remaining open: server-side search on merit/enrollment tables, WhatsApp breadth (BUG-10), issue #269, `Application.lang` field (schema flag). See `ISSUE.md`.

### Integration Points

- `src/components/school-marketing/admission/` -- public-facing admission pages, inquiry forms, tour booking (oversell-safe, rate-limited, OTP hashed)
- `src/components/school-marketing/application/` -- multi-step student application wizard (fees step is informational — applying is always free; payment only at registration-fee + tuition stages)
- `ai/` subsystem -- Claude document classification/extraction/completeness/merit-scoring + bank-receipt OCR. Drained by `/api/cron/process-document-jobs` (\*/10 min); budget-gated + RBAC-gated.
- `/api/cron/process-document-jobs` -- new cron (\*/10) that processes the document-extraction queue
- `/api/cron/fee-due` -- daily cron for upcoming-due + offer-expiry reminders
- `/api/cron/fee-overdue` -- per-tenant OVERDUE mirror to `UserInvoice`
- `src/lib/enrollment-sync.ts` -- auto-enroll placed students into grade classes
- `src/lib/dispatch-notification.ts` -- notification dispatch on status changes; new-lead notifications to ADMIN+STAFF
- `src/app/api/webhooks/stripe/route.ts` + `tap/route.ts` -- retry-on-catch, multi-installment `amountPaid`/PARTIAL, `checkout.session.expired` clears stuck admission state
- `prisma/models/admission.prisma` -- 9 models: AdmissionCampaign, Application, Communication, AdmissionInquiry, AdmissionTimeSlot, TourBooking, ApplicationSession, AdmissionSettings, AdmissionOTP
- `prisma/models/invoices.prisma` -- `InvoiceStatus +PARTIAL`, `UserInvoice +amountPaid +sentAt`; new indexes on `AdmissionInquiry`/`ApplicationSession(convertedToApplicationId)`

### Agents & Skills

- `agent:hogwarts` — admission domain expert
- `agent:react` — wizard step components
- `agent:nextjs` — App Router segments + server actions
- `skill:/wire` — UI layer sweep
- `skill:/report` — auto-fix pilot-reported friction
