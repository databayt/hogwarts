# Grades — Production Readiness Tracker

## 2026-10-04 — the old "add result" form is gone

`ResultCreateForm` (`form.tsx`) and its two steps (`student-assignment.tsx`,
`grading.tsx`) plus `data-fetchers.ts` were rendered nowhere — the grade wizard
replaced them — and picked a class first. Deleted with the rest of Class (S15).

**Status:** 🟡 IN PROGRESS
**Completion:** 75%
**Last Updated:** 2026-09-14

---

## Recently Fixed

- **Student/guardian self-view on `/grades` (#412, 2026-09-14)** — the sidebar linked Grades for STUDENT and GUARDIAN, but `routes.ts` allowed only ADMIN/TEACHER, so they landed on `/unauthorized`. `/grades` (exact) now admits both; `GradesContent` scopes the SSR rows to the viewer's own student record / linked children (the `getResults` action already did). `buildResultWhere` no longer lets `studentId` override a `studentIds` scope — `?studentId=<other>` returned another student's grades. Self-view hides the staff tab row and the row "View" link (`/grades/*` stays staff-only). Open: students still have no own detail / transcript / report-card view.

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Multi-step form (student/assignment selection then scoring)
- [x] Grade entry (score, max score, letter grade)
- [x] Percentage auto-calculation
- [x] Teacher feedback field
- [x] Search and filtering
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Integration with assignments
- [x] Score validation (score cannot exceed max score)
- [x] Bulk grade entry component
- [x] Grade detail view
- [ ] GPA calculation (term and cumulative)
- [ ] Report card generation
- [ ] Grade boundaries configuration

## Known Issues

### P1 — High

- [ ] GPA calculation engine not yet implemented
- [ ] Report card PDF generation not functional (DB rows generate; server-side
      PDF render → `reportCard.pdfUrl` is still pending — see grades block
      ISSUE.md "Deferred")
- [ ] Grade boundaries not configurable per school
- [x] ~~Promotion/transcripts pages are stubs~~ — RESOLVED. Promotion,
      transcripts, report-card generation, and the certificate engine are
      implemented in the sibling `grades/` block (`grades/actions/*`,
      `grades/promotion`, `grades/transcripts`, `grades/report-cards`).

### P2 — Medium

- [ ] No gradebook matrix view (students x assignments)
- [ ] Role-scoped access for teachers (view own classes only) needs verification
- [ ] No grade distribution charts

## Enhancements (Post-MVP)

- [ ] Gradebook matrix view with inline editing
- [ ] Weighted GPA (honors/AP courses)
- [ ] Report card batch generation and email delivery
- [ ] Honor roll identification
- [ ] At-risk student tracking
- [ ] Transcript generation
- [ ] Class rank calculation
- [ ] Progress reports (mid-term)
- [ ] Grade export to CSV

---

**Last Review:** 2026-03-19
