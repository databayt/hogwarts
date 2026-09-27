---
feature: compliance
title: Regulator Reporting (ADEK, Abu Dhabi)
status: partial
pillar: trust
personas: [registrar, principal, owner, parent]
routes: [/ar/s/{school}/compliance]
screenshots: []
readme: ./README.md
docs: content/docs-en/compliance.mdx
updated: 2026-09-27
---

# Regulator Reporting (ADEK, Abu Dhabi) — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.
> UAE only. This screen appears only for schools registered in the UAE.

## In one line

Every day Balqalam prepares the attendance file Abu Dhabi's regulator (ADEK) asks for, and chases up unexplained absences with parents, so the registrar only has to upload the file.

## The school's day without it

In Abu Dhabi, a school must report each day's attendance to ADEK's eSIS system by 2 pm, with every absence sorted into the regulator's categories. A registrar pulls the register, retypes it into the regulator's format and hopes nothing was missed. Separately, the regulator expects parents to be contacted about unexplained absences, and someone has to remember to make those calls and keep proof they happened.

## What happens in Balqalam

1. An administrator opens Compliance, switches the connector on, and keeps the recommended mode: "Dry-run (CSV only, manual upload)". The daily time (2 pm Gulf time) and the parent-contact window (120 minutes) are pre-filled.
2. Teachers take attendance as usual. Nothing extra is asked of them.
3. Each day the system builds that day's file in the regulator's format, sorting each record as authorised absence, unauthorised absence, cause for concern (a student absent more than 5% of the last 30 days) or late arrival.
4. The day's file appears in the Submissions table. The registrar downloads it and uploads it to eSIS themselves.
5. Throughout the day the system looks for students marked absent with no excuse and no approved leave. Once the 120-minute window has passed, it sends their guardians a notice in the app, by email and by WhatsApp, and records that contact as evidence.
6. If a day's file fails to build, school administrators get an alert and can press "Retry submission". Every attempt stays in the history.

## Who it is for

- **Registrar:** the regulator's file is ready every day in the right format — download and upload, no retyping.
- **Principal:** a dated history of every day's file, and a record of each parent contact for an inspection.
- **Owner:** one less reason to hire someone just to feed the regulator's system.
- **Parent:** hears from the school the same morning when their child is absent without explanation.

## Real screens to show

None yet — capture with /record. The page only opens for a UAE school (or a platform developer account), so a UAE demo tenant is needed:

- `/ar/s/{school}/compliance` — the settings card (mode, daily time, 120-minute window)
- the same page — the Submissions table with date, status, student count and "Download CSV"
- A parent's phone showing the unexplained-absence notice

## What you can say

- Balqalam produces the daily attendance file in ADEK's eSIS format, ready for the registrar to upload. [compliance.mdx, dictionaries/en/compliance.json]
- Absences are sorted into the regulator's categories automatically: authorised, unauthorised, cause for concern, and late. [lib/compliance/providers/adek/mapper.ts]
- "Cause for concern" is flagged when a student has been absent more than 5% of the last 30 days. [mapper.ts]
- When an absence is still unexplained after 120 minutes, guardians are contacted in the app, by email and by WhatsApp, and the contact is logged as evidence. [api/cron/absence-followup/route.ts]
- The 120-minute window is the school's setting; it defaults to the ADEK rule. [prisma/models/compliance.prisma]
- Every day's file is kept with its date, attempt number and status, and can be downloaded again. [submissions-table.tsx, README.md]
- It is off by default and only shown to UAE schools. [compliance/page.tsx]

## Do not say

- Never say Balqalam "submits to ADEK automatically", "sends attendance to the regulator" or "files it for you". The school's registrar uploads the file. Direct upload is built but waiting on ADEK and partner access; it is not in use. [README.md, ISSUE.md] (The marketing brief's wording "daily attendance submission" and "no competitor submits automatically" is superseded here.)
- Do not read the "Submitted" status in the table as "received by ADEK". In this mode it means the file was generated.
- Do not say "approved by ADEK", "ADEK certified", "ADEK partner", or name any compliance certification (PDPL, GDPR, FERPA).
- Do not say parents get a phone call. The follow-up is a notice in the app, by email and by WhatsApp. Contact happens within about half an hour after the 120-minute window, not at exactly two hours.
- Do not say it works for Saudi, Qatar or Sudan regulators. Only ADEK exists today.
- Do not name any UAE school or group as a customer or pilot. The only school we may name is King Fahad Schools, Khartoum — and it is not a UAE school, so it is not proof for this feature.
- Do not claim hours saved, fewer fines, or any percentage beyond the 5% rule above.

## Post angles

1. "2 pm, every day: is your ADEK attendance file ready?" — registrar — trust — The file is built in the regulator's format each day; the registrar just uploads it.
2. "The absence nobody explained — handled before lunch." — principal — trust — Unexplained absences trigger a parent notice after 120 minutes and leave a record for inspectors.
3. "How the daily eSIS file comes together, without retyping" — registrar — school-operations — Walk through: register taken, categories sorted, file downloaded, uploaded.
4. "What an inspector wants to see, on one screen" — principal — trust — A dated history of every day's file and every parent contact.
5. "Who in your school retypes the register for ADEK every day?" — owner — school-operations — A question post for UAE schools, ending in book a demo.

## Connects to

- [Attendance](../attendance/SPOTLIGHT.md) — the register the daily file is built from
- [Notifications](../notifications/SPOTLIGHT.md) — the parent notice and the admin failure alert
- [WhatsApp](../whatsapp/SPOTLIGHT.md) — one of the three channels for the parent follow-up

## Sources

- src/components/school-dashboard/compliance/README.md
- src/components/school-dashboard/compliance/ISSUE.md
- src/components/school-dashboard/compliance/CLAUDE.md
- src/components/school-dashboard/compliance/content.tsx
- src/components/school-dashboard/compliance/actions.ts
- src/components/school-dashboard/compliance/queries.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/compliance/page.tsx
- src/app/api/cron/absence-followup/route.ts
- src/lib/compliance/providers/adek/mapper.ts
- prisma/models/compliance.prisma
- cf/crons.json
- src/components/internationalization/dictionaries/{en,ar}/compliance.json
- content/docs-en/compliance.mdx
- content/docs-en/marketing-brief.mdx
