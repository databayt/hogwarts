---
epic: 14
sprint: Q3-2026
title: School Marketing
file_type: claude
owner: Samia
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/327
docs: https://databayt.org
last_audited: 2026-06-13
---

# School Marketing Block

## Context

Public-facing school website on subdomain (e.g., `demo.databayt.org`). Includes homepage sections, admission portal, multi-step application form, visit booking, academic pages (93% complete). No blockers.

## Before You Start

1. Read `README.md` here for full file structure and key patterns
2. Read `ISSUE.md` here for priorities
3. If working on admission/application, also read the cross-block rule at `.claude/rules/blocks/admission.md`

## Key Decisions

- **Applying is ALWAYS FREE (2026-06-13)**: The wizard fees step is an informational free-application preview — payment method selection and gateway icons (Bankak/Kashi) are removed. Payment only happens post-acceptance: registration fee on offer acceptance + tuition invoices. Never add a payment gate to the application wizard.
- Single application flow via `application/` (context-based, 5 form steps: attachments → personal → location → academic → fees-preview + submit)
- Campaign-based admission: applications tied to `AdmissionCampaign` records with date windows
- Session-based drafts via `saveApplicationSession` / `resumeApplicationSession`; the apply wizard is auth-gated (login required), while OTP status tracking stays account-less
- OTP status tracking: sha256-hashed OTP; enumeration-oracle closed; atomic attempt counter. Applicants check status via email OTP (no account needed)
- Offer flow: callbackUrl preserves full token'd offer path through login; registration-fee success/fail banners shown post-acceptance
- All public portal writes (inquiry, tour, OTP, submit) are rate-limited
- Tour bookings: TOCTOU-safe seat counter; cancel/reschedule decrements by attendee count; `enableTourBooking` flag gates all entry points
- New-lead notifications (inquiry + tour booking) fire to ADMIN and STAFF roles
- All actions use `getTenantContext()` for schoolId resolution from subdomain
- Homepage sections are composed in `content.tsx` -- order matters for visual flow

## Danger Zones

- `visit/actions.ts` calls `sendEmail()` -- verify template exists in `@/lib/email` before modifying
- Session persistence in `application/` -- breaking auto-save loses applicant progress
- ALL UI text must use dictionary keys -- no hardcoded English. Forms: `dictionary.school.*.form.*`, toasts: `ToastHelper`, validation: `ValidationHelper`, server errors: error codes.

## Related Blocks

- [Dashboard Admission](../school-dashboard/admission/CLAUDE.md) -- admin reviews applications submitted here
- [Application](./application/CLAUDE.md) -- the multi-step application wizard (sub-block)
- [School Dashboard](../school-dashboard/CLAUDE.md) -- admin side of the same school

## After You Finish

1. Update `ISSUE.md` -- check off completed items, add new issues found
2. Update `README.md` -- if file structure changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: visit `demo.localhost:3000` as anonymous user
