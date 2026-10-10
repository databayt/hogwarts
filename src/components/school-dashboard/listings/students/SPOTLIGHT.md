---
feature: students
title: Students
status: partial
pillar: school-operations
personas: [registrar, principal, owner, teacher, parent]
routes: [/ar/s/{school}/students, /ar/s/{school}/students/add, /ar/s/{school}/students/archived, /ar/s/{school}/students/year-levels]
screenshots: [docs/evidence/demo-students-ar.png]
readme: ./README.md
docs: content/docs-en/students.mdx
updated: 2026-09-27
---

# Students — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every student in the school sits in one searchable list, and however a child joined — an online application, a form the office filled, or an Excel sheet — they end up with the same login, grade, fees and parent link.

## The school's day without it

The student register is a ledger in the office and a copy in someone's spreadsheet, and the two never agree. A new child is written into the ledger, then the class teacher is told by word of mouth, then the accountant is told separately so the fees get raised. Parents' phone numbers live in a notebook. When a child leaves, their record is torn out or simply forgotten.

## What happens in Balqalam

1. The registrar opens Students and sees every student with their grade, class and status. They can search by name and filter by grade and status, and switch between a table and a card grid.
2. To add a child, they press "+" and walk through four short steps: documents and photo, personal details with the father's and mother's names and phone and WhatsApp numbers, home address, and the grade and section. Only the name and one parent are required; the rest can be skipped and filled in later.
3. On "Create", the student gets a login and a school student number, fees for their grade are attached with one invoice per instalment, and the family is sent a welcome notice. The login details appear in a dialog on the list so the office can hand them over.
4. Students who came in without a seat show up under an "Unplaced (no grade or class)" filter, and an "Assign Section" action puts them into a section in one step.
5. From any row the office can generate login credentials, print a one-time "Link Parent" code for the family, open the student's profile, or edit the record through the same four steps.
6. The list exports to a CSV file. Archiving hides a student without deleting them; permanently deleting a student first requires downloading a full copy of their record.

## Who it is for

- **Registrar**: one place to add, find, place, edit and archive students, with drafts that can be finished later.
- **Principal**: a clear view of who is enrolled, in which grade and section, and who still has no seat.
- **Owner**: every intake route — online applications, the office, and spreadsheet imports — lands in the same register, with fees attached at the door.
- **Teacher**: can view the school's students and work with those in their own classes.
- **Parent**: is written into the record with phone and WhatsApp numbers when the child is added, so the school can reach them.

## Real screens to show

- `docs/evidence/demo-students-ar.png` — the Arabic students list with the page tabs (All, Enroll, Performance, Reports, Archive, Settings), search, grade and status filters, and "Draft" and "Active" badges. A "quick guide" welcome pop-up covers the middle of the table: re-capture without it, or crop to the left and right edges.
- To capture more (with /record, Arabic, as admin): `/ar/s/{school}/students` with the "Unplaced" filter on, the four-step add form at `/ar/s/{school}/students/add`, the Link Parent code dialog from a row's menu, and `/ar/s/{school}/students/archived`.

## What you can say

- Four ways in — the family's online application, the office's add form, the setup import and the bulk spreadsheet import — all end in the same student record with a login, grade, fees and parent link. [docs-en/students.mdx "Four channels, one assembly point"]
- Adding a student takes four steps, and only the name and one parent are required. [wizard/config.ts, docs-en/students.mdx]
- Fees for the student's grade are attached automatically when the student is created, one invoice per instalment. [docs-en/students.mdx]
- An "Unplaced" filter shows every student who has no grade or no seat yet, and "Assign Section" places them in one step. [README.md "The assembly point", school-en.json]
- The office can print a one-time "Link Parent" code for any student; each code works once and expires after 90 days. [access-code-dialog.tsx, src/lib/student-access-code.ts]
- The student list exports to CSV at any time. [table.tsx, actions.ts]
- A student can only be permanently deleted after the school downloads a full copy of their record. [actions.ts]
- Parents' phone and WhatsApp numbers are captured on the add form, for the father and the mother separately. [docs-en/students.mdx "The admin wizard"]

## Do not say

- That uploading an ID card fills in the form for you. The system reads the document, but the result is not yet placed into the later steps.
- That parents can type the "Link Parent" code in themselves. The screen where a code is entered sits on the staff-only Parents page, so today a staff member enters it for the family.
- Anything about the Performance, Reports, Guardians or Settings tabs under Students. They are "coming soon" placeholders today.
- That clicking a column header sorts the list. That control does not work yet.
- That every student is always billed. If the school has not set up fees for the new academic year, a student can be created with no fees, and only a short warning says so.
- That students get ID cards from this page. The ID-card code is not connected to any screen.
- "Download our app", "works offline", or any number of hours or registrar time saved.
- Real children's names or faces from the pilot school. The demo shows sample names only.

## Post angles

1. "The ledger, the spreadsheet and the accountant's list — which one is right?" — registrar — school-operations — A pain scene: three copies of the student register drifting apart, versus one list every intake route feeds.
2. "Four doors in, one student record out." — owner — product-proof — Online application, office form, setup import and bulk spreadsheet all end with the same login, grade, fees and parent link.
3. "How to add a new student in four steps." — registrar — school-operations — A short screen recording: documents, parents, address, grade, then Create and the login details appear.
4. "Who in your school still has no seat?" — principal — school-operations — The Unplaced filter shows students with no grade or section, and Assign Section fixes it on the spot.
5. "When a student leaves, what happens to their file?" — principal — trust — A question post: archiving keeps the record, and permanent deletion first requires downloading a full copy.

## Connects to

- [Admission](../../admission/SPOTLIGHT.md) — accepted applicants become students here.
- [Parents](../parents/SPOTLIGHT.md) — guardians are created and linked from the student's record.
- [Classes](../classes/SPOTLIGHT.md) — placing a student in a section enrols them in that grade's classes.
- [Profile](../../profile/SPOTLIGHT.md) — opening a student leads to their unified profile.
- [Attendance](../../attendance/SPOTLIGHT.md) — a placed student appears on their classes' registers.
- [Finance](../../finance/SPOTLIGHT.md) — fees and instalment invoices are attached when the student is created.

## Sources

- src/components/school-dashboard/listings/students/README.md
- src/components/school-dashboard/listings/students/ISSUE.md
- src/components/school-dashboard/listings/students/actions.ts
- src/components/school-dashboard/listings/students/authorization.ts
- src/components/school-dashboard/listings/students/access-code-dialog.tsx
- src/components/school-dashboard/listings/students/export-button.tsx
- src/components/school-dashboard/listings/students/wizard/config.ts
- src/components/school-dashboard/listings/students/wizard/attachments/content.tsx, extract-action.ts
- src/components/school-dashboard/listings/students/{performance,reports,settings,guardians}/content.tsx
- src/lib/student-access-code.ts
- src/lib/student-provisioning-notify.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/students/ (layout.tsx, page.tsx, [id]/page.tsx, performance, reports, settings, guardians, enroll, archived)
- src/components/internationalization/school-en.json, school-ar.json (students keys)
- content/docs-en/students.mdx
- content/docs-en/listings.mdx
- content/docs-en/marketing-brief.mdx
- docs/evidence/demo-students-ar.png
