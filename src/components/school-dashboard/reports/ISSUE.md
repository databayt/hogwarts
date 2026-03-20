# Reports — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-03-19

---

## MVP Checklist

### UI Components

- [x] Report cards content page with term selector
- [x] Report card table (student name, status, actions)
- [x] Generate button with class picker dialog
- [x] Publish button for bulk distribution
- [x] Card generator (preview, download, share, print)

### Server Actions

- [x] `generateReportCards` (term-based, optional class/student filter)
- [x] `publishReportCards` (bulk publish by IDs)
- [x] `getReportCard` (single card fetch)
- [x] Grade calculation from exam scores (`gradeFromPercentage`)
- [x] PDF rendering via `@react-pdf/renderer`
- [x] File upload to storage provider

### Authorization

- [x] Role check (DEVELOPER, ADMIN, TEACHER)
- [x] `schoolId` scoping on all queries

### Data Pipeline

- [x] Fetch exams by term (via `Class.termId`)
- [x] Aggregate scores per student per subject
- [x] Calculate percentage, grade, and GPA
- [x] Create `ReportCard` database records

---

## Known Issues

### P1 — High

- **Hardcoded grade boundaries**: `DEFAULT_BOUNDARIES` in `actions.ts` cannot be configured per school. Schools with different grading systems (e.g., letter-only, percentage-only, custom scales) cannot use this feature correctly.
- **Exam-to-term linkage**: Exams are linked to terms through `class.termId`. If exams exist outside class-term relationships or use a different term association, they will be missed during generation.

### P2 — Medium

- **No report card template customization**: All schools get the same PDF layout from `ReportCardTemplate`. No support for school branding (logo, colors, custom fields).
- **No regeneration safeguard**: Generating report cards for a term/class that already has cards may create duplicates. No upsert or conflict detection logic is visible.
- **Card generator is heavy**: `card-generator.tsx` imports many icons and UI components. Performance impact on pages with many students should be evaluated.

---

## Enhancements (Post-MVP)

- Add per-school grade boundary configuration (database-driven)
- Add report card template customization (school logo, colors, custom sections)
- Add duplicate detection / regeneration flow (update existing cards vs. create new)
- Add guardian notification on publish (email with PDF attachment or download link)
- Add bulk download (ZIP of all report cards for a class)
- Add attendance and behavior data to report cards
- Add historical comparison (term-over-term progress)
- Add student/guardian portal view for published report cards

---

**Last Review:** 2026-03-19
