---
feature: analytics
title: School Analytics Dashboard
status: not-shipped
pillar: school-operations
personas: [owner, principal]
routes: []
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# School Analytics Dashboard — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.
> Status: not shipped. No school can open this screen today.

## In one line

A planned single screen where an owner would see enrollment, attendance, grades and fee collection for the whole school side by side — designed, but not yet connected to real data or reachable by any user.

## The school's day without it

An owner who wants to know how the school is doing asks three people: the registrar for enrollment, the class teachers for attendance, the accountant for fees. Each answer arrives in a different format on a different day, and nobody sees the whole picture at once.

## What happens in Balqalam

Today, nothing on this screen. The design exists as a draft component with charts and summary cards, but:

1. There is no page in the school dashboard that shows it.
2. It is not wired to the school's real records; the draft still contains placeholder values.
3. Role-based views (owner, teacher, accountant) are not decided.

What schools can use today lives in the individual areas instead:

- Attendance has its own analytics page (trends and summaries).
- Exam results have their own analytics page.
- The timetable has its own analytics page.
  Those belong to those features' spotlights, not this one.

## Who it is for

- **Owner:** when built, one view of enrollment, attendance, academics and fees together.
- **Principal:** when built, a way to spot a weak area without asking for reports.

## Real screens to show

None — this screen is not reachable in the product. Do not mock it up as if it were real.
If you need a "numbers" visual today, capture the per-area pages owned by other features:

- `/ar/s/demo/attendance/analytics`
- `/ar/s/demo/exams/result/analytics`
- `/ar/s/demo/timetable/analytics`

## What you can say

- Balqalam has reports on attendance, grades and fees, each in its own area. (Use this wording; it is the approved replacement.) [docs-en/marketing-brief.mdx]
- Attendance, exam results and the timetable each have their own analytics page today. [src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/analytics, exams/result/analytics, timetable/analytics]
- A whole-school dashboard is being built. Say this only when asked about the roadmap, never as a headline. [analytics/README.md]

## Do not say

- Never say "advanced analytics", "AI insights", "real-time dashboard" or "business intelligence". Globally banned; the dashboard is not finished. [docs-en/marketing-brief.mdx]
- Do not say an owner can see enrollment, attendance, grades and fees on one screen. Not true today. [analytics/ISSUE.md]
- Do not show screenshots or recordings of this component; it still runs on placeholder numbers. [analytics/ISSUE.md]
- Do not claim exports, scheduled email reports, drill-downs or year-over-year comparison — all post-launch ideas. [analytics/ISSUE.md]
- No percentages or "insight" figures of any kind.

## Post angles

Do not post about this yet.
The five below are parked until the dashboard ships and is verified on real data:

1. "Your whole school on one screen" — owner — school-operations — Parked: not true until the dashboard is wired and routed.
2. "Three people, three answers, three different days" — owner — school-operations — Parked pain-scene post; hold until the product answers it.
3. "How to read your school's month in one minute" — principal — school-operations — Parked how-to; needs a real screen.
4. "What would you check first every Monday?" — owner — school-operations — Parked question post; could feed the build, but not promised in public.
5. "Attendance, grades, fees — side by side" — principal — product-proof — Parked; until then use the per-area report pages under their own features.

## Connects to

- [Attendance](../attendance/SPOTLIGHT.md) — its analytics page is live today
- [Exams](../exams/SPOTLIGHT.md) — exam results analytics
- [Timetable](../timetable/SPOTLIGHT.md) — timetable analytics
- [Report Cards](../reports/SPOTLIGHT.md) — per-student term results

## Sources

- src/components/school-dashboard/analytics/README.md
- src/components/school-dashboard/analytics/ISSUE.md
- src/components/school-dashboard/analytics/dashboard.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/attendance/analytics/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/result/analytics/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/timetable/analytics/page.tsx
- content/docs-en/marketing-brief.mdx
