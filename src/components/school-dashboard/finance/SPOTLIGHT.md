---
feature: finance
title: Fees and Finance
status: partial
pillar: school-operations
personas: [owner, finance, principal, parent, teacher]
routes: [/ar/s/{school}/finance, /ar/s/{school}/finance/fees, /ar/s/{school}/finance/fees/structures, /ar/s/{school}/finance/fees/payments, /ar/s/{school}/finance/fees/assignments/{id}, /ar/s/{school}/finance/invoice, /ar/s/{school}/finance/expenses, /ar/s/{school}/finance/budget, /ar/s/{school}/finance/payroll, /ar/s/{school}/finance/payroll/my, /ar/s/{school}/finance/banking, /ar/s/{school}/finance/reports, /ar/s/{school}/finance/permissions]
screenshots: [invoice-ar-after-ddl.png]
readme: ./README.md
docs: content/docs-en/finance.mdx
updated: 2026-09-27
---

# Fees and Finance — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school sets its fees once, every family gets invoices and receipts, and the accountant sees who has paid and who has not — in Arabic, in the school's own currency.

## The school's day without it

Fees live in a notebook and a spreadsheet only the accountant understands. A father pays cash at the office and gets a handwritten slip; a month later nobody can find it. Before every term the office phones families one by one to ask who still owes, and a sibling discount is worked out on a calculator each time.

## What happens in Balqalam

### Fees

1. The accountant creates a fee for each grade — tuition, transport, uniform, exams and more — with its instalments, an optional late fee and discount rules.
2. Fees are assigned to one student or a whole class at once. A second or third child in the same family gets the sibling discount calculated automatically.
3. Scholarships and fines are recorded against a student's fees.

### Invoices and receipts

4. Each scheduled instalment becomes an invoice with its own number and due date. The invoice list shows paid and unpaid at a glance.
5. When a payment is recorded, the family is notified and gets a PDF receipt carrying the school's name, in Arabic or English.

### Payments the school records

6. At the office, the accountant records cash, bank transfer, cheque or ATM deposit, with the reference. A deposit waits as "awaiting verification" until the accountant confirms it.

### Expenses, budget and payroll

7. Staff submit expenses; an approver approves or rejects them, and approval draws down the matching budget. Payroll runs turn salary structures into payslips that go through approval before salaries are marked paid, and a teacher can open their own payslips.

### Banking and reports

8. The school lists the accounts families pay into, and a reconciliation page compares recorded payments against gateway and book totals. Balance sheet, profit and loss, and trial balance are generated from the school's books.

## Who it is for

- **Owner:** one place that shows money in and money out for the school, instead of a notebook and a phone call to the accountant.
- **Finance (accountant):** fee setup per grade, invoices, receipts and office payments in one system, with the sibling discount done for them.
- **Principal:** a view of paid versus unpaid without asking; staff only see the finance pages they have been given.
- **Parent:** what they owe, what is late, and a receipt for every payment — see [My Fees](../my-fees/SPOTLIGHT.md).
- **Teacher:** their own payslips and expense claims; the school's money pages stay closed to them.

## Real screens to show

- `invoice-ar-after-ddl.png` — the Arabic invoice list: invoice numbers, family names, amounts in Sudanese pounds, paid and unpaid badges. Demo data; the best finance shot we have.

Not suitable: `demo-finance-ar.png` shows US dollars, a placeholder bank card with a staff name on it, and a "Sales" menu item. `payroll-runs-admin-ar.png` has a welcome pop-up over it and English buttons. `finance-ar-before.png` and `invoice-ar-before.png` are pre-fix captures.

Capture with /record (sign in on the demo as the accountant):

- `/ar/s/{school}/finance/fees/structures` — fee setup per grade.
- `/ar/s/{school}/finance/fees/payments` — recorded payments, on a phone.
- `/ar/s/{school}/finance/fees/assignments/{id}` — one family's fee with its instalment timeline.
- A receipt PDF opened from a paid payment.

## What you can say

- Fees are set once per grade, with instalments, late fees and discounts, and assigned to a whole class in one step. [docs-en/fees.mdx, fees/actions.ts]
- The sibling discount is calculated automatically when fees are assigned. [fees/actions.ts]
- Every scheduled instalment is an invoice with its own number, so a family's balance is what the invoices say. [family/README.md]
- Every recorded payment produces a PDF receipt with the school's name, in Arabic or English, and the family is notified with the link. [ISSUE.md 2026-08-14, docs-en/finance.mdx]
- Amounts appear in the school's own currency, including Sudanese pounds. [ISSUE.md 2026-09-13]
- Each role sees only its part: a teacher who opens the school's finance pages is refused; a family sees only its own fees. [ISSUE.md 2026-08-15]
- Approved line for payment methods: "Records cash, bank transfer and card payments in one place. Online card payments are live through Stripe; local rails are being added." [docs-en/marketing-brief.mdx]

## Do not say

- "Full accounting", "every payment is booked automatically" or "real bookkeeping" without a qualifier. The public docs state that only fee payments post to the school's books today, so the balance sheet and profit and loss reflect fee income and manual entries, not salaries or wallet money. [docs-en/finance.mdx, docs-en/finance-reports.mdx]
- "Refunds." There is no refund action for fees; a refund status exists but nothing sets it. [fees/ISSUE.md]
- "Pay one instalment online." Paying online settles the fee's whole remaining balance. [docs-en/finance.mdx]
- "Reminders for every fee." Due and overdue reminders only run for fees that have a payment schedule. Do not promise WhatsApp fee reminders. [fees/ISSUE.md]
- "Automatic bank sync", "cashless wallet", "bulk invoice generation": bank sync and bulk generation are stubs, and wallet top-ups have no screen. [ISSUE.md, README.md]
- Payroll as a headline. The brief rates it partial: lead with fees, mention payroll second; tax and the create-run form are still being finished. [docs-en/marketing-brief.mdx, docs-en/finance-payroll.mdx]
- Bankak, Cashi or Tap by name. The code has a Sudan bank-app transfer flow and a Gulf card gateway, but the brief's approved line says local rails "are being added" — hold until the brief changes. Card checkout does not accept Sudanese pounds. [docs-en/marketing-brief.mdx, lib/payment/providers/stripe.ts]
- "Advanced analytics", a number of payment gateways, money or hours saved, "buy now", "paying customers".

## Post angles

1. "Fees without the notebook." — finance — school-operations — invoice and receipt generated on screen, the angle the brief already lists.
2. "The handwritten slip nobody can find." — parent — school-operations — a pain scene, then a PDF receipt arriving on the parent's phone.
3. How to: "Set one grade's fees once, then assign them to the whole class." — finance — product-proof — screen recording of fee setup and bulk assignment.
4. "Three children, one family: the sibling discount is already applied." — owner — product-proof — the discount line on a second child's fee.
5. "How does your school know, today, which families are behind on fees?" — principal — school-operations — a question post leading to the paid/unpaid invoice list.

## Connects to

- [My Fees](../my-fees/SPOTLIGHT.md) — the family's own view of what it owes.
- [Payment](../../payment/SPOTLIGHT.md) — the "choose how to pay" cards families see.
- [Parent Portal](../parent-portal/SPOTLIGHT.md) — the parent's fees link opens the family fee pages.
- [Admission](../admission/SPOTLIGHT.md) — enrolling a student creates their fees and invoices.
- [Notifications](../notifications/SPOTLIGHT.md) — fee due, overdue and paid notices.

## Sources

- src/components/school-dashboard/finance/README.md, ISSUE.md, CLAUDE.md
- src/components/school-dashboard/finance/fees/ISSUE.md, fees/actions.ts, fees/fee-payment-methods.tsx
- src/components/school-dashboard/finance/family/README.md
- src/components/internationalization/dictionaries/en/finance.json (finance.family)
- src/lib/payment/gateway-config.ts, src/lib/payment/constants.ts, src/lib/payment/providers/{stripe,tap,bankak}.ts
- src/app/api/cron/fee-overdue/route.ts, .github/workflows/admission-crons.yml
- src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/ (route tree, fees/my/page.tsx, fees/assignments/[id]/page.tsx)
- content/docs-en/finance.mdx, fees.mdx, finance-{accounts,banking,budget,dashboard,expenses,payroll,permissions,receipt,reports,salary,timesheet,wallet}.mdx
- content/docs-en/marketing-brief.mdx
- invoice-ar-after-ddl.png, demo-finance-ar.png, payroll-runs-admin-ar.png (reviewed)
