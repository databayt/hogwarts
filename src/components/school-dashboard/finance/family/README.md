---
epic: 01
sprint: Q3-2026
title: Family money surface (finance/family)
file_type: readme
owner: Abdout
maturity: Built
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/313
docs: https://ed.databayt.org/en/docs/finance
last_audited: 2026-09-09
---

## What this is

`/finance` for a **student or a guardian**. Everywhere else in this block,
`/finance` is the staff hub: school-wide revenue, expenses, payroll, gated on the
`reports` permission. A family holds none of that permission, so until 2026-09-09
the one page named after their own money answered "access denied".

This directory is what that URL means to a family instead:

| Section | File | Answers |
| --- | --- | --- |
| Balance hero | `balance-hero.tsx` | What do I owe, and is any of it late |
| To pay | `due-list.tsx` | Which instalments are outstanding, in due-date order |
| Your fees | `fee-cards.tsx` | What am I charged for, and how far through it am I |
| Ways to pay | `pay-options.tsx` | Which rails does this school actually take |
| Receipts | `receipts.tsx` | What have I already paid, and where is the proof |

Built phone-first: one column that widens at `sm`/`lg`. Unlike the dashboard's
phone sections there is no desktop twin to fall back on, so nothing here is
`md:hidden`.

## The one reader

`queries.ts` → `getFamilyMoney(lang)` resolves students, fee assignments,
instalments, payments, currency and rails **once**, and both family surfaces read
it: this overview and the detail table at `/finance/fees/my`. They used to
resolve separately, which is how the same family could be shown two different
balances — and was: `/fees/my` derived OVERDUE from `FeeAssignment.status` (only
ever flipped by a cron) and read 0 while months of instalments were past due.

It returns `null` for anyone who is not a family role with a resolvable student,
which falls straight through to the staff hub and its own gate. **It widens no
permission** — a family reads only rows tied to its own student ids inside its
own school.

## Instalments are invoices

The school issues one `UserInvoice` per scheduled payment at enrollment, and
`allocatePaymentToInvoices` settles them oldest-first. So the invoice rows *are*
the instalment ledger, and each row here carries both identities: what is owed,
when, and the invoice number that proves it. Reading `FeeStructure.paymentSchedule`
instead would show a plan rather than a balance. A fee with no invoices falls back
to a single dateless row — an unbilled fee that rendered as nothing is how a
family misses a payment.

Status is re-derived against the clock: an UNPAID invoice past its due date reads
OVERDUE whether or not a cron has relabelled it yet. The boundary is **midnight
today in `School.timezone`**, not `Date.now()` — due dates are stored at midnight
UTC, so a plain comparison turns an invoice due today red at 02:00 that morning in
Khartoum, and a parent paying on the due day would read late all day.

## Known limits

- **Payment is per-fee, not per-instalment.** `createFeePaymentCheckout` charges
  the assignment's whole remaining balance and takes no amount; the wallet rails
  submit the server-resolved remaining too. The list says so in a note rather
  than letting the button imply otherwise. Per-instalment charging needs an
  amount on the checkout action and on the webhook's allocation.
- **`cash` / `bank_transfer` appear under "Ways to pay" but are office-recorded.**
  They are real ways to pay this school; the app cannot process them.
- Fee names run through `localize("FeeStructure", …)` — first reader in the other
  language warms that school's cache, since fee-structure writes do not `prewarm`.
