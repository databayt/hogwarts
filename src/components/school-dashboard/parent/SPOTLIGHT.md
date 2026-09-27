---
feature: parent
title: Parent Home Screen (unused design)
status: not-shipped
pillar: school-operations
personas: [parent]
routes: []
screenshots: []
readme: none
docs: none
updated: 2026-09-27
---

# Parent Home Screen (unused design) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

This folder holds an early design for a parent's home screen that no parent ever sees; what parents really see lives in the Dashboard and the Parent Portal.

## The school's day without it

A parent with two children at the school has no single place to see how both are doing. They ask each child, call the office, or wait for the end-of-term report. This folder was an early attempt at that single screen. The problem is real — but this particular screen was never switched on.

## What happens in Balqalam

Nothing, from this folder. The screen here is not connected to any page, and part of it (the grade trend chart) was drawn with made-up example numbers rather than a school's records.

What a parent actually sees today comes from two other places:

1. After signing in, the parent lands on the **Dashboard**. It shows a card per child with attendance and average grade, recent grades, upcoming homework and school announcements, taken from the school's real records.
2. From the side menu the parent opens the **Parent Portal**, which goes deeper per child: grades, report cards to download, attendance with excuse submission, today's classes, homework, announcements and events.

Write about those two, using their Spotlight files.

## Who it is for

- **Parent:** the intended user. Today they are served by the Dashboard and the Parent Portal, not by this folder.

## Real screens to show

None — this screen is never shown to anyone. Do not capture it.

For the parent's real home screen, capture `/ar/s/{school}/dashboard` signed in as parent@balqalam.com on the demo, at phone width and at desktop width. For the per-child views, see the Parent Portal Spotlight.

## What you can say

- Nothing about this folder's design. It is not in the product. [dashboard.tsx — not imported by any page]
- For parents, use the claims in the Dashboard and Parent Portal Spotlights instead; for example, that parents see their children's grades, attendance and homework from the school's actual records. [../dashboard/parent.tsx, ../dashboard/actions.ts]

## Do not say

- Anything shown only in this design: the "Select Child" picker with a grade-trend chart by month, the subject-by-subject performance chart, the fee "paid / pending / next due" card, or the Assignments / Exams / Attendance / Announcements tabs on one page. None of these reach a parent from this folder.
- Any number from this design — the monthly grade trend here is hard-coded example data.
- "Parent app" or "download the app." Parents use the school's web address in their phone's browser.
- Global bans: hours saved, percentages as outcomes, "works offline", paying customers.

## Post angles

Do not post about this yet. It is an unused design.

For parent posts, use the angles in:

1. [Parent Portal](../parent-portal/SPOTLIGHT.md) — "Every parent, every child, one screen."
2. [Dashboard](../dashboard/SPOTLIGHT.md) — the parent's home screen after sign-in.
3. [Notifications](../notifications/SPOTLIGHT.md) — what reaches a parent when a report card is published.
4. [Messaging](../messaging/SPOTLIGHT.md) — a parent writing to their child's teachers inside the school's own system.
5. [Attendance](../attendance/SPOTLIGHT.md) — a parent excusing an absence from their phone.

## Connects to

- [Parent Portal](../parent-portal/SPOTLIGHT.md) — the live, per-child parent screens.
- [Dashboard](../dashboard/SPOTLIGHT.md) — the live parent home screen after sign-in.

## Sources

- src/components/school-dashboard/parent/dashboard.tsx (only file in the folder; no page imports it — checked by searching src/ for its import path and component name)
- src/components/school-dashboard/dashboard/parent.tsx (the parent home screen that is actually rendered)
- src/components/school-dashboard/dashboard/content.tsx (chooses the parent view on /dashboard)
- src/components/school-dashboard/dashboard/actions.ts (parent dashboard data)
- src/components/school-dashboard/parent-portal/README.md
- content/docs-en/marketing-brief.mdx
