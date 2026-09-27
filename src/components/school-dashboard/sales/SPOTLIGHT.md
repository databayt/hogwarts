---
feature: sales
title: Sales (leads)
status: not-shipped
pillar: school-operations
personas: [owner]
routes: [/ar/s/{school}/sales]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Sales — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A lead list built for our own company's sales work — tracking schools and partners we want to sell to — that currently also appears inside a school's admin menu. It is not a feature for schools.

## The school's day without it

Nothing is missing for a school. A school's real "leads" are families asking about places, and those belong to admissions (enquiries and applications), not to this page.

## What happens in Balqalam

1. A school admin sees "Sales" (المبيعات) in the side menu and opens a list of leads.
2. Each lead is a business contact: a name, the organisation (usually a school), job title, website, LinkedIn address, country, a pipeline stage from "new" to "won" or "lost", a priority and a score.
3. Leads can be added by hand, pasted in as text for automatic extraction, edited and deleted in bulk.
4. Tabs for "Import" and "Analytics" appear at the top, but those pages do not exist yet.

All of this is how a software company tracks the schools it sells to. The data model itself is labelled as business-to-business lead management for the software. The page's own README and ISSUE files are empty placeholders.

## Who it is for

- **Owner:** nobody at a school needs this today. It is our own sales tooling showing up in the school's menu; the school-facing way to follow up interested families is [Admission](../admission/SPOTLIGHT.md).

## Real screens to show

None — and none should be captured. The route is `/ar/s/{school}/sales`.

Note for other shots: the "Sales" item is visible in the admin side menu on finance screens such as `demo-finance-ar.png`. Crop it out or ask engineering to hide it before recording admin screens.

## What you can say

- Nothing publicly. This is internal tooling, not a school feature. [prisma/models/sales.prisma, src/components/sales/content.tsx]

## Do not say

- "Balqalam includes a sales CRM for your school" or "manage your school's leads". The leads here are business contacts (organisation, LinkedIn, deal stage), not families. [prisma/models/sales.prisma]
- "AI finds your leads" or "import your leads". The paste-in extraction is internal, and the Import and Analytics tabs lead to pages that do not exist. [school-dashboard/sales/permissions.ts, (school-dashboard)/sales/ route folder]
- Any lead count, pipeline figure or "schools in our pipeline". Only King Fahad Schools may be named; every other school needs written consent. [docs-en/marketing-brief.mdx]
- Anything that frames our own sales process as a product capability.

## Post angles

Do not post about this yet.

1. Do not post — internal company tooling, not a school feature.
2. Do not post — Import and Analytics pages do not exist.
3. Do not post — lead records describe business contacts, not families.
4. Do not post — the block's README and ISSUE are empty; nothing is documented as school-facing.
5. For the "families asking about places" story, write from [Admission](../admission/SPOTLIGHT.md) instead.

## Connects to

- [Admission](../admission/SPOTLIGHT.md) — the school-facing place for enquiries from families.

## Sources

- src/components/school-dashboard/sales/README.md, CLAUDE.md, ISSUE.md, permissions.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/sales/page.tsx, layout.tsx (only page, layout, loading and error exist)
- src/components/sales/content.tsx, constants.ts, prompt.tsx, actions.ts (function list)
- prisma/models/sales.prisma
- src/components/template/platform-sidebar/config.ts (Sales shown to ADMIN and DEVELOPER)
- content/docs-en/sales.mdx (the company's own sales plan, not this page)
- content/docs-en/marketing-brief.mdx
- demo-finance-ar.png (Sales visible in the side menu)
