---
feature: exams
title: Exams
status: partial
pillar: school-operations
personas: [teacher, principal, student, parent]
routes: [/ar/s/{school}/exams, /ar/s/{school}/exams/new, /ar/s/{school}/exams/manage, /ar/s/{school}/exams/qbank, /ar/s/{school}/exams/qbank/ai-generate, /ar/s/{school}/exams/generate/catalog, /ar/s/{school}/exams/templates, /ar/s/{school}/exams/mark, /ar/s/{school}/exams/result, /ar/s/{school}/exams/upcoming, /ar/s/{school}/exams/quick, /ar/s/{school}/exams/certificates]
screenshots: []
readme: ./README.md
docs: content/docs-en/exams.mdx
updated: 2026-09-27
---

# Exams — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

Teachers keep their questions in one bank, turn them into an exam paper on the school's own letterhead, mark it (multiple choice marks itself), and publish results that flow straight into the gradebook.

## The school's day without it

A teacher types each exam from scratch in Word, copying last year's questions out of an old file or a notebook. Papers are photocopied, marked by hand at the kitchen table, and the marks are added up on a calculator and copied into a register, then retyped for the report card. Nobody can easily say which questions most students got wrong.

## What happens in Balqalam

1. A teacher opens Exams and chooses how to start: adopt a ready-made exam blueprint from the shared catalog, or ask the AI to draft questions on a topic.
2. Questions live in the school's question bank, each tagged by subject, type (multiple choice, true/false, fill-in-the-blank, short answer, essay and more), difficulty and thinking level. Questions can also be added by hand or imported from a spreadsheet file.
3. A blueprint says how many questions of each type and difficulty the paper needs; Balqalam picks them from the bank. If the bank is short, it still builds the paper and says clearly which parts could not be filled.
4. The school uploads its own Word template (or starts from a ready-made starter file), and Balqalam fills it with the exam: school name, questions grouped by type, marks and blank answer lines. The teacher downloads a Word file to print.
5. Exams can also be taken on screen: a timed exam player with a countdown, answers saved as the student goes, and warnings logged if the student switches tabs or copies and pastes.
6. Multiple choice, true/false and fill-in-the-blank are marked automatically. For essays and short answers, one "Auto-mark & publish" button asks the AI for a suggested mark; teachers can review and override any mark.
7. Results are published to students with a notification, and each score is written into the gradebook that report cards are built from. Students and teachers also get reminders before a scheduled exam.

## Who it is for

- **Teacher**: a reusable question bank, papers assembled from it, automatic marking of objective questions, and a per-question view of what the class got wrong.
- **Principal**: every exam in the school in one table (grade, subject, type, date and time, marks, status), with scheduling clashes flagged.
- **Student**: upcoming exams, on-screen exams with a timer, practice quizzes, and their own results.
- **Parent**: their child's exam results, reached from the parent view.

## Real screens to show

- None yet — capture with /record.
- Routes to capture (Arabic, admin or teacher login on demo.balqalam.com): `/ar/s/{school}/exams` (the overview), `/ar/s/{school}/exams/new` (the two ways to start), `/ar/s/{school}/exams/qbank` (the question bank), `/ar/s/{school}/exams/generate/catalog` (adopting a blueprint), `/ar/s/{school}/exams/mark` (marking), `/ar/s/{school}/exams/result` (results). For students: `/ar/s/{school}/exams/upcoming` on a phone.

## What you can say

- Exam creation starts from one screen with two paths: adopt a ready-made exam from the shared catalog, or generate questions with AI. [README.md; docs-en/exams.mdx "Create an exam — two modes"]
- The paper's layout is the school's own Word template; Balqalam fills it with the questions and a ready-made starter template is offered so nobody starts from a blank page. [CLAUDE.md "Key Decisions"; docs-en/exams.mdx "Document templates"]
- When the question bank is too small for the blueprint, the paper is still produced and the missing categories are named, instead of failing silently. [docs-en/exams.mdx "When the bank is short"]
- Multiple choice, true/false and fill-in-the-blank answers are marked automatically, and a fully objective on-screen exam is graded the moment the student submits. [docs-en/exams.mdx "Automation pipeline"]
- Essays and short answers get an AI-suggested mark in one click; a teacher can override any mark. [mark/actions/ai-grade.ts; docs-en/exams.mdx "Marking"]
- AI question drafts are capped per school (20 a minute, 300 a day) and the teacher reviews them before saving to the bank. [ISSUE.md "AI cost cap wired"; qbank/actions/ai-generation.ts]
- Published results notify students and land in the same gradebook that report cards read. [README.md "Automation Pipeline"]
- Exam certificates carry a verification code that anyone can check on a public page, no account needed. [src/app/[lang]/verify/[code]/page.tsx]

## Do not say

- "AI marks your exams" or "AI grades essays accurately." AI suggests a mark for essays and short answers only; the teacher owns the final mark. Accuracy has not been measured.
- "Reads handwritten answers" or "scan paper exams." The handwriting-reading code exists behind the scenes, but there is no screen for it.
- "Builds the whole exam from one prompt." AI drafts questions into the bank; the one-prompt full paper is listed as a future step.
- "Prints a PDF." The filled paper downloads as a Word file; PDF conversion of school templates is deferred.
- "Fully Arabic everywhere." Some exam screens still show English labels (report-card generate and publish buttons, parts of the catalog and AI-generate screens, quiz card units). [ISSUE.md "Open — strings with no key"]
- "Anti-cheating" or "proctored exams" as a guarantee. The player logs tab switches and copy/paste; it does not stop them.
- Half marks, recurring weekly quizzes, drag-and-drop rescheduling: not built. [ISSUE.md "P2"]
- "Works offline", hours saved, percentages, "advanced analytics".

## Post angles

1. "The exam is on Sunday. The questions are in last year's notebook." — teacher — school-operations — a pain scene: retyping papers from scratch versus pulling them from a question bank the school keeps.
2. "Your letterhead, your layout. We just fill it." — principal — product-proof — the school uploads its own Word paper and Balqalam fills in the questions and marks.
3. "How to build a 40-mark paper from your question bank in three steps" — teacher — school-operations — a how-to: blueprint, auto-pick from the bank, download the filled paper.
4. "Multiple choice marks itself. Essays get a suggested mark, and you have the final word." — teacher — product-proof — a persona view on what is automatic and what stays with the teacher.
5. "Which question did most of your class get wrong last term? Could you find out in a minute?" — principal — learning-science — a question to the reader, pointing at per-question results.

## Connects to

- [Report cards and transcripts](../grades/SPOTLIGHT.md)
- [Gradebook](../listings/grades/SPOTLIGHT.md)
- [Question bank automation](../qbank-automation/SPOTLIGHT.md)
- [Curriculum catalog](../../catalog/SPOTLIGHT.md)
- [Document templates](../documents/SPOTLIGHT.md)
- [Assignments](../listings/assignments/SPOTLIGHT.md)
- [Notifications](../notifications/SPOTLIGHT.md)
- [Parent portal](../parent-portal/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/exams/README.md
- src/components/school-dashboard/exams/ISSUE.md
- src/components/school-dashboard/exams/CLAUDE.md
- src/components/school-dashboard/exams/qbank/README.md
- src/components/school-dashboard/exams/qbank/actions/ai-generation.ts
- src/components/school-dashboard/exams/mark/actions/ai-grade.ts
- src/components/school-dashboard/exams/mark/actions/ocr.ts
- src/lib/ai/openai.ts, src/lib/ai/config.ts
- src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/ (route tree)
- src/app/[lang]/verify/[code]/page.tsx
- content/docs-en/exams.mdx
- content/docs-en/marketing-brief.mdx
