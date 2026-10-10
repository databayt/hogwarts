---
feature: dashboard
title: Dashboard
status: partial
pillar: school-operations
personas: [owner, teacher, student, parent, finance]
routes: [/ar/s/{school}/dashboard, /ar/s/{school}/dashboard/settings]
screenshots: [docs/evidence/demo-dashboard-ar.png]
readme: ./README.md
docs: content/docs-en/dashboard.mdx
updated: 2026-09-27
---

# Dashboard — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Everyone who signs in lands on a home screen made for their role: a teacher sees today's classes, a parent sees their children, the accountant sees unpaid invoices.

## The school's day without it

A teacher checks a printed timetable taped inside a cupboard door to find the next class. A parent calls the office to ask whether homework is overdue. The accountant scrolls a spreadsheet to count who has not paid. Nobody has one place that says "this is what needs you today".

## What happens in Balqalam

1. A user signs in on the school's own address and is taken to the dashboard. The system knows their role and shows that role's view — student, teacher, parent, accountant, staff or administrator.
2. On a phone, the top of the screen shows today's date with the number of school events today, beside four shortcuts: Notifications, Messages, Lumos and Subjects.
3. Under it, a green banner states the single most important thing to do right now — for example "3 classes still need their attendance today" for a teacher, or "Khadija's homework is overdue" for a parent — and rotates through up to four such items. "Open" goes straight to the right screen.
4. Students and teachers then see today's classes as a one-day timetable. On a weekend or a declared holiday it shows the next school day instead.
5. Four quick-action buttons follow, chosen for the role — a teacher gets Attendance, Grades, Assignments and Schedule; a parent gets Children, Grades, Attendance and Contact Teacher; the accountant gets Invoices, Fees, Finance and Receipts.
6. On a larger screen the page adds charts, a usage table and the invoice history for that role.

## Who it is for

- **Owner / administrator:** quick actions into School, Settings, Finance and Staff, plus a count of unpublished announcements waiting for sign-off.
- **Teacher:** today's classes, which drop off the list as each period ends, with a "Now" badge on the class in progress and a Join button for classes that are also online. Reminders to mark submissions and take attendance.
- **Student:** today's timetable, overdue and upcoming assignments, next class, and fee payments.
- **Parent:** each child's grades, attendance rate, upcoming homework and school announcements, taken from the school's real records.
- **Accountant:** counts of unpaid and overdue invoices, and the invoice history.

## Real screens to show

- `docs/evidence/demo-dashboard-ar.png` — the administrator view in Arabic, full page. **Out of date, do not post as-is:** it shows a "Quick Guide" pop-up that no longer opens, and an attendance overview (91%, 196 students) that was sample data and has since been removed from the product.
- Nothing yet shows the phone view (the date widget, the green next-action banner, today's classes). Capture with /record:
  - `/ar/s/{school}/dashboard` at phone width, signed in as teacher, parent and student (demo accounts at demo.balqalam.com, password in the marketing brief).
  - The same route at desktop width as teacher.

## What you can say

- Each role opens on its own home screen — student, teacher, parent, accountant, staff, administrator. [content.tsx]
- On a phone, the dashboard tells a teacher, student, parent or accountant the one thing they should do next, and takes them there in one tap. [next-action-rank.ts, school-en.json "nextAction"]
- A teacher's list of today's classes clears itself as the day goes on and marks the class happening now. [README.md "The today card clears itself"]
- Students and teachers see today's timetable on their phone; on a weekend it shows the next school day. [today-timetable.tsx, README.md]
- Parents see their children's grades, attendance and upcoming homework from the school's actual records. [actions.ts getParentDashboardData]
- Four quick actions per role lead straight to the screens that role uses most. [quick-actions-config.ts]
- The Arabic interface is written for Arabic, including how a child's name is shortened on the card (so "Abd al-Rahman" is never cut to "Abd"). [next-action-rank.ts]

## Do not say

- Anything about a **principal dashboard** — the view exists in the code but no user can reach it. [ISSUE.md]
- "Real-time", "live updates" or "advanced analytics" — there is no live refresh, and the charts are not finished: several draw blank because of a known colour bug. [ISSUE.md]
- Any number shown on the "Upcoming" flip card on desktop — it shows the same sample text to every school ("Storage usage at 85%", "2 active issues", "Math Homework"). Crop it out of any screenshot. [ISSUE.md, README.md]
- That staff get a personalised to-do list — the staff reminders are placeholder items today. [upcoming-queries.ts]
- That the accountant dashboard shows money in the school's currency — it currently prints "$" for every school, and several accountant and admin labels are English only. [ISSUE.md]
- Attendance percentages or student counts from `docs/evidence/demo-dashboard-ar.png` — they were invented sample data.
- Global bans: hours saved, percentages, "works offline", "download our app", uptime, paying customers.

## Post angles

1. "Open your phone. It already knows what you need to do first." — teacher — school-operations — the green banner turns a busy morning into one clear next step.
2. "Which classes still need their register today?" — teacher — product-proof — a screen recording of the banner saying how many classes still need attendance, one tap into the register.
3. "Every parent, every child, one screen." — parent — school-operations — a parent sees grades, attendance and homework for each child without calling the office.
4. How to: "Three taps from sign-in to your next class" — student — product-proof — sign in, see today's timetable, see what is due.
5. "What is the first thing your teachers check each morning?" — principal — school-operations — a question post that leads into the role-based home screen.

## Connects to

- [Attendance](../attendance/SPOTLIGHT.md) — the teacher's "attendance due" reminder and the parent's attendance rate.
- [Timetable](../timetable/SPOTLIGHT.md) — the day timetable on the phone is the timetable's own day view.
- [Announcements](../listings/announcements/SPOTLIGHT.md) — unpublished announcements appear as approvals for the administrator.
- [Events](../listings/events/SPOTLIGHT.md) — the phone date widget counts today's events.

## Sources

- src/components/school-dashboard/dashboard/README.md
- src/components/school-dashboard/dashboard/ISSUE.md
- src/components/school-dashboard/dashboard/content.tsx
- src/components/school-dashboard/dashboard/next-action-rank.ts
- src/components/school-dashboard/dashboard/upcoming-queries.ts
- src/components/school-dashboard/dashboard/quick-actions-config.ts
- src/components/school-dashboard/dashboard/parent.tsx
- src/components/school-dashboard/dashboard/actions.ts (getParentDashboardData)
- src/components/internationalization/school-en.json (dashboard.homeWidget, dashboard.nextAction)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/dashboard/page.tsx and settings/page.tsx
- content/docs-en/dashboard.mdx
- content/docs-en/marketing-brief.mdx
- docs/evidence/demo-dashboard-ar.png, docs/evidence/demo-home-ar.png (the second is the public homepage, not the dashboard — excluded)
