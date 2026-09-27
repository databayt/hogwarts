---
feature: classes
title: Classes
status: partial
pillar: school-operations
personas: [principal, teacher]
routes: [/ar/s/{school}/classes/add/{id}/information, /ar/s/{school}/classes/add/{id}/schedule, /ar/s/{school}/classes/add/{id}/management]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Classes — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A class is one subject, taught to one grade, by one teacher, in one room, during a term — and attendance, exams and report cards are built on it.

## The school's day without it

The deputy head keeps a spreadsheet of who teaches what to which grade, and it rarely matches the timetable pinned on the staffroom wall. When a teacher changes, three lists need updating and one of them is always forgotten. At report-card time, marks arrive per teacher and have to be matched to the right grade and subject by hand.

## What happens in Balqalam

Today most schools never see a "Classes" screen: the classes are set up for them behind the scenes and show up inside the timetable, attendance and exams. The screens that exist are:

1. A three-step "add class" form. Step one: the class name, subject, teacher, grade, course code and how it is marked (percentage, GPA or weighted average).
2. Step two: the term, the first and last period, the room, and how many weeks it runs.
3. Step three: credits, the minimum and maximum number of students, and an optional class that must be taken first.
4. Once saved, the class feeds the rest of the system: exams are set per class, report cards pull marks per class, and attendance can be taken per class.

## Who it is for

- Principal: one record per subject, grade and teacher, so the timetable, attendance and marks all agree.
- Teacher: their classes are what they take attendance and set exams for.

## Real screens to show

None yet — capture with /record. There is no class list page to capture today. Screens that exist:

- /ar/s/{school}/classes/add/{id}/information, /schedule, /management — the three-step form (needs a draft class id; there is no button that opens it from the dashboard today).
  Better stand-ins for posts: the timetable and attendance screens, where classes are visible in use.
  When capturing, close the "quick guide" welcome pop-up, keep the red development "Issues" badge out of frame, and crop any photo avatar or demo account name.

## What you can say

- Each class ties together a subject, a grade, a teacher, a room and a term. [classes/wizard/information/form.tsx, classes/wizard/schedule/form.tsx]
- A class can be marked as a percentage, by GPA, or by weighted average. [classes/wizard/information/form.tsx]
- A class records a minimum and maximum number of students. [classes/wizard/management/form.tsx]
- Exams and report cards are organised per class, and attendance can be taken per class. [grades/lib/report-cards-core.ts, exams/results/content.tsx, attendance/actions/core.ts]
- A class can be linked to another class that must come first. [classes/wizard/management/form.tsx]

## Do not say

- Do not show or promise a "Classes" page or class list. The old list page was folded into Classrooms in February 2026 and no longer has its own screen; the list, export button, bulk delete and capacity views in this folder are not reachable. [git history; src/app routes]
- Do not say "create a class in one click" or show a create-class screen. The "create class" link opens a placeholder page, and the three-step form has no entry button today.
- Do not say the system checks teacher availability or prevents a teacher being booked twice from here. Teacher conflict checks are not built in this feature. [ISSUE.md] (The timetable is where double-booking is prevented.)
- Do not say the system stops a class from being over-filled. The size-limit check exists but there is no screen that enrols students into a class today.
- Do not claim subject-teacher assignment, co-teaching or class performance analytics. The screen exists but is not reachable, and analytics per class is not built. [ISSUE.md]
- Do not mention waitlists, seating plans, transfers between classes or bulk enrolment — all listed as future work. [ISSUE.md]
- Global bans: no hours or money saved, no "advanced analytics", no "works offline", never the retired product codename, no real actors' photos or Harry Potter names from the demo accounts.

## Post angles

Hold posts that are about managing classes directly until a class list screen returns. The angles below talk about what is true today.

1. "Who teaches Grade 7 maths this term? Your timetable, your register and your report cards should all agree." — principal — school-operations — Pain scene: three lists drifting apart versus one class record used everywhere.
2. "Percentage, GPA or weighted average — each class can be marked its own way." — principal — product-proof — Show the marking choice on the class form.
3. "One class, one room, one teacher, one term" — teacher — school-operations — Persona view: what a teacher's class looks like when attendance and exams hang off it.
4. "Does your timetable know who teaches what?" — principal — school-operations — Question to the reader: if the answer lives in a spreadsheet, it will drift from the register.
5. "From the register to the report card, the class is the thread" — owner — product-proof — Walk through attendance, then exams, then the report card, all for the same class.

## Connects to

- [Classrooms](../classrooms/SPOTLIGHT.md) — every class is held in a room; the old class list now lives under this area.
- [Subjects](../subjects/SPOTLIGHT.md) — each class teaches one subject.
- [Teachers](../teachers/SPOTLIGHT.md) — each class has a teacher.
- [Students](../students/SPOTLIGHT.md) — students are enrolled into classes.
- [Timetable](../../timetable/SPOTLIGHT.md) — class periods and rooms.
- [Attendance](../../attendance/SPOTLIGHT.md) — attendance can be taken per class.
- [Exams](../../exams/SPOTLIGHT.md) — exams are set and marked per class.
- [Grades](../grades/SPOTLIGHT.md) — report cards pull marks per class.

## Sources

- src/components/school-dashboard/listings/classes/README.md
- src/components/school-dashboard/listings/classes/ISSUE.md
- src/components/school-dashboard/listings/classes/actions.ts
- src/components/school-dashboard/listings/classes/content.tsx
- src/components/school-dashboard/listings/classes/table.tsx
- src/components/school-dashboard/listings/classes/create/content.tsx
- src/components/school-dashboard/listings/classes/wizard/config.ts
- src/components/school-dashboard/listings/classes/wizard/actions.ts
- src/components/school-dashboard/listings/classes/wizard/information/form.tsx
- src/components/school-dashboard/listings/classes/wizard/schedule/form.tsx
- src/components/school-dashboard/listings/classes/wizard/management/form.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/classes/add/[id]/ (layout and three step pages)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/classrooms/create/page.tsx
- git commit 44e392186 (Feb 2026: classes routes migrated to classrooms)
- content/docs-en/classrooms.mdx (Class section, integration table)
- content/docs-en/marketing-brief.mdx
