---
feature: billing
title: Billing (the school's Balqalam subscription)
status: partial
pillar: trust
personas: [owner, finance]
routes: [/ar/s/{school}/billing, /ar/s/{school}/school/billing]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Billing — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The page where a school's owner or accountant sees the school's own Balqalam plan: its status, the next billing date, how many students it covers, and past invoices.

This is not the school's fee collection from families — that is [Fees and Finance](../finance/SPOTLIGHT.md). Billing is what the school pays Balqalam.

## The school's day without it

A software bill arrives as an email attachment nobody forwards to the accountant. The owner does not know which plan the school is on, when it renews, or how close it is to its student limit until a service stops working. Old invoices sit in one person's inbox.

## What happens in Balqalam

1. An admin or accountant opens Billing on the school's web address. Other roles cannot read or change it.
2. The top section shows the current plan, with buttons to change plan or cancel. A cancelled plan stays active until the end of the paid period.
3. A status card shows whether the plan is active or in trial, and the next billing date.
4. A usage section shows how many students the school has against its plan, and a table of students, teachers, classes and storage in use.
5. An invoice history lists the school's past subscription invoices with their date, amount and status.
6. A preferences section holds the billing name, billing email, tax number, and whether invoice emails are sent.

## Who it is for

- **Owner:** knows which plan the school is on, when it renews, and how many students it covers, without asking anyone.
- **Finance (accountant):** past invoices and the billing email in one place for the school's own records.

## Real screens to show

None yet — and this screen is not ready to film. Its labels are English only, even on the Arabic site, and one card lists "Advanced analytics dashboard", a claim we are not allowed to make. The "add card" and "choose a payment method" buttons do not do anything yet.

If a post needs pricing, use the pricing page instead: `docs/evidence/ar-pricing.png`, `docs/evidence/ar-pricing-compare.png` (owned by the pricing page, not this feature).

Route to capture once the screen is translated: `/ar/s/{school}/billing`.

## What you can say

- Only the school's admin, accountant (and our own team) can view or change the school's plan; teachers, students and parents cannot. [actions.ts]
- A school can see its plan, its renewal date and its past invoices in one place. [billing-dashboard.tsx, actions.ts]
- Cancelling keeps the plan active until the end of the paid period. [billing-dashboard.tsx, actions.ts]
- Plan prices are public: free for up to 100 students and 10 teachers; Pro at $1.50 per student per month with a $30 monthly minimum; a 14-day Pro trial with no card. [docs-en/marketing-brief.mdx]

## Do not say

- "Sign up and pay online", "buy now", "subscribe in two clicks". Self-serve online checkout is not open; every post ends in book a demo, WhatsApp us, or apply for a pilot. A school with no plan sees a plan chooser whose payment button does nothing yet. [docs-en/marketing-brief.mdx, billing-dashboard.tsx]
- Anything from the trial card, especially "Advanced analytics dashboard" and "Priority customer support". [billing-dashboard.tsx, docs-en/marketing-brief.mdx]
- That billing is in Arabic. The page's labels are hardcoded English. [README.md]
- That billing is in the school menu. Today the side-menu entry is shown only to our own team; a school admin reaches it by its address. [template/platform-sidebar/config.ts]
- That the pilot is a plan on this page. The MENA-10 pilot is separate from the price list — never mix them. [docs-en/marketing-brief.mdx]
- "Paying customers", school counts, money saved.

## Post angles

1. "Under 100 students? Free. Forever." — owner — trust — the price card from the brief, not this screen.
2. "A 40-student school on Pro pays $30 a month, not $60." — owner — trust — the monthly minimum explained plainly.
3. "Your plan, your renewal date, your invoices — no surprise bills." — finance — trust — hold until the screen is in Arabic; then film the status card.
4. How to: "Try Pro for 14 days, no card needed." — owner — product-proof — ends in book a demo, not a checkout link.
5. "What does your school pay for software today, and does anyone know when it renews?" — owner — trust — a question post leading to the price list.

## Connects to

- [Fees and Finance](../finance/SPOTLIGHT.md) — the school's own money from families (different from this page).
- [School](../school/SPOTLIGHT.md) — school administration; the same billing page also opens under its address.

## Sources

- src/components/school-dashboard/billing/README.md, actions.ts, billing-dashboard.tsx, content.tsx, invoice-history.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/billing/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/billing/page.tsx
- src/components/template/platform-sidebar/config.ts
- content/docs-en/marketing-brief.mdx
