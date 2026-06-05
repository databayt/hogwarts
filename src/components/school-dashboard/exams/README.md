---
epic: 03
sprint: Q3-2026
title: Exams
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 65
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-05-25
---

## Exams -- Examination Management System

### Overview

The Exams block provides a comprehensive examination platform covering the full lifecycle from question authoring through exam generation, administration, automated marking, and results analytics. Organized into 5 core sub-blocks plus additional modules (paper, wizard, grading, progress, mock). Components are fully built but routes are not yet wired.

### Capabilities by Role

- **Admin**: Full CRUD on exams, question bank, templates, results; configure grade boundaries; generate PDF reports; view analytics
- **Teacher**: Create and manage exams for assigned subjects, enter marks, grade submissions, generate reports, use question bank
- **Accountant**: Read-only access to results and analytics, export reports
- **Student**: View own results (limited scope)
- **Guardian**: View children's results (limited scope)

### Routes

| Route                                                               | Page              | Status    |
| ------------------------------------------------------------------- | ----------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams`                    | Exam Dashboard    | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage`             | Exam Management   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/manage/[id]`        | Exam Detail       | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank`              | Question Bank     | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate`           | Auto-Generate     | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/templates` | Exam Templates    | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark`               | Auto-Mark         | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark/grade/[id]`    | Grade Exam        | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results`            | Results Dashboard | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/[examId]`   | Exam Results      | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/analytics`  | Analytics         | Not wired |

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

**Completion:** 65% | **Blockers:** Route pages not created in app directory

All 5 sub-blocks have complete component code, server actions, validation schemas, types, and configuration. The main gap is that no `page.tsx` files exist under `src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/` to wire the components to routes.

### Integration Points

- **Classes**: Exams assigned to classes for student roster
- **Subjects**: Questions and exams organized by subject
- **Timetable**: Conflict detection with scheduled classes
- **Students**: Results linked to student profiles
- **Grades**: Exam results feed into gradebook (planned)
- **Notifications**: Exam reminders for students (planned)

### Agents & Skills

- `agent:prisma` — exams schema + Student.id correctness
- `agent:test` — RBAC + grade-calculator coverage
- `agent:guardian` — rate-limiter + security audit
- `skill:/test` — generate + run test suites
- `skill:/security` — OWASP sweep
