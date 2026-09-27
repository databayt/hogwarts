---
feature: my-fees
title: My Fees
status: partial
pillar: school-operations
personas: [parent, student, finance]
routes: [/ar/s/{school}/my-fees, /ar/s/{school}/parent/fees, /ar/s/{school}/finance, /ar/s/{school}/finance/fees/my]
screenshots: []
readme: ./README.md
docs: content/docs-en/fees.mdx
updated: 2026-09-27
---

# My Fees — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A parent opens their phone and sees, for each child, the fees the school has set, any discount taken off, and a button through to pay and to download receipts.

## The school's day without it

A mother does not know what she owes until the office calls, or until a letter comes home in a school bag. She asks at the gate how much is left after last month's payment and gets a figure from memory. With three children at the school, she cannot tell which fee belongs to which child, or whether the sibling discount was ever applied.

## What happens in Balqalam

1. The parent (or the student) signs in on the school's web address and opens My Fees. From the parent area, the Fees link lands on the same page.
2. Each child has a card with their name, and under it every fee the school has assigned: the fee's name, the school year, a status badge (pending, partial, paid, overdue) and the amount in the school's own currency.
3. Where a discount applies, the card shows the original price and a line for each discount taken off.
4. The parent can pick a preferred way to pay for each child, from the methods the school accepts. The choice is saved for the school to see.
5. A "Pay & view invoices" button takes the family to the family fees page: the balance still owed with any late part named separately, the instalments due oldest first, a Pay button, the ways this school takes money, and a receipt for every payment already made.

## Who it is for

- **Parent:** every child's fees and discounts in one place, without calling the office, and the receipts kept for them.
- **Student:** an older student linked to their own record sees the same view of their fees.
- **Finance (accountant):** fewer "how much do I owe?" calls, and each family's preferred way to pay is recorded against the student.

## Real screens to show

None yet — capture with /record. Sign in on the demo as parent@balqalam.com (or student@balqalam.com) and capture, on a phone:

- `/ar/s/{school}/my-fees` — a child's card with fees, status badges and the preferred-method picker.
- `/ar/s/{school}/finance` — the family balance, the "To pay" list and the Receipts section.
- `/ar/s/{school}/finance/fees/my` — the fee detail table with instalments.

Before recording, check the discount line: it currently shows an internal code (for example the sibling discount's code name) instead of a translated label.

## What you can say

- A parent sees every child's fees on one page, each with its status and amount in the school's currency. [content.tsx, queries.ts]
- Discounts are shown openly: the original price and each discount taken off. [content.tsx]
- A family only ever sees its own children's fees; the page checks the link between the account and each student. [queries.ts, actions.ts]
- The family fees page shows what is still owed, what is overdue, and the instalments due, oldest first. [finance/family/README.md, dictionaries/en/finance.json]
- Every payment already made has a receipt the family can open as a PDF. [finance/family/README.md, README.md]
- It opens in Arabic and English. [internationalization/school-ar.json, school-en.json]

## Do not say

- "Pay each instalment separately." Paying online settles the fee's whole remaining balance; the page itself says so. [finance/family/README.md]
- "Choosing a method pays the fee." The preferred-method picker only records a preference; paying happens on the family fees page, and cash or bank transfer is still settled at the school office. [actions.ts, finance/family/README.md]
- "Pay by card in Sudan." Card checkout does not accept Sudanese pounds. [lib/payment/providers/stripe.ts]
- Bankak, Cashi or Tap by name. The brief holds local rails as "being added". [docs-en/marketing-brief.mdx]
- "WhatsApp payment reminders." Fee-due reminders go in the app and by email; WhatsApp for fee reminders is listed as deferred. [README.md]
- That there is one fees page. There are two family pages today (this one and the family fees page), and merging them is still open. [finance/fees/ISSUE.md]
- "Download the app", "works offline", hours or money saved, "paying customers".

## Post angles

1. "What do I owe, for which child, and when?" — parent — school-operations — one phone screen that answers the question parents ask at the school gate.
2. "The discount you were promised, written on the screen." — parent — trust — the original price and the sibling discount line under a second child's fee.
3. How to: "Find your child's fees and your receipts in three taps." — parent — product-proof — screen recording from sign-in to a downloaded receipt.
4. "Fewer 'how much is left?' calls at the finance office." — finance — school-operations — describe the task: the parent checks the balance themselves.
5. "How do parents at your school find out what they owe this term?" — owner — school-operations — a question post leading to the family fees view.

## Connects to

- [Fees and Finance](../finance/SPOTLIGHT.md) — where the school sets fees, records payments and issues receipts.
- [Payment](../../payment/SPOTLIGHT.md) — the "choose how to pay" cards behind the Pay button.
- [Parent Portal](../parent-portal/SPOTLIGHT.md) — the portal's Fees link opens this page.

## Sources

- src/components/school-dashboard/my-fees/README.md, content.tsx, queries.ts, actions.ts, form.tsx
- src/components/school-dashboard/finance/family/README.md
- src/components/school-dashboard/finance/fees/ISSUE.md
- src/app/[lang]/s/[subdomain]/(school-dashboard)/my-fees/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/fees/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/finance/fees/my/page.tsx
- src/components/internationalization/school-en.json, school-ar.json (school.myFees)
- src/components/internationalization/dictionaries/en/finance.json (finance.family)
- src/lib/payment/providers/stripe.ts
- content/docs-en/fees.mdx, content/docs-en/finance.mdx, content/docs-en/marketing-brief.mdx
