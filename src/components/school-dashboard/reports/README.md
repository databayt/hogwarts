## Reports — Student report card generation and distribution

### Overview

The reports block handles generating, previewing, and publishing student report cards within the school dashboard. It aggregates exam scores per student per term, calculates grades and GPA using configurable boundaries, renders PDF report cards via `@react-pdf/renderer`, uploads them to the file storage provider, and stores metadata in the `ReportCard` model. Teachers and admins can generate cards for entire classes or individual students, then publish (distribute) them.

### File Structure

```
reports/
├── content.tsx          # Server component: term selector, report card table with status, actions
├── actions.ts           # Server actions: generateReportCards, publishReportCards, getReportCard
├── generate-button.tsx  # Client component: class picker dialog + generate trigger
├── publish-button.tsx   # Client component: bulk publish trigger
└── card-generator.tsx   # Client component: individual card preview/download/share/print UI
```

### Server Actions

- **`generateReportCards({ termId, classId?, studentIds? })`** -- Fetches exams and scores for a term, calculates per-subject grades using `DEFAULT_BOUNDARIES` (A+ through F), renders PDF via `ReportCardTemplate`, uploads to file provider, creates `ReportCard` database records. Returns count and IDs.
- **`publishReportCards({ reportCardIds })`** -- Marks selected report cards as published and triggers distribution (email/notification to guardians).
- **`getReportCard(id)`** -- Fetches a single report card with download URL.

### Grade Calculation

Uses a default boundary scale (configurable per school in the future):

| Min % | Grade | GPA |
| ----- | ----- | --- |
| 90    | A+    | 4.0 |
| 85    | A     | 3.7 |
| 80    | B+    | 3.3 |
| 75    | B     | 3.0 |
| 70    | C+    | 2.7 |
| 65    | C     | 2.3 |
| 60    | D+    | 2.0 |
| 50    | D     | 1.0 |
| 0     | F     | 0   |

### Dependencies

- `@react-pdf/renderer` -- PDF generation
- `@/components/file/generate/report-card` -- `ReportCardTemplate` component
- `@/components/file/generate/types` -- `ReportCardData`, `ReportCardSubject`
- `@/components/file/providers/factory` -- File upload provider

### Authorization

Requires `DEVELOPER`, `ADMIN`, or `TEACHER` role. Checked in `content.tsx` via session role.

### Status

**Completion:** 75% | **Blockers:** Grade boundaries are hardcoded (`DEFAULT_BOUNDARIES`); no school-level configuration yet. Exam-to-term linkage goes through `Class.termId` which may not cover all exam structures.
