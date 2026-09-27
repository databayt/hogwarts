---
feature: lab
title: Lab (internal design showcase)
status: not-shipped
pillar: product-proof
personas: [it]
routes: [/en/s/{school}/lab]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Lab (internal design showcase) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

An internal page where the product team previews the building blocks of dashboard screens — it is not a school feature, and it is not a science-lab feature.

## The school's day without it

Nothing changes for a school. This page exists for the people who build Balqalam, so that new screens look consistent with the old ones.

## What happens in Balqalam

1. A developer opens the Lab address directly. It is not in the school menu; the link to it is switched off.
2. The page shows a gallery of sample dashboard cards (stats, charts, calendars, activity feeds) filled with example content.
3. A second tab shows a gallery of basic interface pieces. The page is in English only and carries no school data.

## Who it is for

- IT / product team: a reference sheet for building screens. No school role uses it.

## Real screens to show

- None yet — and do not capture this: it shows example data and is not something a school gets.
- Routes: `/en/s/{school}/lab` exists but is internal.

## What you can say

- Nothing to schools. This is an internal tool. [README.md, lab/page.tsx]

## Do not say

- "Science lab management", "lab booking", "lab equipment" — the name "Lab" here means a design workshop, not a school laboratory.
- Anything that presents the sample cards (numbers, charts) as a real school's data.
- Global bans: no percentages, no "advanced analytics", never the old codename.

## Post angles

Do not post about this yet.

1. (Reserved) "Every screen in Balqalam is built from the same pieces" — owner — product-proof — Only as a behind-the-scenes story, and only if leadership approves.
2. (Reserved) "Why the attendance page and the fees page feel the same" — principal — product-proof — Consistency story; needs real screens, not this page.
3. (Reserved) "How we design a new screen" — it — product-proof — Behind-the-scenes; internal approval first.
4. (Reserved) "One look across the whole school system" — owner — product-proof — Use real feature screens instead.
5. (Reserved) "Does your school software feel like five different programs?" — principal — product-proof — Question post; show real screens, not this page.

## Connects to

- [Dashboard](../dashboard/SPOTLIGHT.md) — the real school home screen these card designs feed into.

## Sources

- src/components/school-dashboard/lab/README.md
- src/components/school-dashboard/lab/dashboard-cards-showcase.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/lab/page.tsx
- src/components/template/platform-sidebar/content.tsx (the /lab link is commented out)
- src/routes.ts (no /lab entry)
- content/docs-en/marketing-brief.mdx
