# Application Block (School Marketing)

## Context

Public multi-step application form for prospective students (5 steps: attachments, personal, location, academic, fees-preview — guardian folded into personal tabs, contact removed). Session-based auto-save. Login required (auth-gated `(auth)/layout.tsx`); the OTP status tracker is account-less.

**Last updated:** 2026-06-13

## Before You Start

1. Read parent `../README.md` for full school-marketing structure
2. Read parent `../ISSUE.md` for known issues
3. Read `application-context.tsx` for state management pattern
4. Read `validation-helpers.ts` for cross-step validation

## Key Decisions

- **APPLYING IS ALWAYS FREE (2026-06-13 — product decision, do not revert)**: The fees step collects NO payment and presents NO payment method UI. Submission fires at the end of this step. Payment only happens post-acceptance: registration fee on offer acceptance + tuition invoices via fee assignments. Never re-introduce a payment gate here.
- **Fees step shows term/year grade tuition (2026-07-12)**: No "applying is free" banner — free is the baseline, not advertised. The step shows the selected grade's tuition for the academic year (per-grade auto-generated FeeStructure inheriting `School.tuitionFee` until a PricingRule customizes it), installment options, and a "discounts and scholarships may apply" line that opens a dialog (scholarships list, early-payment hint, estimate disclaimer). `getApplicationFeePreview` self-heals fee provisioning when a school has grades + tuitionFee but zero structures.
- `ApplicationContext` (React context) manages all form state across steps -- injected at layout level
- Login required to apply (auth-gated `(auth)/layout.tsx`); drafts are scoped per user (`hogwarts_apply_session_{campaignId}_{userId}`). Sessions still saved server-side via `saveApplicationSession` for cross-device resume
- callbackUrl preserves the full token'd offer path through the login redirect so applicants land directly on their offer after signing in
- Each step subdirectory follows: `form.tsx`, `config.ts`, `types.ts`, `validation.ts`, optional `actions.ts`
- This is the only application flow (old `admission/steps/` was removed)
- Submission happens on the **Fees** step (final): it assembles the `documents[]` array from attachment URLs, then `submit-action.ts` validates required fields before creating the `Application` record
- Success modal labels the generated credential 'Application Tracking Code' (not 'password')

## Danger Zones

- `application-context.tsx` -- shared state for all steps; breaking this breaks the entire wizard
- `validation-helpers.ts` -- cross-step validation; changes affect which steps show as valid/invalid
- File uploads in `attachments/` -- S3 integration; broken uploads block submission
- Fees step -- preview only; do NOT add payment collection here (product decision above)
- `payment/content.tsx` is now effectively dead (application is always free); clean up carefully, verify no runtime imports before deleting

## Related Blocks

- [Dashboard Admission](../../school-dashboard/admission/CLAUDE.md) -- admin reviews applications submitted here
- [School Marketing Admission](../admission/CLAUDE.md) -- admission landing page links to this form

## After You Finish

1. Update parent `../ISSUE.md` -- check off completed items, add new issues
2. Update parent `../README.md` -- if file structure changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `applicant@databayt.org` (pw: 1234) on `demo.localhost:3000/application`
