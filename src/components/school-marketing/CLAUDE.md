# School Marketing Block

## Context

Public-facing school website on subdomain (e.g., `demo.databayt.org`). Includes homepage sections, admission portal, multi-step application form, visit booking, academic pages (90% complete). No blockers.

## Before You Start

1. Read `README.md` here for full file structure and key patterns
2. Read `ISSUE.md` here for priorities
3. If working on admission/application, also read the cross-block rule at `.claude/rules/blocks/admission.md`

## Key Decisions

- Single application flow via `application/` (context-based, 5 form steps incl. fees + payment + success)
- Campaign-based admission: applications tied to `AdmissionCampaign` records with date windows
- Session-based drafts via `saveApplicationSession` / `resumeApplicationSession`; the apply wizard is auth-gated (login required), while OTP status tracking stays account-less
- OTP status tracking: applicants check status via email OTP (no account needed)
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
