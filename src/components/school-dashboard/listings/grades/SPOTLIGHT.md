---
feature: listings/grades
title: Gradebook
status: partial
pillar: school-operations
personas: [teacher, principal, student, parent]
routes: [/ar/s/{school}/grades, /ar/s/{school}/grades/{id}, /ar/s/{school}/parent/children/{child}/grades]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Gradebook — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every mark a student earns, from homework to exams, sits in one list the teacher can search, and students and parents see their own marks there too.

## The school's day without it

Each teacher keeps marks in a personal notebook or spreadsheet, in their own format. When the principal asks how a class is doing, someone has to collect the notebooks. Parents only find out about a weak mark when the term report arrives, and a lost notebook means lost marks.

## What happens in Balqalam

1. The teacher opens Grades and sees one table of marks: student, assignment or exam, class, score, maximum score, percentage and letter grade.
2. To add a mark, the teacher picks the student and what it is for (a class, an assignment, an exam or a subject), then enters the score, the maximum score and optional written feedback.
3. The percentage is worked out automatically, and a score above the maximum is refused.
4. Marks from exams marked in Balqalam arrive in the same list on their own, so the teacher does not re-enter them.
5. Staff can search and filter the list, and open any mark to see its detail.
6. A student who opens Grades sees only their own marks; a parent sees only their own children's marks.

## Who it is for

- **Teacher**: one place for every mark, with feedback attached, instead of a private notebook.
- **Principal**: the school's marks in one searchable list rather than scattered across teachers' files.
- **Student**: their own marks and teacher feedback, in one list.
- **Parent**: their children's marks, from the parent area, without waiting for the term report.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, demo.balqalam.com): `/ar/s/{school}/grades` as a teacher (the table) and as a student on a phone (own marks only), the add-mark steps from the same page, and `/ar/s/{school}/parent/children/{child}/grades` as a parent.

## What you can say

- Adding a mark is two short steps: choose the student and what the mark is for, then enter score, maximum and feedback. [wizard/selection/form.tsx; wizard/scoring/form.tsx]
- Percentages are calculated for the teacher, and a score higher than the maximum cannot be saved. [ISSUE.md "MVP Checklist"]
- Exam results finalized in Balqalam are written into this same gradebook, the one report cards are built from. [../../grades/CLAUDE.md "Gradebook spine"]
- Students see only their own marks and parents only their own children's; asking for another student's marks is blocked. [ISSUE.md "Recently Fixed"]
- Each school's marks are kept separate from every other school's. [ISSUE.md "MVP Checklist"]

## Do not say

- "GPA and class rank in the gradebook." The gradebook screen has no GPA or rank; those appear on report cards. [ISSUE.md "P1"]
- "Grade matrix" or "spreadsheet view of students by assignments" — not built. [ISSUE.md "P2"]
- "Grade distribution charts" or "advanced analytics" — not built.
- "Bulk mark entry" — mentioned in the engineering notes but not present on this screen.
- "Set your own grading scale" — the letter scale is the default A+ to F; per-school scales have no screen yet.
- "Students can download their report card from here" — students have no own report-card or transcript view yet.
- Hours saved, percentages of anything, "works offline".

## Post angles

1. "The marks are in Ustaz Ahmed's notebook. Ustaz Ahmed is on leave." — principal — school-operations — a pain scene about marks living in private notebooks versus one school gradebook. (Illustrative name; not a real teacher.)
2. "Score, maximum, feedback. The percentage does itself." — teacher — product-proof — a short screen recording of entering one mark.
3. "How your child's marks reach your phone before the report card does" — parent — trust — a how-to from the parent area.
4. "Exam marked on Tuesday, in the gradebook on Tuesday" — teacher — school-operations — a persona view on exam results flowing in without retyping.
5. "Where do your teachers keep their marks today?" — principal — school-operations — a question to the reader.

## Connects to

- [Report cards, transcripts and promotion](../../grades/SPOTLIGHT.md)
- [Exams](../../exams/SPOTLIGHT.md)
- [Assignments](../assignments/SPOTLIGHT.md)
- [Parent portal](../../parent-portal/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/listings/grades/README.md
- src/components/school-dashboard/listings/grades/ISSUE.md
- src/components/school-dashboard/listings/grades/columns.tsx
- src/components/school-dashboard/listings/grades/wizard/selection/form.tsx
- src/components/school-dashboard/listings/grades/wizard/scoring/form.tsx
- src/components/school-dashboard/grades/CLAUDE.md
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/grades/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/grades/[id]/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/children/[id]/grades/page.tsx
- content/docs-en/marketing-brief.mdx
