---
feature: documents
title: Document Templates
status: live
pillar: school-operations
personas: [teacher, registrar, principal, owner]
routes: [/ar/s/{school}/exams/templates, /ar/s/{school}/grades/templates, /ar/s/{school}/grades/reports]
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Document Templates — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

The school keeps its own official Word layouts for exam papers, certificates and report cards, and Balqalam fills them with the right names, marks and questions.

## The school's day without it

Every school already has its mandated format: the ministry's certificate, the head's preferred exam paper header, the report card parents recognise. At the end of term someone opens that Word file and types every student's name, class and marks into it by hand, one copy at a time. Copy-paste mistakes slip through, and the Arabic text fights the layout on every page.

## What happens in Balqalam

1. A teacher or administrator opens the Templates tab under Exams (for exam papers and certificates) or under Grades (for report cards).
2. They upload their own Word file, with short tags where the data should go, such as the student's name or the exam date. If they have no file ready, a "Starter template" button gives them one with the tags already in place.
3. Balqalam checks the file on upload. It lists which tags it will fill, marks any it does not recognise, and refuses a file whose repeating sections are broken — explaining which tags to fix — instead of saving a template that would fail later.
4. For an exam paper, the teacher picks an existing exam, or picks a question blueprint, a class, a title and a date. Balqalam then draws the questions from the school's question bank and fills the paper, grouped into sections with continuous numbering. If the bank is short of questions, it names the missing parts instead of quietly printing a short paper.
5. For a certificate or a report card, a "Generate (my template)" button on the certificate list and the report-cards table fills the school's default template for that student.
6. On the report-cards table, "Generate all" fills the whole filtered group, downloading in zip files of up to 50 documents each.
7. The finished file downloads as a Word document, ready to print or adjust.

## Who it is for

- **Teacher**: an exam paper in the school's own layout, with questions drawn from the bank, in a few clicks.
- **Registrar**: a term's report cards and certificates filled in the official format without retyping names and marks.
- **Principal**: every paper and report leaves the school in the same approved layout.
- **Owner**: the school keeps the formats it is required to use — nothing to redesign when moving to Balqalam.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, as the demo admin or teacher): `/ar/s/{school}/exams/templates` (the template list and the upload dialog showing detected fields), `/ar/s/{school}/grades/templates`, the "Use this template" dialog for an exam paper, and `/ar/s/{school}/grades/reports` with the "Generate all" button. A short recording that ends by opening the filled Word file in Arabic would be the strongest asset.

## What you can say

- Schools upload their own Word layout; Balqalam fills it with school data. [README.md, school-en.json "documents"]
- It works today for exam papers, certificates and report cards. [ISSUE.md 2026-07-18, CLAUDE.md]
- A ready-made starter Word file with the right tags is one click away, for each of the three document types. [starter-template.ts, ISSUE.md 2026-08-14]
- The upload is checked on the spot: broken files are refused with the tags to fix, and unknown tags are flagged before anything is printed. [ISSUE.md 2026-08-28, upload-template-dialog.tsx]
- An exam paper can be built from a question blueprint: questions come from the school's own bank, grouped by type, numbered continuously, and any shortfall is named. [exam-paper-flow.ts, ISSUE.md 2026-08-28]
- A whole group of report cards can be filled at once, delivered in zip files of up to 50. [config.ts, grades/report-cards/table.tsx]
- Only staff who manage exams and grades (administrators and teachers) can generate filled documents. [ISSUE.md 2026-07-18, generate.ts]

## Do not say

- That the output is a PDF. It is a Word document today; PDF output is planned.
- That letters, receipts, transcripts or ID cards can be filled from a school's template. Only exam papers, certificates and report cards work today.
- That a whole school's report cards come out as one file. Large groups arrive as several zip files of up to 50.
- "Import your old exam papers" or reading questions out of an uploaded paper. That is on the backlog, not built.
- That Balqalam designs the school's certificates for it here. This feature fills the school's own layout; the built-in designs are a separate feature.
- Anything about filing these documents with a ministry or regulator. The school prints or sends them itself.
- Any figure for hours saved at the end of term.

## Post angles

1. "End of term: a stack of report cards, one Word file, one person retyping." — registrar — school-operations — A pain scene of retyping names and marks, then the same template filled for the whole class.
2. "Keep your ministry's certificate layout. We fill it in." — owner — product-proof — The school's official format stays exactly as it is; Balqalam only supplies the data.
3. "How to turn your exam-paper Word file into a Balqalam template." — teacher — school-operations — Download the starter, move the tags into your layout, upload, and see which fields will fill.
4. "A question blueprint in, a numbered Arabic exam paper out." — teacher — learning-science — Questions come from the school's bank by type and mark, and gaps in the bank are named, not hidden.
5. "Which document does your school still fill in by hand every term?" — principal — school-operations — A question post, answered with the three documents Balqalam fills today.

## Connects to

- [Exams](../exams/SPOTLIGHT.md) — exam papers and certificates are filled from exam data and hosted under Exams.
- [Grades](../grades/SPOTLIGHT.md) — report cards are filled from the grades and hosted under Grades.
- [Classrooms](../listings/classrooms/SPOTLIGHT.md) — an exam paper built from a blueprint is set for a section or a whole grade.

## Sources

- src/components/school-dashboard/documents/README.md
- src/components/school-dashboard/documents/ISSUE.md
- src/components/school-dashboard/documents/CLAUDE.md
- src/components/school-dashboard/documents/config.ts
- src/components/school-dashboard/documents/generate.ts
- src/components/school-dashboard/documents/exam-paper-flow.ts
- src/components/school-dashboard/documents/starter-template.ts
- src/components/school-dashboard/documents/upload-template-dialog.tsx
- src/components/school-dashboard/exams/certificates/certificate-list.tsx
- src/components/school-dashboard/exams/paper/content.tsx
- src/components/school-dashboard/grades/report-cards/table.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/templates/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/grades/templates/page.tsx
- src/components/internationalization/school-en.json (school.documents keys)
- content/docs-en/marketing-brief.mdx
