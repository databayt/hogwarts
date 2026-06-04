## Exams -- Examination Management System

### Overview

The Exams block provides a comprehensive examination platform covering the full lifecycle from question authoring through exam generation, administration, automated marking, and results analytics. Organized into 5 core sub-blocks plus additional modules (paper, wizard, grading, progress, mock). Components are fully built and **all routes are wired** (100+ route files under `(school-dashboard)/exams/` and `(exam-wizard)/`). See `PRODUCTION-AUDIT.md` for the authoritative production-readiness status and remaining (mostly schema-level) blockers.

### Capabilities by Role

- **Admin**: Full CRUD on exams, question bank, templates, results; configure grade boundaries; generate PDF reports; view analytics
- **Teacher**: Create and manage exams for assigned subjects, enter marks, grade submissions, generate reports, use question bank
- **Accountant**: Read-only access to results and analytics, export reports
- **Student**: View own results (limited scope)
- **Guardian**: View children's results (limited scope)

### Routes

| Route                                                               | Page              | Status |
| ------------------------------------------------------------------- | ----------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams`                    | Exam Dashboard    | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage`             | Exam Management   | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/[id]`        | Exam Detail       | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank`              | Question Bank     | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate`           | Auto-Generate     | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/templates` | Exam Templates    | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark`               | Auto-Mark         | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark/grade/[id]`    | Grade Exam        | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results`            | Results Dashboard | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/[examId]`   | Exam Results      | Wired  |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/analytics`  | Analytics         | Wired  |

### File Structure

```
src/components/school-dashboard/exams/
├── content.tsx                  # Main exam dashboard (server component)
├── teacher-content.tsx          # Teacher-specific dashboard
├── error-boundary.tsx           # Error handling
├── overview-filters.tsx         # Dashboard filters
├── manage/                      # Exam lifecycle management (21 files)
├── qbank/                       # Question bank repository (16 files)
├── generate/                    # Template-based exam generation (15 files)
├── mark/                        # Automated marking system (17 files)
├── results/                     # Results and PDF generation (19 files)
├── paper/                       # Exam paper composition and templates
├── wizard/                      # Template wizard with 14 step modules
├── grading/                     # Grade conversion and CGPA calculator
├── progress/                    # Exam schedule tracking
└── mock/                        # Mock exam content
```

### Sub-Blocks

| Sub-Block                        | Files | Description                                                            |
| -------------------------------- | ----- | ---------------------------------------------------------------------- |
| [manage](./manage/README.md)     | 21    | Exam CRUD, scheduling, marks entry, calendar, analytics dashboard      |
| [qbank](./qbank/README.md)       | 16    | Question repository, AI generation, Bloom's taxonomy, practice mode    |
| [generate](./generate/README.md) | 15    | Template management, distribution rules, question selection algorithms |
| [mark](./mark/README.md)         | 17    | Auto-grading, AI-assisted essay grading, OCR, rubric-based marking     |
| [results](./results/README.md)   | 19    | Grade calculation, rankings, PDF reports (3 templates), CSV export     |

### Status

**Completion:** ~75% | **Authoritative status:** see [`PRODUCTION-AUDIT.md`](./PRODUCTION-AUDIT.md)

All 5 sub-blocks have complete component code, server actions, validation schemas, types, and configuration, and **all routes are wired** (the earlier "routes not created" blocker is resolved — 100+ `page.tsx` files exist under `src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/` and `(exam-wizard)/`). Remaining production blockers are tracked in `PRODUCTION-AUDIT.md` and are predominantly **schema-level** (bilingual-field removal, `Cascade`→`Restrict`, `Int`→`Decimal` marks, `lang` on 17 models, dual `Result`/`ExamResult` models) requiring a Prisma migration + Neon branch. The code-only hardening pass (2026-05-30) landed: RBAC matrix tests, submit-flow ID-resolution test, CSV/formula-injection escaping, lang-aware exam notifications, and a full green unit suite (211 tests).

### Integration Points

- **Classes**: Exams assigned to classes for student roster
- **Subjects**: Questions and exams organized by subject
- **Timetable**: Conflict detection with scheduled classes
- **Students**: Results linked to student profiles
- **Grades**: Exam results feed into gradebook (planned)
- **Notifications**: Exam reminders for students (planned)
