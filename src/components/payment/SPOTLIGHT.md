---
feature: payment
title: Payment (choosing how to pay)
status: partial
pillar: trust
personas: [parent, finance, owner]
routes: [/ar/s/{school}/finance, /ar/s/{school}/finance/fees/my, /ar/s/{school}/finance/fees/assignments/{id}, /ar/s/{school}/finance/banking/payment-methods]
screenshots: []
readme: ./README.md
docs: content/docs-en/fees.mdx
updated: 2026-09-27
---

# Payment — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

When a parent presses Pay, they see only the ways this school actually takes money, each as a clear card, and nothing reads as "paid" until the payment is confirmed.

This folder holds the shared payment cards and confirmation pieces; the fee pages in [Fees and Finance](../school-dashboard/finance/SPOTLIGHT.md) are where families meet them.

## The school's day without it

A parent is told "pay the school" but not how: which account, which reference, cash or transfer. They send money, then photograph the transfer on WhatsApp to the accountant, who has to match it by hand against a bank statement. When the reference is missing, nobody knows whose payment it was.

## What happens in Balqalam

1. The school's finance office sets which payment methods it accepts and enters its own account details on the Payment methods tab under Banking.
2. On the family fees page, the parent presses Pay beside a fee. A window opens with "Choose a payment method" and one card per method this school offers, each with a short description.
3. Choosing online card payment takes the parent to a secure hosted checkout. On return, a banner shows whether the payment went through; the system checks with the payment provider before showing "paid".
4. For a transfer from a banking app, the window shows the school's account, the amount to send and a reference to quote, then asks for the transaction reference and a screenshot of the receipt. The payment shows as "Awaiting verification" until the finance office confirms it. (Held from posts — see "Do not say".)
5. Cash and bank transfer are listed under "Ways to pay" and are settled at the school office, where the accountant records them.
6. Once a payment is confirmed, the fee and its invoices update, the family is notified, and a receipt is available.

## Who it is for

- **Parent:** a clear list of how this school takes money, the exact amount and reference to use, and a receipt at the end.
- **Finance (accountant):** payments arrive with a reference already attached, and transfers wait for their confirmation instead of counting as paid on the parent's word.
- **Owner:** the school decides which methods are offered; nothing appears that the school has not set up.

## Real screens to show

None yet — capture with /record. Sign in on the demo as parent@balqalam.com and capture, on a phone:

- `/ar/s/{school}/finance` — the Pay button and the "Choose a payment method" window.
- `/ar/s/{school}/finance/fees/my` — the "Ways to pay" section.

Sign in as the accountant for `/ar/s/{school}/finance/banking/payment-methods` (the school's own settings). Do not film a banking-app transfer window until the brief lifts its hold on local rails, and blur any real account number.

## What you can say

- Parents only see the payment methods their school has set up. [finance/fees/fee-payment-methods.tsx, finance/fees/assignments/[id]/page.tsx]
- A payment does not read as "paid" until it is confirmed; an online payment is checked with the provider before the banner says so. [finance/fees/my/page.tsx, ISSUE.md]
- A transfer the parent reports waits as "Awaiting verification" until the finance office confirms it, and a reference can only be submitted once. [ISSUE.md, dictionaries/en/finance.json]
- Once confirmed, the family is notified and a receipt is available. [finance/ISSUE.md, finance/family/README.md]
- The payment choices are in Arabic and English. [lib/payment/constants.ts]
- Approved line: "Records cash, bank transfer and card payments in one place. Online card payments are live through Stripe; local rails are being added." [docs-en/marketing-brief.mdx]

## Do not say

- Bankak, Cashi (MyCashi), Tap, mada, KNET, Apple Pay or Google Pay by name. The code carries a Sudan banking-app transfer flow and a Gulf card gateway, but the brief's approved line holds local rails as "being added"; Tap also only switches on once a school's key is set. Wait for the brief to change. [docs-en/marketing-brief.mdx, lib/payment/providers/tap.ts]
- "Six payment gateways" or any count of gateways. [docs-en/marketing-brief.mdx]
- "Pay online by card" to a Sudanese audience. Card checkout does not accept Sudanese pounds. [lib/payment/providers/stripe.ts]
- "Instant confirmation" for transfers. A person at the school confirms each one. [ISSUE.md]
- "Pay a single instalment." Paying settles the fee's whole remaining balance. [finance/family/README.md]
- "Refunds in one click." There is no refund step for fees. [finance/ISSUE.md]
- "Application fees online." Applying to a school is free by product decision; payment starts at the fee stage. [README.md]
- "Buy now", money saved, "paying customers".

## Post angles

1. "The school's account, the amount, the reference — on one screen." — parent — trust — hold until the brief lifts the local-rail hold, then film the transfer window.
2. "No more 'I sent it, check WhatsApp'." — finance — school-operations — a pain scene, then a payment waiting for confirmation with its reference attached.
3. "Paid means paid: checked before it says so." — owner — trust — the return banner after an online payment.
4. How to: "Set the ways your school takes money, once." — finance — product-proof — the Payment methods tab under Banking.
5. "How do parents at your school know which account to pay into?" — parent — trust — a question post leading to the "Ways to pay" section.

## Connects to

- [Fees and Finance](../school-dashboard/finance/SPOTLIGHT.md) — fees, invoices, office payments and confirmation.
- [My Fees](../school-dashboard/my-fees/SPOTLIGHT.md) — the family's fee pages where Pay lives.

## Sources

- src/components/payment/README.md, CLAUDE.md, ISSUE.md
- src/components/payment/payment-block.tsx, payment-method-card.tsx
- src/components/school-dashboard/finance/fees/fee-payment-methods.tsx
- src/components/school-dashboard/finance/family/README.md
- src/components/school-dashboard/finance/ISSUE.md
- src/lib/payment/gateway-config.ts, constants.ts, providers/{stripe,tap,bankak,cashi,cash,bank-transfer}.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/fees/my/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/fees/assignments/[id]/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/banking/payment-methods/page.tsx
- src/components/internationalization/dictionaries/en/finance.json (finance.fees.manualRail, finance.family)
- content/docs-en/finance.mdx, fees.mdx, marketing-brief.mdx
