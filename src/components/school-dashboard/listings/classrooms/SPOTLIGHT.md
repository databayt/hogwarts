---
feature: classrooms
title: Classrooms
status: live
pillar: school-operations
personas: [owner, principal, teacher]
routes: [/ar/s/{school}/classrooms, /ar/s/{school}/classrooms/configure, /ar/s/{school}/classrooms/{room}]
screenshots: []
readme: none
docs: content/docs-en/classrooms.mdx
updated: 2026-09-27
---

# Classrooms — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every room in the school, and every section of every grade, set up in one place, with each room's weekly schedule on its own page.

## The school's day without it

At the start of the year the deputy head draws the grades and their sections (A, B, C) on a whiteboard, then works out which room each one gets. The room list lives in one notebook and the timetable in another, so nobody can say quickly whether the science lab is free on Tuesday third period. When a new section opens mid-year, someone has to update every copy by hand.

## What happens in Balqalam

1. The admin opens Classrooms and sees the room list, with four summary cards on top: total rooms, total seats, average room size, and how many rooms are in use.
2. On the Configure tab, they set how many sections each grade has and how many students each section holds. One button can apply the same numbers to every grade.
3. Pressing generate creates the missing sections and one main room for each. Rooms are named by section letter and grade number (for example A01, B01 for Grade 1), and an Arabic-language school gets Arabic section letters.
4. The school can add, edit or delete any room by hand: its name, its type (classroom, lab, hall and others) and its capacity, and optionally tie it to one grade or leave it shared.
5. A "Sync defaults" button re-creates any missing default rooms and sections without touching the ones that exist.
6. Opening a room shows its weekly schedule (class, subject, teacher, period), the classes that use it, and how busy it is across the week.

## Who it is for

- Owner: sees in one screen how many rooms and seats the school has.
- Principal: sets sections per grade once and gets a room for each, instead of building the list by hand.
- Teacher: can look up any room and its weekly schedule (read-only).

## Real screens to show

None yet — capture with /record. Routes to capture (Arabic, admin login on the demo school):

- /ar/s/{school}/classrooms — room list with the four summary cards.
- /ar/s/{school}/classrooms/configure — sections-per-grade screen.
- /ar/s/{school}/classrooms/{room} — one room's weekly schedule.
  When capturing, close the "quick guide" welcome pop-up first, keep the red development "Issues" badge out of frame, and crop any photo avatar or demo account name in the top bar.

## What you can say

- The school sets the number of sections per grade and the students per section, and the rooms are created for it. [classrooms/configure/actions.ts]
- Room names follow a simple pattern, section letter plus grade number (A01, B12), and Arabic schools get Arabic section letters (أ، ب، ج). [src/components/catalog/room-naming.ts]
- It will not create a section larger than its room, and it tells you which room is too small. [classrooms/configure/actions.ts]
- A room that still has classes, timetable periods or scheduling rules attached cannot be deleted by accident; the school is told what is still using it. [classrooms/actions.ts]
- Each room has its own page with its weekly schedule and the classes that use it. [classrooms/detail/room-detail.tsx]
- The room list shows total rooms, total seats, average capacity and share of rooms in use at the top. [classrooms/content.tsx]
- The timetable will not book the same room twice in the same period. [docs-en/classrooms.mdx]

## Do not say

- Do not call this "facility management" or "campus maps". The separate facilities page is static sample data and does not read these rooms. [docs-en/classrooms.mdx]
- Do not say staff can manage rooms. The admin manages rooms; staff and teachers can view only. (Staff currently see the add and edit buttons, but the system refuses the change.)
- Do not show or promise a "Create class" screen from this area. The "create class" link from the dashboard and command menu opens a placeholder page.
- Do not quote the occupancy percentage as a result ("rooms 90% used"). It is a live figure per school, not a measured outcome.
- Do not use hours or money saved, "advanced analytics", or "works offline".
- Do not use the retired product codename or show demo accounts with real actors' photos or Harry Potter character names.

## Post angles

1. "Grade 1 has three sections this year. How long does it take you to set up the rooms?" — principal — school-operations — Pain scene: the whiteboard and notebook versus one screen that generates sections and rooms.
2. "Set the number of sections. The rooms appear." — principal — product-proof — Short screen recording of the Configure tab generating A01, B01, أ01.
3. "Is the lab free on Tuesday, third period?" — teacher — school-operations — Question to the reader, answered by opening the room's weekly schedule.
4. "How to set up your sections in Balqalam, in three steps" — owner — product-proof — How-to carousel: sections per grade, students per section, generate.
5. "A section can't be bigger than its room" — principal — trust — Show the warning when section capacity exceeds the room, as proof the system checks the basics.

## Connects to

- [Classes](../classes/SPOTLIGHT.md) — every class is held in one of these rooms.
- [Students](../students/SPOTLIGHT.md) — students are placed into grades and sections elsewhere; the section's room becomes their homeroom.
- [Subjects](../subjects/SPOTLIGHT.md) — subjects are taught per grade in these rooms.
- [Timetable](../../timetable/SPOTLIGHT.md) — every timetable period books a room from this list.
- [Attendance](../../attendance/SPOTLIGHT.md) — the section is the roster unit attendance is taken for.

## Sources

- src/components/school-dashboard/listings/classrooms/content.tsx
- src/components/school-dashboard/listings/classrooms/actions.ts
- src/components/school-dashboard/listings/classrooms/table.tsx
- src/components/school-dashboard/listings/classrooms/form.tsx
- src/components/school-dashboard/listings/classrooms/permissions.ts
- src/components/school-dashboard/listings/classrooms/authorization.ts
- src/components/school-dashboard/listings/classrooms/sync-classrooms-button.tsx
- src/components/school-dashboard/listings/classrooms/configure/content.tsx
- src/components/school-dashboard/listings/classrooms/configure/actions.ts
- src/components/school-dashboard/listings/classrooms/detail/room-detail.tsx
- src/components/catalog/room-naming.ts
- src/components/school-dashboard/listings/classes/create/content.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/classrooms/ (layout, page, configure, create, [id])
- src/components/template/platform-sidebar/config.ts
- src/components/internationalization/school-ar.json, school-en.json (classrooms keys)
- content/docs-en/classrooms.mdx
- content/docs-en/marketing-brief.mdx
