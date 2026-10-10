---
feature: staff
title: Staff
status: partial
pillar: school-operations
personas: [owner, principal]
routes: [/ar/s/{school}/staff, /ar/s/{school}/school/bulk]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Staff — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A list of the school's non-teaching people (accountant, librarian, secretary, driver) with their job, department, contract type and whether they have a login.

## The school's day without it

The office knows the teachers, but the accountant, the librarian, the guard and the bus driver are on a separate paper list, if anywhere. Nobody is sure who is on a contract, who is part-time or who is on leave. When one of them needs access to the system, their account is set up by hand, or shared with someone else's.

## What happens in Balqalam

1. The school brings its staff in from a spreadsheet on the bulk import page (name, email, staff number, job title, department, phone, gender, contract type), or a staff member joins through the school's membership screen.
2. The admin opens Staff and sees every non-teaching staff member in a table: name, job title, department, employment status (active, on leave, terminated, retired), employment type (full-time, part-time, contract, temporary) and whether they have a login.
3. Names, job titles and departments are shown in the reader's language, even when they were typed in the other one.
4. From the row menu, "Generate credentials" creates a username and temporary password, with buttons to send them by WhatsApp, SMS or email, or copy them.
5. Clicking a staff member who has a login opens their profile page.

## Who it is for

- **Owner:** one place that lists every non-teaching employee, their department and contract type.
- **Principal:** can see who is active or on leave, and hand any staff member a login without calling IT.

## Real screens to show

- None yet — capture with /record.
- Routes to capture: the Staff list (`/ar/s/{school}/staff`), the credentials pop-up opened from a staff row, and the Staff section of the bulk import page (`/ar/s/{school}/school/bulk`). Before posting any capture, check it for photo avatars of real actors, Harry Potter names, the "quick guide" welcome pop-up and the red "N Issue" development badge. Crop or blur all of them.
- Do not use `docs/evidence/payroll-runs-admin-ar.png` for this feature. It is the finance payroll screen.

## What you can say

- Staff can be brought in from a spreadsheet, with name, email, staff number, job title, department, phone, gender and contract type. [school/bulk/content.tsx]
- Each staff member carries an employment status (active, on leave, terminated, retired) and a type (full-time, part-time, contract, temporary). [ISSUE.md, columns.tsx]
- The list shows at a glance which staff members have a login and which do not. [table.tsx]
- One click creates a staff member's login and offers WhatsApp, SMS and email buttons to send it. [../credentials/README.md, table.tsx]
- Names, job titles and departments are shown in the reader's language. [content.tsx]

## Do not say

- Do not say you can add or edit a staff member from the Staff page. The page is a list only: there is no add button, no search box and no download button on it today, and the edit form is not connected. Staff come in through bulk import or membership. [table.tsx, form.tsx]
- Do not promise staff leave requests, check-in and check-out, contract or ID expiry alerts, an organisation chart or performance reviews. Not built. [ISSUE.md]
- Do not say payroll is part of this screen. Salaries and payslips live in Finance, and the marketing brief marks that area as partial: lead with fees, mention payroll second. [marketing-brief.mdx]
- Do not say every staff member has a profile page. One without a login has no detail page yet. [app/.../staff/[id]/page.tsx]
- Do not say Balqalam sends WhatsApp messages on its own here. The WhatsApp button opens the admin's own WhatsApp with the message ready to send.
- No hours saved, no percentages. Call the product Balqalam, never its retired codename.

## Post angles

1. "The bus driver and the librarian work here too." — owner — school-operations — the paper list of non-teaching staff, next to one screen that shows them with teachers' records.
2. "Full-time, part-time, contract, on leave: one column, not a guess." — principal — product-proof — the employment status and type columns on the staff list.
3. "From your staff spreadsheet to staff logins, the same day." — owner — school-operations — a how-to: import the spreadsheet, then generate each login and send it by WhatsApp.
4. "Your accountant should not be using the principal's password." — principal — trust — each staff member gets their own login from the list.
5. "Does your school system know who your accountant is?" — owner — school-operations — a question to readers about the staff most systems forget.

## Connects to

- [Teachers](../teachers/SPOTLIGHT.md) — the teaching staff list; departments are shared.
- [Profile](../../profile/SPOTLIGHT.md) — clicking a staff member with a login opens their profile.
- [School settings](../../school/SPOTLIGHT.md) — bulk import and membership, where staff records come from.

## Sources

- src/components/school-dashboard/listings/staff/README.md
- src/components/school-dashboard/listings/staff/ISSUE.md
- src/components/school-dashboard/listings/staff/content.tsx, table.tsx, columns.tsx, form.tsx, actions.ts
- src/components/school-dashboard/listings/credentials/README.md, credentials/actions.ts
- src/components/school-dashboard/school/bulk/content.tsx
- src/components/school-dashboard/school/membership/actions.ts
- src/components/school-dashboard/dashboard/quick-actions-config.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/staff/ (page, [id])
- src/components/internationalization/school-en.json, school-ar.json (staffListing section)
- content/docs-en/marketing-brief.mdx
