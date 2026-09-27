---
feature: timetable
title: Timetable
status: live
pillar: school-operations
personas: [owner, principal, teacher, student, parent]
routes: [/ar/s/{school}/timetable, /ar/s/{school}/timetable/full, /ar/s/{school}/timetable/generate, /ar/s/{school}/timetable/conflicts, /ar/s/{school}/timetable/settings, /ar/s/{school}/timetable/analytics]
screenshots: []
readme: ./README.md
docs: content/docs-en/timetable.mdx
updated: 2026-09-27
---

# Timetable — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school's weekly schedule is built for it, checked so no teacher, room or class is booked twice, and every teacher, student and parent sees their own week on their phone.

## The school's day without it

Before term starts, a deputy head sits with a large sheet of paper or a spreadsheet for days, fitting subjects into periods for every class. Two weeks in, someone finds a teacher booked in two rooms at once and the whole sheet is redone. The final version is photographed and posted in a WhatsApp group, and students copy it into their notebooks.

## What happens in Balqalam

1. When the school is set up, it picks a school-day structure (working days, periods, break), with a recommended one for its country already selected — for example a Sudanese day with one mid-morning break and no lunch period.
2. Balqalam fills the week for every class section automatically from the subjects each grade studies, placing a teacher who teaches that subject where one is free and leaving the slot marked "Unassigned" where none is.
3. The admin can also open Generate, preview a full timetable, and apply it only when happy with it.
4. The admin clicks any cell in the grid to add or change a lesson; the save is refused if it would put a teacher, a room or a class in two places at the same period.
5. The Conflicts page lists every double-booking across the term so it can be fixed in one place.
6. Teachers see their own teaching week, students see their class's week (a single day by default on a phone), and parents see each child's week. A lesson that is running online today shows a Join button in the grid.
7. The timetable prints cleanly on A4 from the browser.

## Who it is for

- **Owner / principal:** a complete, clash-free schedule for every class without weeks of manual work, and one place to see and fix conflicts.
- **Teacher:** their own week and the current and next class at a glance; they are notified in the app when one of their lessons is moved or removed.
- **Student:** their class's week on their phone, and a Join button when a lesson is online.
- **Parent:** each child's weekly schedule, switchable between children.

## Real screens to show

None yet — capture with /record. Routes to capture (demo school, Arabic):

- `/ar/s/{school}/timetable` as admin (full week grid with subject colours and the class/teacher filter)
- `/ar/s/{school}/timetable/generate` (preview before applying)
- `/ar/s/{school}/timetable/conflicts`
- `/ar/s/{school}/timetable/settings` (school-day structure preview)
- `/ar/s/{school}/timetable` as student on a phone (single-day view)
- `/ar/s/{school}/timetable` as parent (child selector)

## What you can say

- Every school gets a full weekly timetable generated automatically from its grades and subjects — no button press required. [docs-en/timetable.mdx]
- The timetable will not let you book the same teacher, room or class twice in the same period. [actions.ts, docs-en/timetable.mdx]
- There is a separate Conflicts page that finds every double-booking in the term. [README.md, conflicts/content.tsx]
- You can preview a generated timetable before you apply it. [docs-en/timetable.mdx, generate/content.tsx]
- Teachers, students and parents each see their own version of the schedule; parents can switch between their children. [views/role-router.tsx, docs-en/timetable.mdx]
- The school day follows the school's reality — a Sudanese government-school day runs 07:30 to 14:40 in 8 periods of 45 minutes with a single mid-morning break. [docs-en/timetable.mdx]
- Class and room names follow the school's language: an Arabic school gets Arabic section letters. [docs-en/timetable.mdx]
- When a lesson is online today, students and parents can join it straight from the timetable. [README.md, docs-en/timetable.mdx]

## Do not say

- "Drag and drop your timetable." Editing is click-based; drag-and-drop is still on the to-do list. [ISSUE.md]
- "Arrange cover for absent teachers" or anything about substitutions — the substitution tools are built but have no screen yet. [docs-en/timetable.mdx]
- "Save and reuse timetable templates" or "copy last term's timetable" — the template tools have no screen. [docs-en/timetable.mdx, ISSUE.md]
- "Download your timetable as a PDF" — there is no download button on any timetable view today; say it prints on A4 from the browser.
- "Students can print or export their timetable" — that option was removed with the student header card. [ISSUE.md]
- "Hijri calendar support" — does not exist. [marketing-brief.mdx]
- "Advanced analytics" — say "timetable reports". [marketing-brief.mdx]
- Any hours or percentage saved, any school count beyond King Fahad Schools, or that King Fahad Schools produced any particular result.

## Post angles

1. "The timetable sheet that took two weeks — and broke in week three." — principal — school-operations — The pain scene of hand-building a schedule, then the clash nobody saw, answered by a generated, clash-checked week.
2. "Try to book one teacher in two rooms. It will say no." — principal — product-proof — A short screen recording of the slot editor refusing a double-booking.
3. "How to get your first timetable: set your school day, then look." — owner — school-operations — A how-to showing the structure choice in settings and the grid that is already filled.
4. "Your child's week, on your phone, for every child." — parent — school-operations — The parent view with the child switcher, and the Join button when a lesson is online.
5. "Who builds the timetable at your school, and how long does it take them?" — principal — school-operations — A question post inviting school staff to share their own scheduling routine.

## Connects to

- [Attendance](../attendance/SPOTLIGHT.md) — class registers follow the same sections and periods.
- [Live classes](../live/SPOTLIGHT.md) — online lessons appear on the timetable with a Join button.
- [Parent portal](../parent-portal/SPOTLIGHT.md) — parents see each child's timetable.
- [Notifications](../notifications/SPOTLIGHT.md) — teachers are told when their lessons move or are removed.

## Sources

- src/components/school-dashboard/timetable/README.md
- src/components/school-dashboard/timetable/ISSUE.md
- src/components/school-dashboard/timetable/FEATURES.md
- src/components/school-dashboard/timetable/actions.ts
- src/components/school-dashboard/timetable/views/ (role views, grid)
- src/components/school-dashboard/timetable/export/index.ts
- src/components/school-dashboard/timetable/content.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/timetable/layout.tsx
- content/docs-en/timetable.mdx
- content/docs-en/marketing-brief.mdx
- src/components/internationalization/school-en.json, school-ar.json (timetable keys)
