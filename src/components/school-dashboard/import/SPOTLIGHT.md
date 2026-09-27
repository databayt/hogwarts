---
feature: import
title: Bulk Import
status: partial
pillar: product-proof
personas: [owner, registrar, it]
routes: [/ar/s/{school}/school/bulk, /ar/onboarding/{id}/import]
screenshots: []
readme: ./README.md
docs: content/docs-en/pilot.mdx
updated: 2026-09-27
---

# Bulk Import — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school uploads the student and teacher lists it already keeps in Excel, and every name becomes a real record with a login, without anyone retyping it.

## The school's day without it

Moving to any new system usually means weeks of typing: someone sits with last year's register and copies every student, parent phone number and grade into a new program, one by one. Mistakes creep in, the job drags past the start of term, and the school keeps running on paper while it waits.

## What happens in Balqalam

1. An admin opens the Bulk screen in the school settings. It shows four upload tiles: Students, Teachers, Staff and Guardians.
2. Each tile offers a ready template to download, but the school does not have to use it. It can drop in its own Excel sheet, a CSV file, a JSON file or, on this screen, a Word table.
3. Column headings are matched for them, in Arabic or English. Headings such as الاسم, اسم الطالب, الصف, الشعبة, ولي الأمر, هاتف ولي الأمر, تاريخ الميلاد and الجنس are all recognised.
4. The file is checked first. Rows with no name are counted as problems and reported by row number before anything is saved.
5. The import runs. Each student gets a student code, a login and their guardians; when the grade column matches one of the school's grades, the student is placed in that grade and the year's fees and invoices are created. People who already exist are skipped, not duplicated, and a grade that does not match is reported as a warning.
6. The tile shows how many were imported, skipped or failed, and offers a "Download logins" file with the new usernames and one-time passwords to hand out. Sending families a welcome email is optional and off unless ticked.

## Who it is for

- **Owner:** the biggest fear about switching, "we can't handle a migration", is answered with a file the school already has.
- **Registrar:** no retyping of names, grades and parent numbers; the register is filled from last year's sheet.
- **IT / admin:** one screen for students, teachers, staff and guardians, with a clear report of what went in and what did not.

## Real screens to show

None yet — capture with /record. Routes to capture:

- `/ar/s/{school}/school/bulk` — the four upload tiles, a file being dropped, and the imported / skipped / failed result with the Download logins button.
- `/ar/onboarding/{id}/import` — the upload step inside a new school's setup wizard.
- Then `/ar/s/{school}/students` straight after, to show the list already filled.

## What you can say

- The school can send the Excel list it already keeps; Arabic column headings are fine. [docs-en/pilot.mdx, src/lib/import/csv-utils.ts]
- Accepted files are Excel (.xlsx, .xls), CSV and JSON, plus Word tables on the dashboard's Bulk screen. [school/bulk/content.tsx, onboarding/import/content.tsx]
- Students, teachers, staff and guardians can all be imported. [school/bulk/actions.ts]
- An imported student goes through the same setup as a student who applied online: student code, login, guardians and, once the grade matches, fees and invoices. [docs-en/admission.mdx]
- After the import the admin can download the new logins to hand out; each password must be changed at first sign-in. [school/bulk/actions.ts, file/import/csv-import.ts]
- Existing people are skipped rather than duplicated, and problems are reported by row number. [school/bulk/content.tsx, file/import/csv-import.ts]
- During the pilot the school sets up nothing: the team imports the roster and the admin logs in to a populated dashboard the same day. [docs-en/pilot.mdx]

## Do not say

- "Import anything": attendance, timetable, exam scores and materials imports appear on the screen marked "Soon". They are not built.
- "Preview your data before it is saved." There is a check that counts problem rows, but no full preview-and-edit step.
- "Update existing records by re-uploading." Bulk updates are not built; existing people are skipped.
- "Import every sheet in your workbook." Only the first sheet of an Excel file is read.
- "Instant for thousands of rows" or any speed or time-saved figure. None has been measured.
- "Migrate from your old system automatically" or "connects to your current SIS." There is no connection to other systems; it reads files.
- The upload screen inside this folder is an older version that no page shows today. The live screens are the Bulk screen under School and the setup wizard's import step.

## Post angles

1. "Your school's Excel sheet is already your migration plan." — owner — product-proof — the migration fear answered by a file they already have.
2. "Excel in, whole school out." — registrar — product-proof — a 30-second screen recording from dropping the file to a filled student list.
3. "How to move your student list in three steps." — registrar — school-operations — download or skip the template, drop the sheet, download the logins.
4. "Arabic headings? Keep them." — it — product-proof — show a sheet with الاسم and الصف columns being recognised as-is.
5. "What stops your school from switching systems: the software, or the typing?" — owner — trust — ask the reader, then answer with the upload.

## Connects to

- [School setup wizard](../../onboarding/SPOTLIGHT.md) — the same import runs as a step when a new school is set up.
- [School configuration](../school/SPOTLIGHT.md) — the live Bulk screen sits in the school settings area.
- [Students](../listings/students/SPOTLIGHT.md) — where the imported students appear.
- [Logins](../listings/credentials/SPOTLIGHT.md) — handing out the usernames and passwords the import creates.
- [Admission](../admission/SPOTLIGHT.md) — imported students also appear in the Applications list, tagged as imported.

## Sources

- src/components/school-dashboard/import/README.md
- src/components/school-dashboard/import/ISSUE.md
- src/components/school-dashboard/import/csv-import.tsx (not rendered by any route)
- src/components/school-dashboard/school/bulk/content.tsx
- src/components/school-dashboard/school/bulk/actions.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/school/bulk/page.tsx
- src/components/onboarding/import/content.tsx, src/components/onboarding/import/actions.ts
- src/components/file/import/csv-import.ts
- src/lib/import/csv-utils.ts
- src/components/internationalization/school-en.json, school-ar.json (bulk keys)
- content/docs-en/pilot.mdx
- content/docs-en/admission.mdx
- content/docs-en/marketing-brief.mdx
