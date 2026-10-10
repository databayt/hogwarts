---
feature: parent-portal
title: Parent Portal
status: partial
pillar: school-operations
personas: [parent, teacher, principal]
routes: [/ar/s/{school}/parent, /ar/s/{school}/parent/children/{id}, /ar/s/{school}/parent/children/{id}/grades, /ar/s/{school}/parent/children/{id}/report-cards, /ar/s/{school}/parent/children/{id}/attendance, /ar/s/{school}/parent/children/{id}/timetable, /ar/s/{school}/parent/children/{id}/assignments, /ar/s/{school}/parent/announcements, /ar/s/{school}/parent/events]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Parent Portal — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A parent signs in and follows each of their children in one place: grades, report cards, attendance, the week's timetable, homework, school announcements and events.

## The school's day without it

A mother wants to know why her son's maths mark dropped, so she calls the office, waits, and is told the teacher will call back. The report card comes home folded in a school bag, if it comes home at all. An absence note is written on paper, handed to a class teacher, and lost in a drawer. Announcements go to a WhatsApp group of two hundred parents where the important message is buried under replies.

## What happens in Balqalam

1. The parent signs in on the school's own web address and opens "Parent Portal" from the side menu. Only parents can open it; anyone else is sent back to their own home screen.
2. The first screen shows a card for each of their children, with the child's name and student number, and a "Message teachers" button.
3. Tapping a child opens that child's overview: average score, attendance rate, days present out of school days, and the most recent exam results — with a "Message teacher" button beside the child's name.
4. Tabs across the top lead to Grades, Report cards, Attendance, Timetable and Assignments. The timetable tab opens with "Today": the child's classes for the day, and a Join button on any class that is running online at that moment.
5. Report cards the school has published appear in a list with the overall grade, and a Download button for the PDF.
6. On the Attendance tab, the parent sees the absence record and can submit an excuse for an absence: choose a reason (medical, family emergency, transport and others), add a note, and attach up to five files. The class teacher is notified to approve or reject it.
7. Separate pages show school and class announcements, and upcoming school events, where the parent can register when the event asks for registration.

## Who it is for

- **Parent:** one sign-in for every child in the school, with grades, report cards, attendance and homework available any time instead of waiting for a call or a paper.
- **Teacher:** excuses arrive as a notification with the reason and any attached document, instead of a note on paper. Parent messages come through the school's own messaging, not a personal phone.
- **Principal:** parents can only ever see their own children — the portal checks the family link on every page — and report cards reach home the moment they are published.

## Real screens to show

None yet — capture with /record. Sign in on the demo as parent@balqalam.com and capture:

- `/ar/s/{school}/parent` — the children cards and the "Message teachers" button.
- `/ar/s/{school}/parent/children/{id}` — one child's overview cards and recent exams.
- `/ar/s/{school}/parent/children/{id}/timetable` — the "Today" strip with the online Join button.
- `/ar/s/{school}/parent/children/{id}/report-cards` — the published list with Download.
- `/ar/s/{school}/parent/children/{id}/attendance` — the excuse form open, on a phone.

Not suitable: `docs/evidence/profile-parent-ar.png` and `docs/evidence/profile-child-via-parent-ar.png` are profile pages, not the portal. The first uses a film-character photo and fantasy demo text, and both show a developer error badge in the corner. They also show the side-menu entry "Parent portal" in English on an Arabic screen — check that label before recording.

## What you can say

- Parents see each child on their own card and open that child's grades, report cards, attendance, timetable and homework. [README.md, child/tabs.tsx]
- A parent only ever sees their own children; every page checks the link between parent and child. [README.md, actions.ts, report-cards/content.tsx]
- Published report cards can be downloaded as a PDF from the parent's phone. [report-cards/content.tsx, ISSUE.md]
- A parent can submit an absence excuse with a reason, a note and up to five attached files, and the class teacher is notified to review it. [attendance/excuse-form.tsx, attendance/actions/excuses.ts]
- The child's timetable shows today's classes and a Join button when a class is running online. [child-today-live.tsx, dictionaries/en/parentPortal.json]
- When a report card is published or a grade is posted, the parent is notified in the app and by email, and on WhatsApp where the school has connected it and the parent has it switched on. [grades/actions/notifications.ts, ISSUE.md]
- The portal is in Arabic and English. [dictionaries/ar/parentPortal.json]

## Do not say

- "Pay fees in the portal." The Fees link opens a read-only view of the child's fees where the parent can pick a preferred payment method; paying is a separate screen. [fees/page.tsx, my-fees/content.tsx]
- "Message your child's teacher in one tap." The button opens the school's messaging with the parent's children's teachers listed; it does not open the specific teacher yet. [ISSUE.md]
- "Push notifications to your phone." Phone push is still a scaffold. [ISSUE.md]
- "Parent app" or "download the app." It opens in the phone's browser; there is no app-store app.
- That the whole portal is fully Arabic. Some parts (the attendance screen headings, for example "Select Student") still show English, and the excuse reasons show in Arabic even on the English site. Check each screen before posting it. [attendance/view.tsx, attendance/excuse-form.tsx, ISSUE.md]
- Any grade, percentage or attendance figure from a demo screen as if it were a real school's result.
- Global bans: hours saved, percentages as outcomes, "works offline", paying customers, any school name other than King Fahad Schools.

## Post angles

1. "Every parent, every child, one screen." — parent — school-operations — a parent with three children sees each one's grades and attendance from one sign-in.
2. "The report card that never made it home." — parent — school-operations — a pain scene, then the published report card arriving on the parent's phone with a Download button.
3. How to: "Excusing an absence in under a minute: reason, note, photo of the doctor's note, send." — parent — product-proof — screen recording of the excuse form on a phone.
4. "What a teacher sees when a parent sends an excuse." — teacher — school-operations — the excuse lands as a notification with the reason and the file, ready to approve.
5. "How do parents at your school find out their child's mark today?" — principal — school-operations — a question post that leads to the portal's grades tab.

## Connects to

- [Messaging](../messaging/SPOTLIGHT.md) — the "Message teachers" buttons open the school's messaging.
- [Notifications](../notifications/SPOTLIGHT.md) — report-card, grade and attendance alerts reach parents here.
- [WhatsApp](../whatsapp/SPOTLIGHT.md) — alerts can also go out on WhatsApp where the school has connected it.
- [Attendance](../attendance/SPOTLIGHT.md) — excuses feed the school's excuse review.
- [Timetable](../timetable/SPOTLIGHT.md) — the child's weekly timetable and today's online classes.
- [Dashboard](../dashboard/SPOTLIGHT.md) — the parent's home screen after sign-in, with a summary of every child.

## Sources

- src/components/school-dashboard/parent-portal/README.md
- src/components/school-dashboard/parent-portal/ISSUE.md
- src/components/school-dashboard/parent-portal/actions.ts
- src/components/school-dashboard/parent-portal/landing/content.tsx, landing/children-grid.tsx
- src/components/school-dashboard/parent-portal/child/overview-content.tsx, child/tabs.tsx
- src/components/school-dashboard/parent-portal/child-timetable-view.tsx, child-today-live.tsx
- src/components/school-dashboard/parent-portal/report-cards/content.tsx
- src/components/school-dashboard/parent-portal/attendance/view.tsx, attendance/excuse-form.tsx
- src/components/school-dashboard/parent-portal/announcements/actions.ts, events/actions.ts, events/content.tsx
- src/components/school-dashboard/attendance/actions/excuses.ts
- src/components/school-dashboard/grades/actions/notifications.ts
- src/components/school-dashboard/my-fees/content.tsx
- src/components/template/platform-sidebar/config.ts
- src/components/internationalization/dictionaries/{ar,en}/parentPortal.json
- src/app/[lang]/s/[subdomain]/(school-dashboard)/parent/ (layout.tsx, page.tsx, children/[id]/\*, fees/page.tsx, messages/page.tsx)
- content/docs-en/marketing-brief.mdx
- docs/evidence/profile-parent-ar.png, docs/evidence/profile-child-via-parent-ar.png (reviewed, excluded)
