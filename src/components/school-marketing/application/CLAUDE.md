# Application Block (School Marketing)

## Context

Public multi-step application form for prospective students (5 steps: attachments, personal, location, academic, fees — guardian folded into personal tabs, contact removed). Session-based auto-save. Login required (auth-gated `(auth)/layout.tsx`); the OTP status tracker is account-less.

## Before You Start

1. Read parent `../README.md` for full school-marketing structure
2. Read parent `../ISSUE.md` for known issues
3. Read `application-context.tsx` for state management pattern
4. Read `validation-helpers.ts` for cross-step validation

## Key Decisions

- `ApplicationContext` (React context) manages all form state across steps -- injected at layout level
- Login required to apply (auth-gated `(auth)/layout.tsx`); drafts are scoped per user (`hogwarts_apply_session_{campaignId}_{userId}`). Sessions still saved server-side via `saveApplicationSession` for cross-device resume
- Each step subdirectory follows: `form.tsx`, `config.ts`, `types.ts`, `validation.ts`, optional `actions.ts`
- This is the only application flow (old `admission/steps/` was removed)
- Payment supports card, cash, and bank transfer -- payment step is optional based on campaign config
- Submission happens on the **Fees** step (final): it assembles the `documents[]` array from attachment URLs, then `submit-action.ts` validates required fields before creating the `Application` record

## Danger Zones

- `application-context.tsx` -- shared state for all steps; breaking this breaks the entire wizard
- `validation-helpers.ts` -- cross-step validation; changes affect which steps show as valid/invalid
- File uploads in `attachments/` -- S3 integration; broken uploads block submission
- Payment flow -- three payment methods with different server actions; test all three paths

## Related Blocks

- [Dashboard Admission](../../school-dashboard/admission/CLAUDE.md) -- admin reviews applications submitted here
- [School Marketing Admission](../admission/CLAUDE.md) -- admission landing page links to this form

## After You Finish

1. Update parent `../ISSUE.md` -- check off completed items, add new issues
2. Update parent `../README.md` -- if file structure changed
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Test: `applicant@databayt.org` (pw: 1234) on `demo.localhost:3000/application`
