---
feature: catalog
title: Curriculum Catalog
status: partial
pillar: product-proof
personas: [principal, teacher, student, owner]
routes: [/ar/s/{school}/subjects, /ar/s/{school}/subjects/catalog, /ar/s/{school}/subjects/{subject}, /ar/s/{school}/subjects/contributions]
screenshots: [subject-materials.png, docs/evidence/demo-subjects-ar.png]
readme: ./README.md
docs: content/docs-en/catalog.mdx
updated: 2026-09-27
---

# Curriculum Catalog — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A new school does not start from an empty system: its subjects, chapters and lessons arrive already organised from a shared curriculum library, and the school only switches on what it teaches.

## The school's day without it

Before any timetable, exam or online lesson can be set up, someone has to type in every subject for every grade, then every chapter and lesson from the textbook's contents page. Each school does this alone, and each teacher keeps their own version. Worksheets and past papers stay in personal folders.

## What happens in Balqalam

1. When a school is set up, Balqalam works out its curriculum from the country and school level and adds the matching subjects for each grade.
2. The Subjects page shows every subject by grade, with its own artwork, filterable by stage (primary, middle, secondary).
3. Opening a subject shows its chapters and lessons, study materials, videos and exams, in one page. For the Sudanese curriculum, the official textbook is attached to the subject.
4. The principal decides what the school uses: add or remove subjects, and hide individual chapters or lessons the school does not teach. Hidden items disappear for the school's students only.
5. If a subject is missing, the school can request it. The platform team reviews the request, and the school is notified and sees it pinned at the top of its list when it is ready.
6. Teachers can contribute to a lesson — a worksheet, a question, an assignment or a video — which goes to review before other schools can see it.
7. The same lessons feed the rest of Balqalam: the online courses in Lumos, the exams catalog, lesson quizzes and live classes all point at them.

## Who it is for

- **Owner**: a school that opens with its subjects already in place instead of weeks of data entry.
- **Principal**: control over which subjects, chapters and lessons the school actually uses.
- **Teacher**: chapters and lessons already laid out, with a place to add their own materials and questions.
- **Student**: the same subject structure everywhere — in courses, exams and live classes.

## Real screens to show

- `subject-materials.png` — a Biology subject page in Arabic: banner, chapter strip with artwork, study-material cards, a row of lesson videos and exam counts. Many material cards read "0 items" and there is a red development badge ("4 Issues") bottom-left; crop both before posting.
- `docs/evidence/demo-subjects-ar.png` — the Arabic Subjects page, a grid of subjects by grade with artwork and stage tabs. An onboarding "quick guide" pop-up covers the centre; recapture without it.
- Routes to capture (Arabic, admin login on demo.balqalam.com): `/ar/s/{school}/subjects`, `/ar/s/{school}/subjects/catalog` (adding subjects), and a subject page with a well-filled Sudanese subject.

## What you can say

- The curriculum is shared: every school points at the same subjects, chapters and lessons rather than copying them, so a contribution improves the library for everyone. [docs-en/catalog.mdx "Overview"]
- When a school is created, its subjects are added automatically based on its country and level. [README.md "Modules"; docs-en/catalog.mdx "Status at a glance"]
- The Sudanese curriculum is covered for grades 1 to 12, with the official textbooks attached. [ISSUE.md "Seeds & pipeline"]
- A school can hide any chapter or lesson for its own students without affecting other schools. [ISSUE.md "Visibility / paid content"]
- A school can request a missing subject; it is notified when the request is approved and the subject is waiting at the top of its list. [ISSUE.md "Request → Approval flow"]
- The catalog spans 12 curricula, 6 of them with full chapter-and-lesson depth. [docs-en/catalog.mdx "Status at a glance"]

## Do not say

- "Every curriculum, complete." The Saudi, Egyptian, UAE, Qatari, Kuwaiti and Jordanian curricula list subjects only, without chapters or lessons. [ISSUE.md "Arab nationals depth"]
- "Ministry-approved" or "official partner" of any ministry. The textbooks are attached; no endorsement exists.
- "Video for every lesson." Lessons have no real videos yet; the player shows a placeholder clip. [ISSUE.md "Seeds & pipeline"]
- "Ready-made worksheets for every lesson." Most study-material files are still empty. [ISSUE.md "Asset uploads"]
- "Questions for every subject." Some updated Sudanese grade 10 subjects have no questions in production until they are re-authored. [ISSUE.md "SD textbook update — owed"]
- Storage or scale comparisons from the engineering docs (for example "1,000 schools"); these are design illustrations, not customers.
- School counts beyond the one pilot, King Fahad Schools.

## Post angles

1. "Day one of a new school system: type 12 grades of subjects by hand?" — owner — product-proof — a pain scene: manual curriculum entry versus subjects already in place.
2. "Your textbook, already inside the system" — teacher — product-proof — the Sudanese subject page with its official textbook, chapters and lessons.
3. "How a principal hides the chapters the school does not teach" — principal — school-operations — a how-to on switching off chapters and lessons for one school.
4. "Missing a subject? Ask for it. We tell you when it's ready." — principal — trust — the request-and-notify loop.
5. "Which of your teachers' worksheets deserve to be shared with every school?" — teacher — learning-science — a question to the reader about lesson-level contributions.

## Connects to

- [Subjects](../school-dashboard/listings/subjects/SPOTLIGHT.md)
- [Lumos (online courses)](../lumos/SPOTLIGHT.md)
- [Exams](../school-dashboard/exams/SPOTLIGHT.md)
- [Live classes](../school-dashboard/live/SPOTLIGHT.md)
- [Timetable](../school-dashboard/timetable/SPOTLIGHT.md)
- [Library](../library/SPOTLIGHT.md)
- [Onboarding](../onboarding/SPOTLIGHT.md)

## Sources

- src/components/catalog/README.md
- src/components/catalog/ISSUE.md
- src/components/catalog/CLAUDE.md
- src/components/school-dashboard/listings/subjects/catalog/ (file list)
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/catalog/page.tsx
- src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/[slug]/page.tsx
- content/docs-en/catalog.mdx
- content/docs-en/mvp.mdx
- content/docs-en/marketing-brief.mdx
- subject-materials.png, docs/evidence/demo-subjects-ar.png
