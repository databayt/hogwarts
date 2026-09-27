---
feature: qbank-automation
title: Question Bank Automation
status: not-shipped
pillar: learning-science
personas: [teacher]
routes: []
screenshots: []
readme: ./README.md
docs: none
updated: 2026-09-27
---

# Question Bank Automation — Spotlight

> For the content and social media team. What this does for a school, in plain words.
> Engineering detail lives in README.md next to this file.

## In one line

A planned engine that would read a textbook file and write practice questions from it in bulk; it is not connected to anything a school can use today.

## The school's day without it

Teachers write every question themselves, chapter by chapter, from the textbook on their desk. A good question bank takes years to build and usually lives in one teacher's files. This is still the situation this engine was meant to address, and it has not been delivered.

## What happens in Balqalam

1. Nothing yet, for this engine. No screen, menu item or scheduled job uses it.
2. What exists is early building blocks: code to split a textbook file into passages, a set of question-writing instructions for an AI, and a search helper. The README describes more parts (a question writer and a quality scorer) that are not in the folder.
3. The instructions it holds were written for a British medical exam (MRCP), not for school curricula.
4. What schools do have today is the question bank inside Exams: questions added by hand, imported from a spreadsheet, adopted from the shared catalog, or drafted by AI one topic at a time and reviewed by the teacher before saving. Write about that one instead — see the Exams spotlight.

## Who it is for

- **Teacher**: would eventually get questions drafted from their own textbook. Not available.

## Real screens to show

- None — there is no screen for this feature. Do not capture.
- For question-bank content, use the Exams routes instead: `/ar/s/{school}/exams/qbank` and `/ar/s/{school}/exams/qbank/ai-generate`.

## What you can say

- Nothing public about this engine. It is internal groundwork with no user-facing screen. [search of src/ for imports of this folder: none]
- For the question bank schools actually use, see the Exams spotlight. [../exams/SPOTLIGHT.md]

## Do not say

- "Balqalam writes questions from your textbooks automatically." Not shipped.
- "Upload a PDF and get a question bank." Not shipped.
- "Every AI question is quality-scored" or "auto-approved above a score." The scorer described in the README is not in the codebase.
- "Daily automatic question generation." No such scheduled job exists.
- Any cost-per-question, benchmark or quality percentage from the README — these are estimates and targets, never measured.
- Anything about medical-exam preparation (MRCP, USMLE); that is not Balqalam's market.

## Post angles

Do not post about this yet.

For question-bank posts, use the angles in the Exams spotlight (AI drafting of questions on a topic, adopting a ready-made exam from the shared catalog) — those features exist today.

## Connects to

- [Exams (the question bank schools use today)](../exams/SPOTLIGHT.md)
- [Curriculum catalog](../../catalog/SPOTLIGHT.md)

## Sources

- src/components/school-dashboard/qbank-automation/README.md
- src/components/school-dashboard/qbank-automation/engine/ (embedding-service.ts, pdf-parser.ts, prompts.ts)
- prisma/models/school-qbank.prisma (SourceMaterial, SourceChunk, GenerationJob, QuestionReview)
- src/components/school-dashboard/exams/qbank/README.md
- src/components/school-dashboard/exams/qbank/actions/ai-generation.ts
- src/app/api/cron/ (no question-generation job present)
- content/docs-en/marketing-brief.mdx
