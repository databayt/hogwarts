---
feature: subjects
title: Subjects
status: live
pillar: learning-science
personas: [principal, teacher, student]
routes: [/ar/s/{school}/subjects, /ar/s/{school}/subjects/{subject}, /ar/s/{school}/subjects/{subject}/textbook, /ar/s/{school}/subjects/catalog, /ar/s/{school}/subjects/contribute, /ar/s/{school}/subjects/contributions]
screenshots: [subject-materials.png, docs/evidence/demo-subjects-ar.png, subjects-mobile-after.png, subjects-local-390.png]
readme: ./README.md
docs: content/docs-en/catalog.mdx
updated: 2026-09-27
---

# Subjects — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Every subject the school teaches, per grade, ready from day one — with its chapters, materials, videos, exams and, for some subjects, the textbook to read on screen.

## The school's day without it

At the start of the year someone types the subject list for every grade into a spreadsheet. Teachers bring their own worksheets on flash drives, the textbook is a heavy PDF in a WhatsApp group, and students ask "which chapter are we on?" in the evening. Nothing links the subject to its lessons, its materials or its exams.

## What happens in Balqalam

1. When the school is set up, its subjects are filled in from the curriculum it follows, grade by grade. If a school has none yet, the Subjects page sets them up the first time it opens.
2. Subjects appear as a grid of cards, one per subject per grade, with tabs for elementary, middle and high school when the school has more than one stage.
3. Opening a subject shows its chapters, teaching materials (syllabus, references, worksheets and more), videos, a question bank and past exams.
4. Where the subject has a textbook, a "Textbook" tile opens it on screen like a book: cover, contents, page turns, search, bookmarks, reading themes and text size. If there is no text version yet, it opens the original PDF.
5. The admin uses the Catalog tab to choose which subjects each grade takes, filtered by curriculum.
6. Teachers can contribute their own questions, materials and assignments to a subject; each goes in as a draft awaiting approval, and teachers can see their own contributions in one list.

## Who it is for

- Principal: the subject list for every grade is ready without typing it, and can be adjusted per grade.
- Teacher: sees the subjects they teach, with chapters, materials and exams in one place, and can add their own.
- Student: sees only the subjects of their own grade, and can read the textbook on a phone.

## Real screens to show

- subject-materials.png — Arabic Biology subject page: banner, chapters row, teaching materials, videos, and exams. Crop the red development "Issues" badge (bottom left) and the photo avatar in the top bar before posting.
- docs/evidence/demo-subjects-ar.png — Arabic subject grid on desktop, with the stage tabs. The "quick guide" welcome pop-up covers the centre; recapture with it closed, or crop to an uncovered area.
- subjects-mobile-after.png, subjects-local-390.png — the subject grid on a phone. Both show the quick guide pop-up and a development badge; recapture before posting.
  Routes to capture if more are needed: /ar/s/{school}/subjects/{subject}/textbook (the book reader), /ar/s/{school}/subjects/catalog (the admin's subject picker).

## What you can say

- A student sees only the subjects of their own grade. [subjects/content.tsx, ISSUE.md]
- Each subject page brings together chapters, teaching materials, videos, a question bank and exams. [catalog-content-sections.tsx, subject-materials.png]
- Some textbooks can be read on screen like a book, with contents, search, bookmarks, four reading themes and adjustable text size; others open as the original PDF. [README.md, textbook/load.ts]
- The school chooses which subjects each grade takes from its curriculum. [catalog/subject-picker.tsx, catalog/actions.ts]
- The subject catalog spans 12 curricula, 6 of them in full depth (including Sudan, US, UK, IGCSE, IB and CBSE). [docs-en/catalog.mdx]
- Teachers can contribute questions, materials and assignments; contributions wait for approval before they are published. [catalog/contribution-actions.ts]
- The subject list is filled in automatically for a new school, so the page is never empty on day one. [subjects/content.tsx]

## Do not say

- Do not promise the on-screen book for every subject. The full book reader works only where a text version of the textbook exists; so far the contents are set up for Grade 12 biology and physics (Sudan). Other subjects open the PDF or have no textbook. [README.md]
- Do not show or promise the school "Customize content" panel (hiding chapters, lessons, videos or quizzes). It was removed from the subject page in July 2026. [ISSUE.md]
- Do not say parents can browse subjects. The Subjects page is for admins, staff, teachers and students. [platform-sidebar/config.ts]
- Do not claim prerequisites between subjects, curriculum-standards mapping, learning outcomes or subject performance analytics. Not built. [ISSUE.md]
- Do not claim that every video, material or exam slot is filled. Many materials categories on a subject can show zero items.
- Do not mention a mobile app textbook or "download our app"; there is no store app.
- Global bans: no hours or money saved, no "advanced analytics", no "works offline", never the retired product codename, no real actors' photos or Harry Potter names from the demo accounts.

## Post angles

1. "The textbook, the worksheets and the chapter list, in three different WhatsApp groups" — teacher — learning-science — Pain scene: scattered subject material versus one subject page.
2. "Open the biology textbook. Turn the page." — student — product-proof — Screen recording of the book reader on a phone: cover, contents, a page turn, then search.
3. "Your subjects are ready before you type a single one" — principal — school-operations — The subject grid filled from the school's curriculum on day one.
4. "What a Grade 12 student sees when they open Biology" — student — learning-science — Persona view walking through chapters, materials, videos and exams on the subject page.
5. "Which subject in your school most needs its textbook on students' phones?" — principal — learning-science — Question to the reader, leading to the on-screen textbook.

## Connects to

- [Classes](../classes/SPOTLIGHT.md) — each class teaches one subject.
- [Teachers](../teachers/SPOTLIGHT.md) — teachers see the subjects they teach and contribute to them.
- [Students](../students/SPOTLIGHT.md) — students see their own grade's subjects.
- [Classrooms](../classrooms/SPOTLIGHT.md) — subjects are taught per grade and section.
- [Exams](../../exams/SPOTLIGHT.md) — the subject page links to its question bank and exams.
- [Timetable](../../timetable/SPOTLIGHT.md) — subjects are placed into periods.

## Sources

- src/components/school-dashboard/listings/subjects/README.md
- src/components/school-dashboard/listings/subjects/ISSUE.md
- src/components/school-dashboard/listings/subjects/content.tsx
- src/components/school-dashboard/listings/subjects/catalog-content-sections.tsx
- src/components/school-dashboard/listings/subjects/catalog/content.tsx
- src/components/school-dashboard/listings/subjects/catalog/subject-picker.tsx
- src/components/school-dashboard/listings/subjects/catalog/actions.ts
- src/components/school-dashboard/listings/subjects/catalog/contribution-actions.ts
- src/components/school-dashboard/listings/subjects/textbook/load.ts, textbook/content.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/ ((browse) layout and page, [slug] layout and page, catalog, contribute, contributions)
- src/components/template/platform-sidebar/config.ts
- content/docs-en/catalog.mdx
- content/docs-en/listings.mdx
- content/docs-en/marketing-brief.mdx
- Repo-root screenshots: subject-materials.png, docs/evidence/demo-subjects-ar.png, subjects-mobile-after.png, subjects-local-390.png
