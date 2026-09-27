---
feature: credentials
title: Login Credentials
status: live
pillar: school-operations
personas: [registrar, principal, teacher, parent, student]
routes: [/ar/s/{school}/students, /ar/s/{school}/teachers, /ar/s/{school}/parents, /ar/s/{school}/staff]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Login Credentials — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

From any student, teacher, parent or staff name in the school's lists, the office makes that person's login in one click and sends it straight to their WhatsApp, email or phone.

## The school's day without it

At the start of term someone in the office makes accounts one by one, writes usernames and passwords on slips of paper, and hands them out in class. Slips get lost, parents call because they cannot sign in, and the office types the same login into a WhatsApp chat again and again.

## What happens in Balqalam

1. In the students, teachers, parents or staff list, the admin opens the row menu next to a name and chooses "Generate credentials".
2. A small window opens with the person's name, a badge (their grade, department, "Guardian" or job title), a username and a fresh temporary password.
3. One button copies everything as a single message: username, email, password and the school's login link.
4. Next to it are WhatsApp, email and text-message buttons, filled with the person's phone or email on file. For a student with no contact details, the primary guardian's phone and email are used. A button with no contact behind it is shown greyed out.
5. The system also sends the same login to the person through the platform's notifications (in-app, email and WhatsApp).
6. On first sign-in, the person is asked to choose their own password.

## Who it is for

- **Registrar / office staff**: hand out every login from the same list they already work in, without paper slips.
- **Principal**: every teacher and staff member gets their own account from the same place.
- **Teacher**: teachers who can add students can also generate a student's login from the students list.
- **Parent**: the login arrives on their phone, in a message they can open and tap.
- **Student**: a username and a temporary password they replace with their own on first sign-in.

## Real screens to show

None yet — capture with /record. Use a demo account with fake names; never show a real temporary password.
Routes to capture:

- `/ar/s/{school}/students` — row menu, then the credentials window
- `/ar/s/{school}/teachers` — the same window with a department badge
- `/ar/s/{school}/parents` — the same window with the "Guardian" badge

## What you can say

- One window serves all four lists: students, teachers, parents and staff. [README.md; listings/students, teachers, parents, staff table.tsx]
- Each opening creates a fresh temporary password, and the person must change it on first sign-in. [actions.ts; README.md "Generate-on-open"]
- One click copies username, email, password and the login link as one message. [README.md "Copy"; credentials-dialog.tsx]
- WhatsApp, email and SMS buttons open already filled in with the login message. [credentials-dialog.tsx; share.ts]
- For students without their own phone or email, the login goes to the primary guardian. [README.md "Contact icons"]
- The login is also sent through the platform's notifications (in-app, email, WhatsApp) in the background. [src/lib/credentials-delivery.ts]
- A student who signed up and chose their own password keeps it; the office only re-shares the username and link. [actions.ts]

## Do not say

- Do not say the login "always arrives on WhatsApp". A phone number saved without a country code may not open in WhatsApp; the copy button is the fallback. [README.md "Notes / assumptions"; share.ts]
- Do not say logins are created "in bulk" or "for the whole school at once" from this window — it works one person at a time.
- Do not say the school can see or look up a person's current password. It cannot; opening the window makes a new one.
- Do not say parents or students need no password — they sign in with a username and password.
- Never publish a screenshot with a real username, phone number or temporary password.
- Global: no time or money saved figures, no app-store app, never the product's old codename.

## Post angles

1. "The first week of term: a stack of paper slips with passwords on them." — registrar — school-operations — The paper-slip scene against one click and a WhatsApp message.
2. "One click. Username, password, login link — sent to the parent's WhatsApp." — registrar — product-proof — Screen recording of the window and the WhatsApp button.
3. "How to give a new teacher their login, step by step." — principal — school-operations — Step-by-step from the teachers list to the shared message.
4. "The parent's view: a message arrives, tap the link, choose your own password." — parent — trust — First sign-in from the parent's phone.
5. "How does your school hand out logins today — paper, email, or 'come to the office'?" — owner — school-operations — A question that opens the conversation about the first week of term.

## Connects to

- [Import](../../import/SPOTLIGHT.md) — imported students, teachers and guardians are the people who then get logins
- [Onboarding](../../../onboarding/SPOTLIGHT.md) — a new school's first people need their logins after setup
- [Settings](../../settings/SPOTLIGHT.md) — where a signed-in user changes their password later
- Students, teachers, parents and staff lists (`../students`, `../teachers`, `../parents`, `../staff`) — where the window is opened

## Sources

- src/components/school-dashboard/listings/credentials/README.md
- src/components/school-dashboard/listings/credentials/actions.ts
- src/components/school-dashboard/listings/credentials/share.ts
- src/components/school-dashboard/listings/credentials/credentials-dialog.tsx
- src/lib/credentials-delivery.ts
- src/components/school-dashboard/listings/students/table.tsx, students/columns.tsx, students/permissions.ts
- src/components/school-dashboard/listings/teachers/columns.tsx, parents/table.tsx, staff/table.tsx
- src/components/internationalization/school-en.json (school.students.credentials)
- content/docs-en/pilot.mdx (step 5, "generate student logins … share by copy/email/WhatsApp")
- content/docs-en/credentials.mdx (checked: covers sign-in and password reset in general, not this window)
