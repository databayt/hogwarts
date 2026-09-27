---
feature: school
title: School Control Center
status: partial
pillar: school-operations
personas: [owner, principal, it]
routes: [/ar/s/{school}/school, /ar/s/{school}/school/configuration/title, /ar/s/{school}/school/membership, /ar/s/{school}/school/bulk, /ar/s/{school}/school/communication, /ar/s/{school}/school/security]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# School Control Center — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

One page where the school's owner or administrator sets up how the school runs — its name, look, terms, fees, who has access — and changes it any time without calling anyone.

## The school's day without it

The school's details live in the head of whoever set up the last system. Changing the term dates, adding a new administrator or switching off a section nobody uses means a phone call to a vendor and a wait. Staff accounts are shared, nobody knows who still has access, and a notice to all parents goes out through a dozen WhatsApp groups.

## What happens in Balqalam

1. The administrator opens "School" (المدرسة) in the dashboard and sees an overview: counts of users, teachers, students and departments, and a short breakdown of the school's make-up.
2. Under Configuration (الإعدادات) a column of cards lists every setting — name, description, location, capacity, schedule, academic structure, live classes, branding, homepage image, name format, enrollment, visibility, modules, tuition, discounts, legal, plan, domain. Each card shows the current value, so you can see at a glance what is set and what is not.
3. They click a card and edit it. The name, branding, location and homepage-image forms save on their own as you type; others have a save button.
4. Under Modules they switch whole sections of the product on or off, and the sidebar changes to match — a school that does not run buses need not see Transport.
5. Under Membership (الأعضاء) they see everyone with access, invite a new person by email with a role, change roles, suspend or remove someone, approve or reject join requests, reset a staff member's password, and export the list.
6. Under Communication (التواصل) they send an announcement to the whole school, one role, or one class — now or scheduled — and manage message templates.
7. Under Security (الأمان) they see failed sign-ins in the last day, how many users have two-step sign-in, and a log of recent actions.

## Who it is for

- Owner: changes the school's name, logo, colours, fees and plan limits without asking a developer.
- Principal: decides who gets in and with what role, and can suspend access the same day someone leaves.
- IT / administrator: one place for invitations, password resets, the audit log and the custom-domain request.

## Real screens to show

None yet — capture with /record. Routes to capture (Arabic first, on the public demo school):

- /ar/s/{school}/school — the overview
- /ar/s/{school}/school/configuration/title — the settings cards column with the name form
- /ar/s/{school}/school/configuration/modules — switching sections on and off
- /ar/s/{school}/school/membership — the members table with roles
- /ar/s/{school}/school/communication/broadcast — sending an announcement

## What you can say

- Every setting sits on one column of cards, each showing its current value, and a click opens it for editing. [src/app/[lang]/s/[subdomain]/(school-dashboard)/school/configuration/(editor)/layout.tsx]
- The school can switch whole sections of the product on or off, and the menu follows. [configuration/config-modules-form.tsx, configuration/actions.ts]
- Administrators invite staff by email with a chosen role; the invitation arrives as an email with a link to accept. [membership/actions.ts, membership/invite-dialog.tsx]
- Access can be suspended, restored or removed per person, suspended or restored for many people at once, and the member list exports to a spreadsheet file. [membership/actions.ts]
- An administrator can reset a staff member's password; the person must set a new one at their next sign-in. [membership/actions.ts, ISSUE.md]
- Announcements go to the whole school, one role or one class, immediately or at a set time. [communication/broadcast/actions.ts, communication/validation.ts]
- Only the school's administrators can open this area. [src/app/[lang]/s/[subdomain]/(school-dashboard)/school/layout.tsx, permissions.ts]
- A school can request its own web address (custom domain); the request is reviewed before it goes live. [configuration/config-domain-form.tsx, ../settings/domain-request/actions.ts]

## Do not say

- Do not show or quote the Analysis tab's attendance rate or pass rate — they are fixed sample numbers in the code, not the school's data. [analysis/content.tsx]
- Do not say "live system monitoring" or "real-time status". The "System Status: Operational" card always shows green; it does not check anything.
- Do not say reports are in Arabic here — the Reports tab is English-only text with links out to the exam, attendance and finance reports.
- The "Academic" tab in this area's top menu has no page of its own yet; the academic structure is edited under Configuration. Do not film that tab.
- Do not say a custom domain goes live instantly or within a set number of hours.
- Bulk import of attendance, timetable, exam scores, materials, departments and classrooms is marked "Soon" — only people (students, teachers, staff, parents) import today.
- No "advanced analytics", no percentages, no time or money saved.

## Post angles

1. "Your school's settings shouldn't live in one person's head." — owner — school-operations — every setting on one column, each showing its current value.
2. "Don't run buses? Switch Transport off. The menu follows." — principal — product-proof — the Modules switch as a ten-second screen recording.
3. "A teacher left today. Their access can leave today too." — principal — trust — suspend or remove a member from the Membership table.
4. "How to invite your staff in three clicks." — it — product-proof — email, role, send; the invitation link arrives by email.
5. "Who in your school can still sign in to your old system?" — owner — trust — a question post that ends on the members list and the action log.

## Connects to

- [Settings](../settings/SPOTLIGHT.md) — each person's own preferences; the school-wide ones live here.
- [Import](../import/SPOTLIGHT.md) — the Bulk tab here is where the people spreadsheets come in.
- [Onboarding](../../onboarding/SPOTLIGHT.md) — the setup wizard fills in the same name, branding, schedule and enrollment settings that are edited here later.
- [School website](../../school-marketing/SPOTLIGHT.md) — the name, logo and homepage image set here appear on the school's public site.
- [Credentials](../listings/credentials/SPOTLIGHT.md) — logins for students and staff after they are added.

## Sources

- src/components/school-dashboard/school/README.md
- src/components/school-dashboard/school/ISSUE.md
- src/components/school-dashboard/school/content.tsx
- src/components/school-dashboard/school/permissions.ts
- src/components/school-dashboard/school/configuration/config-sidebar.tsx
- src/components/school-dashboard/school/configuration/config-modules-form.tsx
- src/components/school-dashboard/school/configuration/config-domain-form.tsx
- src/components/school-dashboard/school/configuration/config-join-form.tsx
- src/components/school-dashboard/school/configuration/actions.ts
- src/components/school-dashboard/school/membership/content.tsx
- src/components/school-dashboard/school/membership/actions.ts
- src/components/school-dashboard/school/membership/invite-dialog.tsx
- src/components/school-dashboard/school/communication/validation.ts
- src/components/school-dashboard/school/communication/broadcast/actions.ts
- src/components/school-dashboard/school/security/content.tsx
- src/components/school-dashboard/school/reports/content.tsx
- src/components/school-dashboard/school/analysis/content.tsx
- src/components/school-dashboard/school/bulk/content.tsx
- src/components/school-dashboard/settings/domain-request/actions.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/layout.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/configuration/(editor)/layout.tsx
- src/app/manifest.ts
- src/components/internationalization/school-ar.json, school-en.json (schoolAdmin)
- content/docs-en/marketing-brief.mdx
