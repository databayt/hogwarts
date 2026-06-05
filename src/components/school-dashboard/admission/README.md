---
epic: 02
sprint: Q3-2026
title: Admission (school dashboard)
file_type: readme
owner: Abdout
maturity: Built
completion: 60
tracker: https://github.com/databayt/hogwarts/issues/314
docs: https://ed.databayt.org/en/docs/admission
last_audited: 2026-05-25
---

## Admission (Dashboard) — School-side admission management pipeline

### Overview

Administrative dashboard for managing the full admission lifecycle: campaign creation, application review, merit list generation, student placement, and enrollment confirmation. Provides tabbed views for each stage of the admission funnel with DataTable-driven UIs, bulk operations, and RBAC-protected server actions.

This is a cross-block feature. The dashboard side (this block) handles admin review and enrollment. The marketing side (`school-marketing/admission/` + `school-marketing/application/`) handles the public-facing application wizard. Both share `prisma/models/admission.prisma`.

### Capabilities by Role

- **DEVELOPER / ADMIN**: Full access -- create/edit campaigns, review applications, generate merit lists, confirm enrollment, manage settings
- **STAFF**: Review applications, update status, place students into classes
- **ACCOUNTANT**: View applications, record admission payments
- **TEACHER / STUDENT / GUARDIAN**: No admission access

### Routes

| Route                                                                  | Page               | Status                                       |
| ---------------------------------------------------------------------- | ------------------ | -------------------------------------------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission`                   | Campaigns list     | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications`      | Applications list  | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/applications/[id]` | Application detail | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/merit`             | Merit list         | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/enrollment`        | Enrollment list    | Ready                                        |
| `/{lang}/s/{subdomain}/(school-dashboard)/admission/settings`          | Admission settings | Partial — exposes ~12 of ~30 settings fields |

> Pages all render, but: **Merit** ranks by an uncomputed score (P0-3); **Enrollment** has no reachable section-placement UI (P1-7). See `ISSUE.md`.

### File Structure

```
src/components/school-dashboard/admission/
├── actions.ts                      # Server actions (campaigns, applications, merit, enrollment, notifications)
├── authorization.ts                # RBAC permission checks
├── queries.ts                      # Read-only DB queries with filters/pagination/sorting
├── validation.ts                   # Zod schemas (campaign, application)
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
├── enrollment-content.tsx          # Enrollment tab (server component)
├── enrollment-columns.tsx          # Enrollment DataTable column definitions
├── enrollment-table.tsx            # Enrollment DataTable (client)
├── placement-dialog.tsx            # Student placement dialog (client)
├── bulk-placement.tsx              # Bulk placement operations (client)
├── settings-content.tsx            # Admission settings (server component)
├── settings/
│   ├── actions.ts                  # Settings server actions
│   ├── validation.ts               # Settings validation schemas
│   └── __tests__/actions.test.ts   # Settings action tests
├── ai/
│   ├── types.ts                    # AI document types (classification, extraction, merit)
│   ├── schemas.ts                  # Zod schemas for AI structured output
│   ├── prompts.ts                  # AI system prompts
│   ├── classify.ts                 # Claude Vision document classification
│   ├── completeness.ts             # Document completeness checker
│   ├── merit-engine.ts             # Weighted merit score computation
│   ├── actions.ts                  # AI processing server actions
│   ├── bank-receipt-schema.ts      # Bank receipt extraction schema
│   ├── bank-receipt-actions.ts     # Bank receipt processing actions
│   ├── document-review-panel.tsx   # Document review UI (client)
│   ├── document-card.tsx           # Individual document card (client)
│   └── documents-section.tsx       # Documents section wrapper (client)
└── __tests__/
    ├── actions.test.ts                     # Main action tests
    ├── validation.test.ts                  # Validation tests
    ├── enrollment-notifications.test.ts    # Notification tests
    ├── enrollment-pipeline.test.ts         # Pipeline tests
    └── offer-expiry.test.ts               # Offer expiry tests
```

### Status

**Completion:** ~70% | **Status:** 🔴 NOT production-ready (audited 2026-05-21)

Core CRUD/review/enrollment work, but 3 flagship flows are broken: offer acceptance (empty accessToken + login wall), merit ranking (ranks by a never-computed score), and the AI document pipeline (built but never executes — no cron, UI unrendered). See `ISSUE.md` for the full P0/P1/P2 tracker and remediation order.

### Integration Points

- `src/components/school-marketing/admission/` -- public-facing admission pages, inquiry forms, tour booking
- `src/components/school-marketing/application/` -- multi-step student application wizard (5 active steps: attachments → personal → location → academic → fees; + payment, offer, success)
- `ai/` subsystem -- Claude document classification/extraction/completeness/merit-scoring + bank-receipt OCR. **Built but disconnected** (no `document-processing` cron, `document-card.tsx` unrendered) — see ISSUE.md P1-1
- `src/lib/enrollment-sync.ts` -- auto-enroll placed students into grade classes
- `src/lib/dispatch-notification.ts` -- notification dispatch on status changes
- `prisma/models/admission.prisma` -- 9 models: AdmissionCampaign, Application, Communication, AdmissionInquiry, AdmissionTimeSlot, TourBooking, ApplicationSession, AdmissionSettings, AdmissionOTP

### Agents & Skills

- `agent:hogwarts` — admission domain expert
- `agent:react` — wizard step components
- `agent:nextjs` — App Router segments + server actions
- `skill:/wire` — UI layer sweep
- `skill:/report` — auto-fix pilot-reported friction
