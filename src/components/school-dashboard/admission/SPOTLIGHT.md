---
feature: admission
title: Admission
status: live
pillar: school-operations
personas: [owner, principal, registrar, finance, parent]
routes: [/ar/s/{school}/admission, /ar/s/{school}/admission/applications, /ar/s/{school}/admission/merit, /ar/s/{school}/admission/enrollment, /ar/s/{school}/admission/leads, /ar/s/{school}/admission/settings, /ar/s/{school}/admissions, /ar/s/{school}/application, /ar/s/{school}/application/status]
screenshots: [demo-admission-ar.png, merit-desktop.png, baseline-admission.jpeg]
readme: ./README.md
docs: content/docs-en/admission.mdx
updated: 2026-09-27
---

# Admission — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Families apply on the school's own website, and the admissions office reviews, ranks, offers a seat and enrolls the child from one screen, without retyping anything.

## The school's day without it

Every new season the front office hands out paper folders, then someone types each one into a spreadsheet. Parents phone to ask "did you receive my file?" and "has my son been accepted?". Interview marks sit in a notebook, the ranking is done by hand, and when a child is finally accepted the same details are typed again into the student register and the fees book.

## What happens in Balqalam

1. The school opens an admission campaign for a school year: a name, opening and closing dates, and the total number of seats.
2. A parent opens the school's admissions page, signs in, and fills a five-step application (documents, personal and guardian details, address, academic history, and a fees preview). The form saves as they go and can be finished later. Applying is free.
3. The parent receives an application number and can check progress on the status page at any time, using that number, their email and a one-time code. No account is needed to check.
4. Staff see every application in one list with its status, grade and campaign. They enter entrance-exam and interview scores (0–100) and generate a ranked merit list; the weighting of the two scores is set by the school.
5. Staff move each applicant along: under review, shortlisted, selected, waitlisted or rejected. The family is told, and a rejection or waitlist can carry a short note from the school.
6. A selected family gets an offer with a private link. They accept or decline, then pay the registration fee by card online, or by cash, bank transfer, Bankak or Cashi, which the school confirms once the money arrives.
7. The admin clicks Confirm Enrollment. In one step the child becomes a student with a login, the parents are added as guardians, the year's fees and invoices are created, and the documents move to the student file. The admin then places the student in a section, with seat counts shown.

## Who it is for

- **Owner:** one list of every applicant and every seat, per campaign, instead of folders in a cabinet.
- **Principal:** a merit list ranked from real entrance and interview scores, with the weighting the school chose.
- **Registrar:** no retyping. What the parent typed becomes the student record at enrollment.
- **Finance:** registration fees paid online are confirmed automatically; cash and transfers are confirmed by the accountant, and tuition invoices appear at enrollment.
- **Parent:** apply from a phone, check the status without an account, accept the offer and pay from the same link.

## Real screens to show

- `demo-admission-ar.png` — Arabic Applications tab: application numbers, applicant names, grade, status badges (accepted, waitlisted, rejected, shortlisted, withdrawn) and merit rank.
- `merit-desktop.png` — despite the name, the Arabic Applications tab on a phone-width screen. Crop the red development badge at the bottom left.
- `baseline-admission.jpeg` — English Campaigns tab: two open campaigns with seats and application counts. Crop the red development badge.
- More to capture with /record: the public admissions page (`/ar/s/{school}/admissions`), the application form on a phone (`/ar/s/{school}/application`), the status tracker (`/ar/s/{school}/application/status`), the merit tab (`/ar/s/{school}/admission/merit`), the enrollment tab with the placement dialog (`/ar/s/{school}/admission/enrollment`), and the Leads tab.

## What you can say

- Parents apply online on the school's own address, and applying is always free; the only payment is the registration fee after an offer is accepted. [docs-en/admission.mdx]
- Families can check their application status with their application number, email and a one-time code, without creating an account. [application/status/page.tsx, school dictionary statusTracker]
- Staff enter entrance and interview scores and generate a ranked merit list; the school sets how much each score counts, and the two must add up to 100. [actions.ts, settings-content.tsx]
- One click on Confirm Enrollment creates the student, the guardians, the fee assignments and the invoices together. [docs-en/admission.mdx, actions.ts]
- The registration fee can be paid by card online, or by cash, bank transfer, Bankak or Cashi, confirmed by the school. [registration-methods.ts]
- Questions from the website and campus-tour bookings land in a Leads tab, and a tour slot cannot be overbooked. [docs-en/admission.mdx, leads/]
- The applications and enrollment lists export to a spreadsheet file. [actions.ts]
- The whole flow works in Arabic by default, with English available. [school-ar.json]

## Do not say

- Any time figure. The older admission copy kit's "30 minutes to 2 minutes" is an unmeasured number and is banned; describe the task instead.
- "Documents are read by AI automatically." The document-reading step runs from a background queue, is limited by an AI budget, and is not confirmed running in production. Show what staff see, not an AI promise.
- "Automatic reminders" for offers or fees. The scheduled jobs behind them are not confirmed running on the live site.
- "Interviews are scheduled in the system." There is an interview status, but no date, time or place is stored yet.
- "One parent account for all your children." A parent applying for two children in the same campaign is blocked today.
- "Tour confirmation emails." Only cancel and reschedule messages exist.
- "Parents get WhatsApp updates on their application." Guardian WhatsApp numbers are collected, but admission notices go in-app and by email.
- "Buy now" or any self-serve checkout, any school name other than King Fahad Schools, any enrolment-growth percentage, or the old product name.

## Post angles

1. "The folder pile at the front office is optional this year." — registrar — school-operations — the paper-folder-and-retyping scene next to a parent filling the form on a phone.
2. "From application to enrolled student, one click in the middle." — owner — product-proof — screen recording of Confirm Enrollment creating the student, guardians and invoices together.
3. "How to open admissions in three steps." — principal — school-operations — create a campaign, share the admissions link, watch applications arrive in the list.
4. "Parents stop calling to ask 'was my file received?'" — parent — trust — the status tracker: application number, email, a code, and the timeline, no account.
5. "How does your school rank applicants today, notebook or spreadsheet?" — principal — school-operations — ask the reader, then show scores and the ranked merit list.

## Connects to

- [School website](../../school-marketing/SPOTLIGHT.md) — the public admissions page and application form parents use.
- [Students](../listings/students/SPOTLIGHT.md) — every enrolled applicant becomes a student record.
- [Finance](../finance/SPOTLIGHT.md) — the registration fee and the tuition invoices created at enrollment.
- [Logins](../listings/credentials/SPOTLIGHT.md) — the new student's account.
- [Bulk import](../import/SPOTLIGHT.md) — imported students also show up in the Applications list, tagged by how they arrived.

## Sources

- src/components/school-dashboard/admission/README.md
- src/components/school-dashboard/admission/ISSUE.md
- src/components/school-dashboard/admission/actions.ts
- src/components/school-dashboard/admission/settings-content.tsx
- src/components/school-dashboard/admission/registration-methods.ts
- src/components/school-dashboard/admission/permissions.ts
- src/components/school-dashboard/admission/ai/classify.ts, ai/actions.ts, ai/documents-section.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/admission/page.tsx
- src/app/[lang]/s/[subdomain]/application/status/page.tsx
- src/components/school-marketing/admission/ (directory listing)
- src/components/internationalization/school-en.json, school-ar.json (admission keys)
- .github/workflows/admission-crons.yml, cf/crons.json
- content/docs-en/admission.mdx
- content/docs-en/admission-spotlight.mdx
- content/docs-en/marketing-brief.mdx
- demo-admission-ar.png, merit-desktop.png, baseline-admission.jpeg
