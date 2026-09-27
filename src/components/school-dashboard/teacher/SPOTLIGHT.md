---
feature: teacher
title: Teacher Home Screen (unused design)
status: not-shipped
pillar: school-operations
personas: [teacher]
routes: []
screenshots: []
readme: none
docs: none
updated: 2026-09-27
---

# Teacher Home Screen (unused design) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

This folder holds an early design for a teacher's home screen that no teacher ever sees; what teachers really see after signing in lives in the Dashboard.

## The school's day without it

A teacher starts the morning by checking a timetable taped inside a cupboard door, counts which homework is still unmarked from a pile of exercise books, and hears about the week's exams in the staff room. This folder was an early attempt at one screen for all of that. The need is real — but this particular screen was never switched on.

## What happens in Balqalam

Nothing, from this folder. The screen here is not connected to any page. It was built to be fed data by a page that was never written.

What a teacher actually sees today comes from the **Dashboard**:

1. After signing in, the teacher lands on their own home screen.
2. On a phone, a banner at the top names the most important thing to do now — for example, classes that still need their attendance taken — and one tap opens the right screen.
3. Below it, today's classes are listed as a one-day timetable. A class drops off the list when it ends, the class in progress is marked, and a Join button appears for a class that is also running online.
4. Quick-action buttons lead to Attendance and the teacher's other daily screens.

Write about that, using the Dashboard Spotlight.

## Who it is for

- **Teacher:** the intended user. Today they are served by the Dashboard, not by this folder.

## Real screens to show

None — this screen is never shown to anyone. Do not capture it.

For the teacher's real home screen, capture `/ar/s/{school}/dashboard` signed in as teacher@balqalam.com on the demo, at phone width (banner and today's classes) and at desktop width. `profile-teacher-ar.png` is the teacher's profile page, not the home screen, and `quick-attendance-teacher-mobile.png` belongs to Attendance.

## What you can say

- Nothing about this folder's design. It is not in the product. [dashboard.tsx — not imported by any page]
- For teachers, use the claims in the Dashboard Spotlight instead; for example, that a teacher's list of today's classes clears itself as the day goes on and marks the class happening now. [../dashboard/teacher-client.tsx]
- And that a teacher's phone home screen opens with the one next thing to do, such as classes still waiting for their attendance. [../dashboard/content.tsx, ../dashboard/next-action-rank.ts]

## Do not say

- Anything shown only in this design: the "current class / next class" hero with a countdown, the today-or-week schedule switch, the "Class Performance" chart per class with attendance and submission rates, the assignments list with submitted-of-total counts, or the headline totals (students, classes, average attendance, pending grading). None of these reach a teacher from this folder.
- That the teacher home screen shows class averages or performance trends. The live screen currently shows today's classes and a count of them, not performance charts. [../dashboard/teacher-client.tsx]
- "Real-time" or "advanced analytics" for the teacher view.
- Global bans: hours saved, percentages as outcomes, "works offline", "download our app", paying customers.

## Post angles

Do not post about this yet. It is an unused design.

For teacher posts, use the angles in:

1. [Dashboard](../dashboard/SPOTLIGHT.md) — "Open your phone. It already knows what you need to do first."
2. [Attendance](../attendance/SPOTLIGHT.md) — the register taken in seconds from the teacher's phone.
3. [Timetable](../timetable/SPOTLIGHT.md) — a teacher's day, with no double-booked rooms.
4. [Messaging](../messaging/SPOTLIGHT.md) — parents reaching a teacher inside the school's system, not on a personal phone.
5. [Parent Portal](../parent-portal/SPOTLIGHT.md) — what a teacher sees when a parent submits an absence excuse.

## Connects to

- [Dashboard](../dashboard/SPOTLIGHT.md) — the live teacher home screen after sign-in.
- [Attendance](../attendance/SPOTLIGHT.md) — the most common next step from the teacher's home screen.

## Sources

- src/components/school-dashboard/teacher/dashboard.tsx (only file in the folder; no page imports it — checked by searching src/ for its import path and component name)
- src/components/school-dashboard/dashboard/teacher.tsx, teacher-client.tsx (the teacher home screen that is actually rendered)
- src/components/school-dashboard/dashboard/content.tsx (chooses the teacher view on /dashboard; phone banner and today's timetable)
- src/components/school-dashboard/dashboard/quick-actions-config.ts
- src/components/school-dashboard/dashboard/SPOTLIGHT.md
- content/docs-en/marketing-brief.mdx
