---
feature: grades
title: Report Cards, Transcripts and Promotion
status: partial
pillar: trust
personas: [principal, registrar, teacher, parent]
routes: [/ar/s/{school}/grades/reports, /ar/s/{school}/grades/transcripts, /ar/s/{school}/grades/promotion, /ar/s/{school}/grades/templates, /ar/s/{school}/parent/children/{child}/report-cards, /ar/verify/transcript/{code}]
screenshots: []
readme: ./README.md
docs: content/docs-en/exams.mdx
updated: 2026-09-27
---

# Report Cards, Transcripts and Promotion — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

At the end of term Balqalam drafts every student's report card from marks the teachers already entered, the office reviews and publishes them, and parents are told the same day.

## The school's day without it

At term end, teachers hand their mark sheets to the office. Someone copies every subject mark onto a printed card for each student, works out averages and ranks by hand, and signs and stamps a pile of paper. A former student who needs a transcript waits days while someone digs through files, and whoever receives it has no easy way to know it is genuine.

## What happens in Balqalam

1. Throughout the term, exam and homework marks land in one gradebook as teachers enter or publish them.
2. When a term ends, Balqalam drafts a report card for every student: each subject's mark, attendance days and the student's rank. The office can also press "Generate report cards" for any term.
3. The office reviews the drafts on the report-cards screen and presses Publish. Students and parents are notified that the report card is ready, and parents see it from their child's page.
4. The school uploads its own Word report-card template once. Balqalam fills it per student, or fills the whole term at once with "Generate all", downloaded in batches.
5. A transcript can be issued with a verification code. Anyone holding the code can confirm on a public page that it is genuine, without an account.
6. For moving students up a year, the school sets its promotion rules per grade (for example minimum attendance, minimum overall result, subjects that must be passed). Balqalam lists who meets them, the principal can override individual decisions, then approves and applies the promotion as a batch.

## Who it is for

- **Principal**: one place to approve report cards and year-end promotion, with the rules written down instead of decided student by student.
- **Registrar**: report cards generated for the whole term, filled into the school's own template, and transcripts that can be checked by a code.
- **Teacher**: marks entered once feed the report card; no copying onto paper cards.
- **Parent**: a notification when the report card is published, and the card on their phone from the child's page.
- **Student**: is notified when the report card is published. (A student's own report-card and transcript screen is not built yet; students see their marks in the gradebook.)

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, admin login on demo.balqalam.com): `/ar/s/{school}/grades/reports` (report cards list with Generate and Publish), `/ar/s/{school}/grades/promotion` (promotion dashboard), `/ar/s/{school}/grades/transcripts`. As a parent: `/ar/s/{school}/parent/children/{child}/report-cards` on a phone. Also the public transcript check page.

## What you can say

- Report cards are drafted automatically for a term that has just ended, as drafts only; nothing reaches parents until the office publishes. [ISSUE.md "Term-end report-card auto-generation"; CLAUDE.md "Key Decisions"]
- Each report card carries subject marks, attendance days and the student's rank, built from the same gradebook teachers write into. [docs-en/exams.mdx "Automation pipeline"; lib/report-cards-core.ts]
- Publishing report cards sends a "report card ready" notification to the class. [ISSUE.md "MVP Checklist"; actions/report-cards.ts]
- The school's own Word template is filled for one student or for a whole term at once. [ISSUE.md "Bulk .docx report cards"]
- Transcripts carry a verification code that anyone can check on a public page, no login needed. [src/routes.ts; src/app/[lang]/verify/transcript/[code]/page.tsx]
- Promotion follows rules the school sets per grade, including a minimum attendance level, and every automatic decision can be overridden before approval. [actions/promotion.ts]
- A report card can be shared through a private link that the school can later revoke. [actions/share.ts]

## Do not say

- "Beautiful PDF report cards out of the box." The engineering records disagree on whether the built-in PDF is finished; the reliable path today is the school's own Word template. Say "filled into your own template".
- "Custom grading scales per school." Grade boundaries are still the default A+ to F scale; per-school configuration has no screen yet. [ISSUE.md "P1"]
- "Students can open their report card and transcript in the app." Students have no own report-card or transcript screen yet. [listings/grades/ISSUE.md "Recently Fixed"]
- "Emailed to every parent" — publishing sends a notification; do not promise email or WhatsApp delivery of the card itself.
- "Government-certified" or "accepted by the ministry" transcripts. The code proves the school issued it, nothing more.
- Any claim of time saved, percentages, or "advanced analytics".
- Naming any school other than King Fahad Schools, or showing real student names or faces from the pilot.

## Post angles

1. "Term ends Thursday. Every report card is due Sunday." — registrar — school-operations — a pain scene: copying marks onto paper cards versus reviewing drafts Balqalam already built.
2. "Your report card, your template. Filled for the whole term." — principal — product-proof — the school keeps its familiar layout; Balqalam fills it.
3. "How to check that a transcript is real in ten seconds" — parent — trust — a how-to: type the code on the public check page.
4. "Year-end promotion, decided by rules you wrote, not by memory" — principal — trust — the principal sets attendance and pass rules, reviews the list, overrides where needed, approves.
5. "When did you last hear about your child's report card before it came home in a school bag?" — parent — trust — a question to the reader about the published-and-notified moment.

## Connects to

- [Exams](../exams/SPOTLIGHT.md)
- [Gradebook](../listings/grades/SPOTLIGHT.md)
- [Assignments](../listings/assignments/SPOTLIGHT.md)
- [Attendance](../attendance/SPOTLIGHT.md)
- [Document templates](../documents/SPOTLIGHT.md)
- [Parent portal](../parent-portal/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/grades/README.md
- src/components/school-dashboard/grades/ISSUE.md
- src/components/school-dashboard/grades/CLAUDE.md
- src/components/school-dashboard/grades/actions/ (promotion.ts, report-cards.ts, share.ts, transcripts.ts)
- src/components/school-dashboard/grades/transcripts/verify-content.tsx
- src/components/school-dashboard/listings/grades/ISSUE.md
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/grades/ (reports, promotion, transcripts, templates pages)
- src/app/[lang]/verify/transcript/[code]/page.tsx
- src/app/api/cron/term-end-report-cards, src/app/api/cron/process-report-card-pdfs
- src/routes.ts
- content/docs-en/exams.mdx
- content/docs-en/marketing-brief.mdx
