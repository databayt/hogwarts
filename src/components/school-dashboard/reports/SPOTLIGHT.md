---
feature: reports
title: Report Cards
status: partial
pillar: school-operations
personas: [principal, teacher, parent, student]
routes: [/ar/s/{school}/exams/report-cards, /ar/s/{school}/grades/reports, /ar/s/{school}/parent/children/{id}/report-cards]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Report Cards — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

At the end of a term the school turns its exam marks into a report card for every student, checks them, and releases them to families with one button.

## The school's day without it

At term end, teachers copy marks from their notebooks into a spreadsheet, someone works out averages and letter grades by hand, and the office types and prints a card per child. Mistakes are found after the cards go home. Parents who miss the collection day never see the card, and the office answers the same "where is my child's report?" call again and again.

## What happens in Balqalam

1. A teacher or administrator opens Report Cards and picks the term. The page shows how many cards exist, how many are published, and how many have a PDF ready.
2. They press "Generate Report Cards" and choose a class. The system gathers that term's exam results for each student and works out a grade per subject, an overall grade and a GPA.
3. Each card also carries the student's days present, absent and late, and a class rank.
4. The cards appear in a table as "Draft", so staff can review them before anyone outside the school sees them.
5. Staff press "Publish". The cards switch to "Published", and the student and their guardians get a "report card ready" notice (in the app, by email and by WhatsApp where the school has those set up).
6. A PDF of each published card is produced shortly afterwards in the background. Staff can open or download it from the table; Arabic cards are laid out right to left.
7. When a term's end date passes, the system also drafts that term's cards on its own overnight — but it never publishes them. A person still presses Publish.

## Who it is for

- **Principal:** one screen showing which classes have cards, which are still drafts, and which have gone out.
- **Teacher:** no retyping marks into a separate template; the card is built from the exam results already entered.
- **Parent:** a notice when the card is ready, and the card in the parent's own view of their child.
- **Student:** the same notice, and their card available once published.

## Real screens to show

None yet — capture with /record. Routes to capture (demo school, Arabic):

- `/ar/s/demo/exams/report-cards` — term badges, the three counters, the draft/published table
- `/ar/s/demo/grades/reports` — the second report-card screen (rank, attendance columns)
- `/ar/s/demo/parent/children/{id}/report-cards` — what a parent sees
- A downloaded Arabic PDF card, opened full screen

## What you can say

- Report cards are built from the exam results the school already entered — no retyping. [grades/lib/report-cards-core.ts]
- Each card shows subject grades, an overall grade, a GPA, a class rank, and days present, absent and late. [grades/lib/report-cards-core.ts]
- Cards start as drafts; nothing reaches a family until a staff member presses Publish. [reports/content.tsx, api/cron/term-end-report-cards]
- Publishing notifies the student and their guardians in the app, by email and on WhatsApp. [reports/actions.ts, grades/actions/notifications.ts]
- Every card becomes a PDF the school can open, download and print; Arabic cards read right to left. [file/generate/report-card.tsx, api/cron/process-report-card-pdfs]
- Only administrators and teachers can generate or publish cards. [reports/actions.ts]
- The screen is fully in Arabic and English, including the empty-state guidance. [dictionaries/ar/results.json]

## Do not say

- Do not say the school can set its own grading scale. The standard A+ to F scale is what the cards use today; a school-specific scale is not yet reachable from any screen. [ISSUE.md]
- Do not say cards carry the school's own design, logo layout or custom sections — every school gets the same layout. [ISSUE.md]
- Do not say the PDF is instant. It is produced in the background after publishing; the "PDF ready" counter shows when it is done.
- Do not say cards are emailed as PDF attachments. Families get a notice and view the card in Balqalam.
- Do not promise a one-click download of a whole class as one file — not built. [ISSUE.md]
- Do not quote time saved ("hours saved at term end") or any percentage. Global ban.
- Do not show a real student's name, marks or face on a card without consent. Use the demo school.

## Post angles

1. "Term ends Thursday. Report cards go out Thursday." — principal — school-operations — Generate from the marks already entered, review as drafts, publish in one press.
2. "A report card that prints properly in Arabic." — owner — product-proof — Show the Arabic PDF laid out right to left, with grades, GPA and attendance on one page.
3. "How to release a class's report cards in three steps" — teacher — school-operations — Pick the term, generate for the class, publish; the parents are notified.
4. "The parent who never came to collection day" — parent — school-operations — The card arrives as a notice on the parent's phone instead of in a school bag.
5. "How many 'where is my child's report?' calls does your office take each term?" — principal — school-operations — A question post that ends in book a demo.

## Connects to

- [Exams](../exams/SPOTLIGHT.md) — the marks the cards are built from
- [Grades](../grades/SPOTLIGHT.md) — the second report-card screen and the grade calculation
- [Attendance](../attendance/SPOTLIGHT.md) — days present, absent and late on the card
- [Parent portal](../parent-portal/SPOTLIGHT.md) — where parents read published cards
- [Notifications](../notifications/SPOTLIGHT.md) — the "report card ready" notice

## Sources

- src/components/school-dashboard/reports/README.md
- src/components/school-dashboard/reports/ISSUE.md
- src/components/school-dashboard/reports/actions.ts
- src/components/school-dashboard/reports/content.tsx
- src/components/school-dashboard/reports/generate-button.tsx
- src/components/school-dashboard/reports/publish-button.tsx
- src/components/school-dashboard/grades/actions/notifications.ts
- src/components/school-dashboard/grades/lib/report-cards-core.ts
- src/components/file/generate/report-card.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/report-cards/page.tsx
- src/app/api/cron/process-report-card-pdfs/route.ts
- src/app/api/cron/term-end-report-cards/route.ts
- cf/crons.json
- src/components/internationalization/dictionaries/{en,ar}/results.json
- content/docs-en/marketing-brief.mdx
