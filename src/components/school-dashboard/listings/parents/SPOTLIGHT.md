---
feature: parents
title: Parents
status: partial
pillar: school-operations
personas: [registrar, owner, parent]
routes: [/ar/s/{school}/parents, /ar/s/{school}/parents/add/{id}/information, /ar/s/{school}/parents/add/{id}/contact, /ar/s/{school}/students]
screenshots: [linkparent-fixed.png, linkparent-menu-open.png]
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Parents — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school's list of every father, mother and guardian, with their phone numbers, which child they belong to, and whether they can log in yet.

## The school's day without it

Parent phone numbers live in the admission forms, in a class teacher's phone and in a dozen WhatsApp groups. When a father changes his number, only one of those places finds out. When a parent asks for access to see their child's marks, someone has to work out which child is theirs and set it up by hand.

## What happens in Balqalam

1. The registrar opens Parents and sees every guardian in the school as a table or as cards, with name, email, date added and a status showing whether they have a login yet. They can search by name and download the list as a spreadsheet file (CSV).
2. Parents are usually created while a student is being registered: the student form asks for the father's and mother's names, phone numbers and WhatsApp numbers, and links them to that child.
3. A parent can also be added from the Parents page in two short steps: personal information, then contact numbers (mobile, home, work or emergency, with one marked as primary).
4. On the Students list, "Link parent" gives a one-time code for that child. The pop-up says each code works once and expires after 90 days, and it can be printed and handed to the parent.
5. From the row menu, "Generate credentials" creates the parent's username and a temporary password, with buttons to send them by WhatsApp, SMS or email, or copy them.
6. Clicking a parent who has a login opens their profile page.

## Who it is for

- **Registrar:** one list of every guardian, with the right phone number marked as primary, instead of numbers spread across forms and phones.
- **Owner:** can see how many parents can actually log in and follow their child.
- **Parent:** receives their login from the school on WhatsApp, SMS or email, then follows their child in the parent portal.

## Real screens to show

- `linkparent-fixed.png` — the Arabic Students list with the "Link parent" pop-up open. It shows one child's one-time code, its expiry date, a copy button and a Print button. The red "1 Issue" development badge in the bottom corner must be cropped before posting.
- `linkparent-menu-open.png` — the same list with a student's action menu open, showing "Generate credentials" and "Link parent" next to view grades, view attendance and view classes.
- Routes to capture for more: the Parents list (`/ar/s/{school}/parents`), the two-step add form, and the credentials pop-up opened from a parent row. Before posting any capture, check it for photo avatars of real actors, Harry Potter names, the "quick guide" welcome pop-up and the red "N Issue" development badge. Crop or blur all of them.

## What you can say

- The student registration form records the father's and mother's names, phone numbers and WhatsApp numbers, and links them to the child. [../students/wizard/personal/actions.ts]
- Each parent can have several phone numbers (mobile, home, work, emergency), with one marked as primary. [wizard/contact/form.tsx]
- The school can give a parent a one-time code for their child. It works once and expires after 90 days. [lib/student-access-code.ts, linkparent-fixed.png]
- One click creates a parent's login and offers WhatsApp, SMS and email buttons to send it. [../credentials/README.md, table.tsx]
- The parents list shows who has a login and who does not. [content.tsx, columns.tsx]
- The whole parent list can be downloaded as a spreadsheet file (CSV). [actions.ts, table.tsx]
- Parents can also be brought in from a spreadsheet, each one tied to a student number. [school/bulk/content.tsx]

## Do not say

- Do not say parents link themselves to their child by typing the code into the app. The "Link Child" code box currently sits on the staff-only Parents page, which parents cannot open, so that half of the flow is not usable by parents yet. [link-child-actions.ts, routes.ts]
- Do not promise a log of messages sent to each parent, parent usage statistics, notification preferences or emergency-contact marking. Not built. [ISSUE.md]
- Do not say every parent has a profile page. A parent without a login has no detail page yet. [app/.../parents/[id]/page.tsx]
- Do not say Balqalam sends WhatsApp messages on its own here. The WhatsApp button opens the admin's own WhatsApp with the message ready to send.
- This page is the school's list of parents. It is not the parent portal. For what parents see on their phones, use the parent portal's spotlight.
- No hours saved, no percentages. Call the product Balqalam, never its retired codename. Do not use the Harry Potter demo names or actor photos (the parent profile screenshot `profile-parent-ar.png` shows one; do not use it).

## Post angles

1. "The father's new number reached the class WhatsApp group. It never reached the office." — registrar — school-operations — the scattered phone numbers, next to one parent record with a primary number.
2. "Father, mother, WhatsApp number, at the moment of registration." — registrar — product-proof — the student form captures both parents and links them to the child in one pass.
3. "How to hand a parent their login in under a minute." — registrar — school-operations — a how-to: open the parent row, generate credentials, press WhatsApp.
4. "Every parent at your school: can they log in today?" — owner — school-operations — the status column shows at a glance who has access and who still needs it.
5. "How many different places does your school keep parent phone numbers?" — owner — school-operations — a question to readers that leads to one list.

## Connects to

- [Students](../students/SPOTLIGHT.md) — parents are linked to students at registration and through the "Link parent" code.
- [Profile](../../profile/SPOTLIGHT.md) — clicking a parent with a login opens their profile.
- [School settings](../../school/SPOTLIGHT.md) — bulk import of parents from a spreadsheet.
- [Attendance](../../attendance/SPOTLIGHT.md) — absence follow-up reaches the parent numbers kept here.

## Sources

- src/components/school-dashboard/listings/parents/README.md
- src/components/school-dashboard/listings/parents/ISSUE.md
- src/components/school-dashboard/listings/parents/content.tsx, table.tsx, columns.tsx, actions.ts, permissions.ts
- src/components/school-dashboard/listings/parents/link-child-actions.ts, link-child-dialog.tsx
- src/components/school-dashboard/listings/parents/wizard/config.ts, wizard/information/form.tsx, wizard/contact/form.tsx
- src/components/school-dashboard/listings/students/wizard/personal/actions.ts
- src/components/school-dashboard/listings/credentials/README.md, credentials/actions.ts
- src/components/school-dashboard/school/bulk/content.tsx
- src/lib/student-access-code.ts
- src/routes.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/parents/ (page, layout, [id])
- src/components/internationalization/school-en.json, school-ar.json (parents section)
- content/docs-en/marketing-brief.mdx
- linkparent-fixed.png, linkparent-menu-open.png, profile-parent-ar.png
