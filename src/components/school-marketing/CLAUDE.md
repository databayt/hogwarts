# School Marketing Block

## Context

Public-facing school website on subdomain (e.g., `demo.databayt.org`). Includes homepage sections, admission portal, multi-step apply form, visit booking, academic pages (85% complete). Blocker: hardcoded English validation messages.

## Before You Start

1. Read `README.md` here for full file structure and key patterns
2. Read `ISSUE.md` here for priorities (P1: hardcoded validation messages, two parallel application flows)
3. If working on admission/apply, also read the cross-block rule at `.claude/rules/blocks/admission.md`

## Key Decisions

- Two parallel application flows exist: `admission/steps/` (older) and `application/` (newer, context-based). Migration path is P1
- Campaign-based admission: applications tied to `AdmissionCampaign` records with date windows
- Session-based drafts via `saveApplicationSession` / `resumeApplicationSession` -- no login required
- OTP status tracking: applicants check status via email OTP (no account needed)
- All actions use `getTenantContext()` for schoolId resolution from subdomain
- Homepage sections are composed in `content.tsx` -- order matters for visual flow

## Danger Zones

- `admission/validation.ts` -- `getValidationMessages()` has unused `_dictionary` param; errors show English-only
- Two application flows (`admission/steps/` vs `application/`) -- editing the wrong one wastes effort
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
