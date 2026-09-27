---
feature: teachers
title: Teachers
status: partial
pillar: school-operations
personas: [owner, principal, teacher]
routes: [/ar/s/{school}/teachers, /ar/s/{school}/teachers/add, /ar/s/{school}/teachers/departments, /ar/s/{school}/teachers/schedule, /ar/s/{school}/teachers/performance]
screenshots: [demo-teachers-ar.png]
readme: ./README.md
docs: content/docs-en/teachers.mdx
updated: 2026-09-27
---

# Teachers — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every teacher's file, department, subjects and weekly teaching load in one list, with their login handed over in a click.

## The school's day without it

The staff file is a cabinet of folders: CVs, degree copies and ID photocopies, some of them missing. Which teacher covers which subject lives in the deputy's head or on a whiteboard. When a new teacher starts, someone writes a username and password on a slip of paper, or never sets one up at all. Nobody can say at a glance who is teaching 28 periods and who is teaching 8.

## What happens in Balqalam

1. The admin opens Teachers and sees everyone as a table or as cards, with department, number of subjects and classes, status (active, on leave, and so on) and whether they have a login yet. They can search by name or email and filter by status, including records that are still incomplete.
2. "Add" opens a short guided form in two parts: personal details (documents, name, subject expertise) and professional background (phone, address, employment). Only name and contact are required, so a teacher can be created fast and completed later.
3. The documents step takes a degree, CV, ID, certificate and one other file, dropped straight onto a card and stored with the teacher's record.
4. From the row menu, "Generate credentials" creates a username and temporary password and shows them with buttons to send them by WhatsApp, SMS or email, or copy them.
5. The Departments tab groups teachers and subjects into departments, each with an Arabic and an English name, and marks a head of department.
6. The Schedule tab counts each teacher's periods from the timetable and flags them as under-used, normal or overloaded.
7. Clicking a teacher opens their profile page.

## Who it is for

- **Owner:** one place that answers "who works here, in what department, on what contract".
- **Principal:** sees at a glance who is overloaded or under-used this week, based on the real timetable.
- **Teacher:** gets a working login from the school the same day, sent to their own WhatsApp or email.

## Real screens to show

- `demo-teachers-ar.png` — the Arabic teachers list: names, emails, department (Science, Languages), subject counts and "active" status, with the tabs All / Departments / Schedule / Performance / Settings. One row shows the name "Minerva McGonagall" (a Harry Potter character from the old demo data). Crop or blur that row before posting.
- Routes to capture for more: the add form (`/ar/s/{school}/teachers/add`), the documents step, the credentials pop-up, Departments, and Schedule (workload). Before posting any capture, check it for photo avatars of real actors, Harry Potter names, the "quick guide" welcome pop-up and the red "N Issue" development badge in the corner. Crop or blur all of them.

## What you can say

- A teacher can be added with just a name and contact details and finished later; incomplete records are marked so nothing is forgotten. [wizard/config.ts, content.tsx]
- The teacher form keeps copies of a degree, CV, ID, certificate and one more document, up to 10 MB each. [wizard/attachments/form.tsx, wizard/attachments/actions.ts]
- One click creates a teacher's login and offers WhatsApp, SMS and email buttons to send it. [../credentials/README.md, table.tsx]
- Departments carry both an Arabic and an English name and can have a head of department. [departments/content.tsx, departments/actions.ts]
- Each teacher's weekly periods come from the timetable and are flagged as under-used, normal or overloaded. By default the limits are 15 and 25 periods a week. [app/.../teachers/schedule/page.tsx]
- The whole teacher list can be downloaded as a spreadsheet file (CSV). [table.tsx, actions.ts]
- Names in the list are shown in the reader's language, even when they were typed in the other one. [content.tsx]

## Do not say

- Do not call the Performance tab a measure of teaching quality. Its score is a rough internal formula built from periods taught, registers taken and number of classes. It is not lesson observation or results. [app/.../teachers/performance/page.tsx]
- Do not show or describe the Settings tab. It is an empty placeholder. [settings/content.tsx]
- Do not promise leave management, substitute cover, contract or licence expiry alerts, or professional development tracking. None of these are built. [ISSUE.md]
- Do not say every teacher has a profile page. A teacher without a login has no detail page yet. [app/.../teachers/[id]/page.tsx]
- Do not say Balqalam sends WhatsApp messages on its own here. The WhatsApp button opens the admin's own WhatsApp with the message ready to send.
- No hours saved, no percentages. Call the product Balqalam, never its retired codename. Do not use the Harry Potter demo names or actor photos.

## Post angles

1. "The staff file is a cabinet. It should be a screen." — owner — school-operations — the paper staff folder (CVs, degrees, ID copies) next to one teacher record holding the same documents.
2. "Who is teaching 28 periods this week?" — principal — product-proof — the Schedule tab counts periods from the timetable and flags who is overloaded.
3. "New teacher on Sunday, working login by Sunday noon." — owner — school-operations — a how-to: add the teacher, generate credentials, send by WhatsApp.
4. "A teacher's first day starts with a login, not a slip of paper." — teacher — school-operations — the teacher's side: credentials arrive on their own phone.
5. "How does your school know which teacher covers which subject?" — principal — school-operations — a question to readers, answered with departments and subject expertise in one list.

## Connects to

- [Classes](../classes/SPOTLIGHT.md) — teachers are assigned to classes and subjects.
- [Subjects](../subjects/SPOTLIGHT.md) — each teacher's subject expertise.
- [Staff](../staff/SPOTLIGHT.md) — the non-teaching staff list.
- [Profile](../../profile/SPOTLIGHT.md) — clicking a teacher opens their profile.
- [Attendance](../../attendance/SPOTLIGHT.md) — teachers take the registers counted on the Performance tab.
- [School settings](../../school/SPOTLIGHT.md) — bulk import of teachers from a spreadsheet.

## Sources

- src/components/school-dashboard/listings/teachers/README.md
- src/components/school-dashboard/listings/teachers/ISSUE.md
- src/components/school-dashboard/listings/teachers/content.tsx, table.tsx, columns.tsx, actions.ts
- src/components/school-dashboard/listings/teachers/wizard/config.ts, wizard/attachments/form.tsx, wizard/attachments/actions.ts
- src/components/school-dashboard/listings/teachers/departments/content.tsx, departments/actions.ts
- src/components/school-dashboard/listings/teachers/performance/content.tsx, settings/content.tsx
- src/components/school-dashboard/listings/credentials/README.md, credentials/actions.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/teachers/ (page, layout, [id], schedule, performance, settings)
- src/components/internationalization/school-en.json, school-ar.json (teachers section)
- src/routes.ts
- content/docs-en/teachers.mdx (older: describes a 7-step form; code now uses 6 steps in 2 groups)
- content/docs-en/marketing-brief.mdx
- demo-teachers-ar.png
