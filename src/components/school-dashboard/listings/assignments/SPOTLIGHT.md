---
feature: assignments
title: Assignments (Homework)
status: partial
pillar: school-operations
personas: [teacher, student, parent, principal]
routes: [/ar/s/{school}/assignments, /ar/s/{school}/assignments/{id}, /ar/s/{school}/my-assignments, /ar/s/{school}/parent/children/{child}/assignments]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Assignments (Homework) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A teacher sets homework for a class with a due date, every student in that class is told, and students hand in their answer from their own account.

## The school's day without it

Homework is written on the board or sent as a photo to a parents' WhatsApp group, and half the class copies it down wrong. Nobody has a list of who handed in what, or who was late. Parents hear about missing homework at the parent-teacher meeting, weeks later.

## What happens in Balqalam

1. The teacher creates an assignment in two short steps: title, description and class first; then the type (homework, quiz, test, project, lab report, essay, presentation and others), points, weight and due date.
2. When the assignment is published, every student in the class gets a notification in the app and by email.
3. The day before it is due, students who have it get a reminder.
4. A student opens "My assignments", sees what is due, types their answer and presses Submit. Work handed in after the due date is marked late automatically.
5. Once a piece of work is marked, the student sees the score and is notified. Graded work is locked so a re-submission cannot wipe the mark.
6. Parents see their child's assignments and due dates from the parent area. Staff can search the assignment list and export it as CSV, Excel or PDF.

## Who it is for

- **Teacher**: homework set once for the whole class, with automatic notices and reminders, and late work flagged.
- **Student**: one list of what is due, a place to hand it in, and their mark when it is graded.
- **Parent**: their child's assignments and due dates without asking the class WhatsApp group.
- **Principal**: every assignment in the school in one searchable, exportable list.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, demo.balqalam.com): `/ar/s/{school}/assignments` as a teacher (the list) and the two-step "add" form; `/ar/s/{school}/my-assignments` as a student on a phone (due work and the Submit box); `/ar/s/{school}/parent/children/{child}/assignments` as a parent.

## What you can say

- New assignments reach every student in the class as an in-app notification and an email. [actions.ts]
- Students with work due in the next 24 hours get a reminder each morning. [src/app/api/cron/assignment-reminders/route.ts]
- Students hand in written answers from "My assignments"; anything after the due date is marked late on its own. [submit-core.ts; my-assignments-content.tsx]
- Once work is graded it is locked, so a late re-submission cannot overwrite the mark, and the student is notified of the score. [submit-core.ts; grade-core.ts]
- Nine assignment types, from homework to presentations, each with points, weight and a due date. [ISSUE.md "MVP Checklist"; config.ts]
- The assignment list exports to CSV, Excel or PDF. [export-button.tsx]

## Do not say

- "Teachers review and grade submissions in the dashboard." On the web, the submissions tab of an assignment is still a placeholder; grading a submission currently happens through the mobile app's connection, not a web screen. [detail.tsx; src/app/api/mobile/assignments/]
- "Students upload files or photos of their homework." The student hand-in box is text only today; file upload is not wired. [submission-card.tsx; ISSUE.md "P1"]
- "Works offline." An answer typed during a dropped connection can be held and sent later, but the brand rule is "built for slow connections", never "offline". [marketing-brief.mdx]
- "Rubrics", "plagiarism detection", "late penalties", "copy to another class" — not built. [ISSUE.md]
- "Parents are notified of every mark." Grade notices go to the student only.
- "Teachers only see their own classes." That restriction is listed as not yet enforced. [ISSUE.md "P1"]
- Hours saved, percentages, homework completion rates.

## Post angles

1. "The homework was on the board. Then someone wiped the board." — student — school-operations — a pain scene: homework lost between the board, a photo and a WhatsApp group, versus one list per student.
2. "Set it once. Every student gets it, and a reminder the day before." — teacher — product-proof — new-assignment notice plus the morning reminder.
3. "How a student hands in homework from their phone" — student — school-operations — a how-to on "My assignments": open, type, submit, see "late" if after the deadline.
4. "What's due this week? Ask the app, not the group chat." — parent — school-operations — a persona view of the child's assignment list.
5. "How do you know who handed in last night's homework?" — teacher — school-operations — a question to the reader.

## Connects to

- [Gradebook](../grades/SPOTLIGHT.md)
- [Report cards, transcripts and promotion](../../grades/SPOTLIGHT.md)
- [Exams](../../exams/SPOTLIGHT.md)
- [Notifications](../../notifications/SPOTLIGHT.md)
- [Parent portal](../../parent-portal/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/listings/assignments/README.md
- src/components/school-dashboard/listings/assignments/ISSUE.md
- src/components/school-dashboard/listings/assignments/actions.ts
- src/components/school-dashboard/listings/assignments/submit-core.ts, submit-actions.ts, grade-core.ts
- src/components/school-dashboard/listings/assignments/submission-card.tsx, my-assignments-content.tsx
- src/components/school-dashboard/listings/assignments/detail.tsx, export-button.tsx, config.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/assignments/ (route tree)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/my-assignments/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/children/[id]/assignments/page.tsx
- src/app/api/cron/assignment-reminders/route.ts
- src/app/api/mobile/assignments/[id]/submissions/[submissionId]/route.ts
- content/docs-en/marketing-brief.mdx
