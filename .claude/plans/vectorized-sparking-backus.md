# Plan: Add Mock Exams page at `/exams/mock`

## Context

The subject detail page (`/subjects/[slug]`) shows CatalogExam cards. The "See all" link currently points to `/exams/upcoming` (school-scoped scheduled exams) — wrong target. Need a `/exams/mock` page showing global CatalogExam data, with PageNav link and corrected "See all" href.

## Changes

### 1. Add "Mock" to PageNav — `exams/layout.tsx`

Add `{ name: "Mock", href: \`/\${lang}/exams/mock\` }`to`examsPages` array.

### 2. Create route — `exams/mock/page.tsx`

Same pattern as `upcoming/page.tsx`: read `catalogSubjectId` from searchParams, pass to content.

### 3. Create content — `exams/mock/content.tsx`

Server component querying `db.catalogExam.findMany()` (global, no schoolId). Filter by `status: "PUBLISHED"`, optional `subjectId` from searchParams. Grid of exam cards showing type badge, title, duration, marks, questions.

### 4. Update "See all" href — `catalog-content-sections.tsx` line 368

Change `exams/upcoming` → `exams/mock`.

### 5. Add loading skeleton — `exams/mock/loading.tsx`

## Files

| Action | File                                                     |
| ------ | -------------------------------------------------------- |
| Edit   | `src/app/.../exams/layout.tsx`                           |
| Create | `src/app/.../exams/mock/page.tsx`                        |
| Create | `src/components/school-dashboard/exams/mock/content.tsx` |
| Create | `src/app/.../exams/mock/loading.tsx`                     |
| Edit   | `src/components/.../catalog-content-sections.tsx`        |
