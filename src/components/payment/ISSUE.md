# Payment — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 93%
**Last Updated:** 2026-07-17
**Source of truth:** [hogwarts#356](https://github.com/databayt/hogwarts/issues/356) (Aldar UAE payment readiness)

---

## Sudan rails: Bankak + Cashi (2026-07-17) — NOT deployed

**The bug this fixed:** a Sudan school (`country=SD`, `currency=SDG`) had **no
working payment path at all**. `fee-payment-methods.tsx:54` filtered the parent's
picker to `tap | stripe | bankak`; SD's list is wallet-first; and `bankak.ts` was
an env-gated scaffold whose `isConfigured()` required a `BANKAK_MERCHANT_ID` that
was never issued — so `resolveAvailableMethods` dropped it and the picker rendered
**empty**. Stripe rejects SDG and Tap doesn't cover SD, so there was no card rail
either. Admission's registration fee dead-ended the same way: account number +
reference, then no way to prove payment.

**Why manual, not an API:** neither Bank of Khartoum nor Cashi publishes a
self-serve merchant API. BoK sells "Bankak Pay QR"; Cashi is a CBoS-licensed QR
network with the MyCashi wallet; both confirm inside the merchant's own app, not
via webhook. The only Bankak "gateway" in the wild (WC-Sudan-Payment-Gateway) is
explicitly manual. So the manual rail IS the real rail — not a fallback.

- [x] `providers/bankak.ts` rewritten from permanently-false scaffold → manual rail
      (`isConfigured()`/`supportsCurrency()` → true, like `cash.ts`/`bank-transfer.ts`)
- [x] `providers/cashi.ts` — new sibling rail (MyCashi / Cashi merchant code)
- [x] `providers/mobile-money.ts` **deleted** — confirmed dead: nothing ever set
      `metadata.mobileMoneyInstructions`, so it could only ever render blank
      instructions. `SD` list is now `[bankak, cashi, cash, bank_transfer]`
- [x] `PAYMENT_GATEWAYS` const in `types.ts` is now the single source for the union
      **and** the Zod enum — the hand-duplicated enum in `payment-block-actions.ts`
      is how `mobile_money` survived in a validator after its provider died
- [x] `WalletDetails` type + `WalletConfirmation` — renders the school's real
      account/QR, replacing the generic "open your app" placeholder
- [x] `SchoolPaymentSettings` model (school-scoped, NOT AdmissionSettings: both
      admission and finance consume these rails) + admin UI at
      `/finance/settings/payment` + `filterConfiguredManualRails` per-school gating
      (`isConfigured()` is env-level and takes no schoolId — gating is a post-filter,
      exactly how `enableOnlinePayment` already gates online rails)
- [x] `submitManualPaymentProof` — the missing payer-side leg. Ownership-gated
      (not `requireFeePermission`; a parent files this), lands `PENDING_VERIFICATION`,
      P2002 on `@@unique([schoolId, transactionId])` → `PAYMENT_REFERENCE_ALREADY_USED`
- [x] Receipt queued to the EXISTING `bank_receipt` handler via
      `createProcessingJob` (drained by `/api/cron/process-document-jobs`) — no new
      AI plumbing, no new cron
- [x] **`markPaymentCleared` needed zero changes** — it already posts the ledger,
      syncs the invoice, and notifies. The gap was only ever upstream.

**Bug found + fixed en route:** `createFeePaymentCheckout` took
`availableGateways[0]` and ignored the clicked rail — on a multi-rail school
(AE = `[tap, stripe]`) clicking "Stripe" silently charged via Tap. It now takes
the requested gateway and re-resolves it server-side, refusing rather than
downgrading, and rejects manual rails (which have no checkout URL).

### Browser QA (2026-07-17, `demo.localhost:3000/ar`, SD/SDG school)

Verified live: the fee-assignment picker now renders **بنكك + كاشي** where it
previously rendered nothing; the Bankak dialog resolves the school's real account,
amount (`28,000.00 ج.س.`), generated reference (`FEE-…`), and the school's own
Arabic instructions. Settings round-trip to the DB with Arabic intact.

Three bugs that **only the browser caught** (tsc + unit tests were green throughout):

1. `startTransition` called from the render body of `manual-payment-rail.tsx` →
   "Cannot call startTransition while rendering", tore the dialog down. Moved to
   an effect.
2. The replacement effect listed `isLoading` in its **deps while setting it** →
   React fired that run's own cleanup on the state flip, `cancelled = true`
   discarded the in-flight response, spinner forever. Deps are now only the
   inputs that should retrigger a fetch (`open`, `feeAssignmentId`, `gateway`).
3. Settings UI rendered English on `/ar`. The keys had been added to
   `school-{en,ar}.json` — but `finance.*` is served from
   `dictionaries/{ar,en}/finance.json`; the `school-*.json` copy is a **stale
   duplicate nothing reads** (`finance.bankingPage.dashboard` isn't even in it,
   yet that tab renders Arabic). Keys moved to the live file.

Route moved (Abdout, mid-session): `/finance/settings/payment` →
**`/finance/banking/payment-methods`**, a tab on the existing banking `PageNav`.

**Blocked locally, NOT a code defect — S3 bucket CORS.** The receipt PUT is
preflight-rejected (`OPTIONS → 403`) because `hogwarts-databayt`'s allowlist is
`https://ed.databayt.org` / `https://*.databayt.org` / `http://localhost:3000` —
and the dev origin is `http://demo.localhost:3000`, a _subdomain_ of localhost,
which `http://localhost:3000` does not match. Production school origins
(`https://<school>.databayt.org`) DO match `https://*.databayt.org`, so this is a
local-dev gap that equally affects the pre-existing video-upload route. To exercise
uploads locally, add `http://*.localhost:3000` to the bucket CORS (an AWS-side
change — not made). The server chain the preflight blocked is covered instead by
`src/tests/school-dashboard/finance/fees/manual-payment-proof.test.ts` (9 tests:
PENDING_VERIFICATION shape, gatewayMethod tagging, P2002 → replay guard, ownership
gate, uniform refusal, validation, AI queue, queue-failure tolerance).

### Still open on this pass

- [ ] Registration-fee mirror: add `bankak`/`cashi` to
      `MANUALLY_CONFIRMABLE_REGISTRATION_METHODS` (`admission/actions.ts:1854`) +
      `RBANKAK-`/`RCASHI-` intents writing `Application.registrationFeeProofUrl`
- [ ] Sudan-ize `admission/ai/bank-receipt-schema.ts` — still Saudi-tuned
      (defaults SAR, names Al Rajhi/SNB/Riyad Bank, Hijri). Add a Sudan paragraph
      beside the Saudi one; drop the hardcoded `.default("SAR")`
- [ ] Verify screen: show extracted fields beside the proof with a match indicator
- [x] **Invoice-allocation bug — FIXED 2026-07-17.** Was four diverging copies on
      two bases: `recordPayment` allocated against **`sub_total`** (the money bug —
      a taxed/discounted invoice flipped to PAID once sub_total was covered even
      though `total` was still owed, and stored the wrong `amountPaid`);
      `markPaymentCleared` had a weaker single-`findFirst` blind PAID/UNPAID flip
      that never set `amountPaid` and lost `PARTIAL` (so a partial Bankak/Cashi
      transfer erased its own partial state); the Stripe + Tap webhooks each had
      their own correct-but-separate `total` loop. Now one shared
      `finance/lib/invoice-allocation.ts` `allocatePaymentToInvoices(schoolId,
feeAssignmentId, paymentAmount)` — **incremental** (matches the proven webhook
      logic; excludes PAID/CANCELLED so it never downgrades an invoice settled via
      another path; allocates against `total`), imported at all four sites. 12 unit
      tests incl. a regression guard verified to fail on the old `sub_total` logic,
      plus a throwaway real-Prisma integration check (payment 105 on a sub_total-100
      / total-110 invoice → PARTIAL 105, not the old PAID 100).

---

## MVP Checklist

### UI Components

- [x] PaymentBlock orchestrator (gateway selection, initiation, confirmation flow) — generic, retained for admission/SaaS contexts
- [x] PaymentMethodCard (per-gateway card with display name/icon)
- [x] PaymentSummary (formatted amount with RTL/LTR locale support)
- [x] PaymentConfirmation (success view with checkout result details)
- [x] FeePaymentMethods (Aldar P0.4 — fee-specific parent picker, tighter ownership check via `createFeePaymentCheckout`)

### Server Actions

- [x] `initiatePayment` with Zod validation
- [x] PaymentTransaction record creation in database
- [x] Delegation to `createPaymentCheckout` provider
- [x] Multi-tenant scoping via `getTenantContext()`
- [x] `createFeePaymentCheckout` extended with optional gateway arg + region-aware routing (Aldar P0.4)
- [x] `markPaymentCleared` server action for offline-payment reconciliation (Aldar P2.1) — `fees:approve` permission, idempotent, `$transaction`-wrapped

### Gateway Support

- [x] Stripe gateway — wallets auto-unlocked (Aldar P0.3 dropped the `payment_method_types: ["card"]` hardcode); Apple Pay + Google Pay surface when Dashboard supports them
- [x] Tap gateway — real integration, AE-first routing, source.payment_method mapped to enum (Aldar P1.3 + P1.4); webhook signature now fails-closed (P1.2)
- [x] Cash gateway
- [x] Bank transfer gateway — full offline flow with deposit slip URL + bank branch + sender IBAN (Aldar P2.1)
- [x] ATM deposit gateway (Aldar P2.2 — new PaymentMethod.ATM_DEPOSIT enum value + form variant)
- [x] Mobile money gateway
- [ ] Bankak gateway — still stub pending Bank of Khartoum API spec (SD-only)

### Validation

- [x] Zod schema for `initiatePayment` (gateway, amount, currency, context, URLs)
- [x] Optional line items and metadata validation
- [x] Customer email validation

### i18n

- [x] RTL-aware currency formatting (Aldar P0.1 — `formatCurrency` requires currency arg)
- [x] Locale-aware summary display
- [x] Localized gateway names and instructions (Aldar P3.4 — Apple Pay / Google Pay / mada / KNET en + ar)
- [x] AED end-to-end audit complete (Aldar P0.1–P0.5)

---

## Recent Work (2026-06-13 — Admission+Finance production-readiness pass)

### Webhook Hardening

- [x] `catch` blocks in both `api/webhooks/stripe/route.ts` and `api/webhooks/tap/route.ts` now call `releaseDedupeAndFail` — webhook retries instead of silent 200 data-loss on handler crash
- [x] `checkout.session.expired` handler: clears stuck admission state (payment link expired → applicant can retry)
- [x] `payment_failed` notification is now language-aware (dispatched in the school's preferred language, not hardcoded English)
- [x] Multi-installment invoice allocation: on payment success, oldest-unpaid invoice credited first using new `UserInvoice.amountPaid` + `PARTIAL` status
- [x] Duplicate webhook handlers removed (conflicting Tap + Stripe duplicate event registrations cleaned up)
- [x] Tap `registration_fee` charge type now handled in the Tap webhook route
- [x] `receiptNumber` generation is now collision-safe (unique constraint + retry logic)
- [x] `createFeePaymentCheckout` is gateway-aware for UAE: auto-routes to Tap for AED currency schools

### Receipt

- [x] Receipt PDF route (`/api/payment/[paymentId]/receipt`) is now status-guarded (only PAID/CLEARED payments), i18n-ready, and includes school name + currency
- [x] Receipt link surfaced in payment metadata and in the my-fees view

### Admission — Fee Stage (PRODUCT DECISION: applying is always free)

- [x] Application wizard fees step is now an informational preview only — no payment-method selection, no bankak/kashi icons; payment happens only after offer acceptance
- [x] `payment` route in the application flow redirects appropriately; success modal label changed from "password" to "Application Tracking Code"
- [x] `callbackUrl` now preserves the full token'd offer path through login so the registration-fee page is reachable after redirect
- [x] Registration-fee success/fail banners shown on the offer page
- [x] Offer payment flow is rate-limited; abandoned-checkout retry path unblocked

---

## Known Issues

### P1 — High

- ~~Unverified gateway implementations~~ — verified during Aldar P0 audit (see #356). Stripe + Tap + Cash + Bank Transfer + ATM Deposit + Mobile Money all real; Bankak remains an intentional stub gated for SD.
- ~~No webhook handling~~ — Stripe + Tap webhooks both wire end-to-end with `ProcessedWebhookEvent` dedupe + `releaseDedupeAndFail` retry; Bankak stub kept for future BoK API spec.

### P2 — Medium

- **No error recovery UI**: If `initiatePayment` fails mid-flow, the user sees an alert but has no retry mechanism beyond re-selecting a gateway.
- **Bank details / cash instructions**: Props exist (`bankDetails`, `cashInstructions`) but rendering logic needs verification for completeness.
- **`PaymentBlock` has no live caller** for fees — replaced by `FeePaymentMethods`. Still used by admission + SaaS contexts; candidate for consolidation in a follow-up.
- **`payment/content.tsx` dead-file cleanup** — file is unused after admission wizard refactor; deferred.

---

## Enhancements (Post-MVP)

- Add retry/back flow when payment initiation fails
- Add loading skeleton during payment processing
- ~~Support payment receipts (PDF generation or email)~~ — server PDF at `/api/payment/[paymentId]/receipt` (Aldar P1.5); email delivery deferred to a future cycle
- Add webhook status sync for async payment methods (Tap FAILED now notifies; subscription invoice_failed still logs only)
- ~~Localize gateway display names and payment instructions via dictionary~~ — done in Aldar P3.4

---

**Last Review:** 2026-06-13
