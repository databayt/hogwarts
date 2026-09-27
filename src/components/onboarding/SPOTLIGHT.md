---
feature: onboarding
title: School Setup Wizard
status: partial
pillar: product-proof
personas: [owner, principal, it]
routes: [/ar/onboarding, /ar/onboarding/overview, /ar/onboarding/{id}/title, /ar/onboarding/{id}/import, /ar/onboarding/{id}/legal, /ar/onboarding/{id}/congratulations]
screenshots: []
readme: ./README.md
docs: content/docs-en/onboarding.mdx
updated: 2026-09-27
---

# School Setup Wizard — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

**Which onboarding is this?** The wizard a school owner uses to create a new school on balqalam.com
— NOT the staff joining flow at `/{school}/internal-onboarding` (src/components/internal-onboarding).
**Pilot schools do not use it:** our team sets them up and hands over a populated dashboard the same
day (content/docs-en/pilot.mdx). This is the do-it-yourself path for a school signing up alone.

## In one line

A school owner answers a short series of questions about their school, and at the end gets a
working school at its own web address, with grades, subjects, terms and a draft timetable already
in place.

## The school's day without it

Starting on a new school system usually means weeks of back and forth: someone types every grade,
every class and every subject into empty screens, then retypes the student list from Excel. Until
that is done, nobody can take attendance or send a fee invoice, so the old paper registers stay.

## What happens in Balqalam

1. The owner signs in and opens the setup page. They choose "Create a new school" or start from one
   of four ready-made school types (elementary, high school, private academy, international).
2. A short overview shows the three stages: tell us about your school, set it up, finish and publish.
3. Stage one asks the school's name (the wizard suggests a web address from the name and checks it
   is free), its type and level, its address, and what makes it stand out.
4. Stage two asks capacity (teachers, sections per grade, students per section), the weekly
   schedule style, the logo and brand colours, and offers to import the student or teacher list
   from a CSV, Excel or JSON file. Arabic or English column headers are recognised.
5. Stage three asks how people join (invite codes or manual entry), what parents and students can
   see, the annual tuition fee, optional discounts, and acceptance of the terms.
6. On finishing, the school goes live at its own web address and, in the background, the system
   creates grades, subjects, terms and periods for the school's country, classrooms and sections,
   a draft timetable, a join code, and per-grade fee plans from the tuition entered.
7. A congratulations page shows the school's address and suggests next steps: invite the team, add
   students, set up classes, review the academic year.

## Who it is for

- **Owner** — can open a school on their own, in Arabic, without calling anyone or installing
  anything, and can leave and come back: the wizard resumes at the first unfinished step.
- **Principal** — starts with the school's structure already built (grades, subjects, terms, a
  draft timetable) instead of an empty system; every item stays editable later.
- **IT** — no server, no DNS work: the school's web address is reserved inside the wizard.

## Real screens to show

None yet — capture with /record. Routes to capture (Arabic, signed in as a new user):

- `/ar/onboarding` — create new school / create from template
- `/ar/onboarding/overview` — the three-stage overview
- `/ar/onboarding/{id}/title` — school name with the suggested web address
- `/ar/onboarding/{id}/import` — the roster upload with the "Notify families by email" option
- `/ar/onboarding/{id}/congratulations` — the finish page with the school's address

## What you can say

- The wizard has 15 steps in three stages: tell us about your school, set up your school, finish
  up and publish. [src/components/form/footer.tsx]
- Start from scratch or a template: elementary, high school, private academy, international. [config.ts]
- The student and teacher list can be uploaded as CSV, Excel or JSON; common column names are
  detected in English and Arabic, and missing fields are left empty. [import/content.tsx,
  school-en.json "missingFieldsNote"]
- It suggests the school's web address from its name and says if it is taken. [title/form.tsx]
- When setup finishes, the school gets grades, subjects, terms, periods, classrooms, sections, a
  draft timetable and a join code automatically, based on its country and answers.
  [docs-en/provision.mdx, legal/actions.ts]
- Term dates default to the school's country calendar (for example Sudan, Saudi Arabia, the UAE)
  and can be edited afterwards. [docs-en/provision.mdx]
- The tuition fee entered in the wizard becomes a fee plan for each grade. [legal/actions.ts]
- The owner can stop and return; the wizard reopens at the next unfinished step. [content.tsx]

## Do not say

- Do not say pilot schools fill this in. In the pilot we set the school up for them, same day.
- Do not quote a setup time for the wizard (the engineering doc mentions minutes; it was never
  measured). For the pilot path, "same day" is the approved line.
- Do not say "buy now" or imply payment happens here. The price step is the school's own tuition
  for families, not a balqalam subscription, and online checkout is not open.
- Do not say legal terms or compliance are handled. The terms documents are not finished, and the
  safety and operating-status answers on the last step are collected but not yet saved.
  [ISSUE.md, legal/actions.ts]
- Do not say invite codes are generated in the wizard. The join step only records the school's
  preference; the join code is created at the end of setup. [join/actions.ts]
- Do not promise a custom domain (your own .com). The separate domain step is not in the active
  flow; schools get an address under balqalam.com. [ISSUE.md, footer.tsx]
- Do not say the whole wizard is in Arabic. Template names and a few messages are English only.
  [overview/template-gallery.tsx, config.ts]
- Do not say families are emailed automatically. "Notify families by email" is off by default.
- Global bans apply: no time or money saved, no school counts beyond King Fahad Schools, no
  "works offline", no app-store app.

## Post angles

1. "Your school's web address, reserved while you type its name." — owner — product-proof — the
   name step suggests the address and checks it is free.
2. "An empty school system is the real cost of switching." — principal — school-operations — the
   finish step builds grades, subjects, terms and a draft timetable for you.
3. "How to open your school on balqalam in three stages." — owner — product-proof — a walkthrough
   of tell us, set up, publish, with the congratulations screen as the payoff.
4. "Your Excel list, with Arabic headers, is enough." — owner — product-proof — the import step
   reads CSV, Excel or JSON and recognises Arabic column names.
5. "What would stop you moving your school to a new system this term?" — owner — trust — invite
   the fear, answer with the do-it-yourself wizard or the same-day pilot setup.

## Connects to

- [Import](../school-dashboard/import/SPOTLIGHT.md) — the same roster upload, later, from the dashboard
- [School configuration](../school-dashboard/school/SPOTLIGHT.md) — every wizard answer is editable here afterwards
- [School website](../school-marketing/SPOTLIGHT.md) — publishing the school opens its public site and admissions page
- [Logins](../school-dashboard/listings/credentials/SPOTLIGHT.md) — imported students and staff get logins to share
- [Timetable](../school-dashboard/timetable/SPOTLIGHT.md) — the draft timetable created at the end
- [Fees](../school-dashboard/finance/fees/SPOTLIGHT.md) — per-grade fee plans made from the tuition entered

## Sources

- src/components/onboarding/ — README.md, ISSUE.md, CLAUDE.md, content.tsx, config.ts
- src/components/onboarding/ — overview/steps-overview-client.tsx, overview/template-gallery.tsx, title/form.tsx
- src/components/onboarding/ — import/actions.ts, import/content.tsx, join/actions.ts, join/config.ts, visibility/actions.ts
- src/components/onboarding/ — schedule/actions.ts, legal/actions.ts, congratulations/actions.ts, congratulations/content.tsx
- src/components/form/footer.tsx; src/app/[lang]/onboarding/page.tsx; src/app/[lang]/onboarding/overview/page.tsx
- src/components/internal-onboarding/config.ts; src/app/[lang]/s/[subdomain]/internal-onboarding/page.tsx
- src/components/internationalization/school-en.json (school.onboarding)
- content/docs-en/onboarding.mdx, provision.mdx, pilot.mdx, marketing-brief.mdx
