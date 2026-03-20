## Import — CSV Bulk Data Operations

### Overview

Admin tool for bulk importing students, teachers, and other entities via CSV files. Includes template downloads, comprehensive field-level validation with helpful error messages, duplicate detection, and a reusable CSV export utility library. Enhanced error reporting shows exact row numbers, field names, and suggestions for fixes.

### File Structure

```
src/components/school-dashboard/import/
├── csv-import.tsx                  # Main import UI with file upload and error display
├── README.md
└── ISSUE.md
```

Supporting libraries:

- `src/lib/csv-validation-helpers.ts` -- Validation helper functions
- `src/lib/csv-import.ts` -- Import service with field-level validation

### Status

**Completion:** 80% | **Blockers:** None

CSV import for students and teachers works with enhanced validation. CSV export implemented for students, teachers, classes, assignments, exams, and attendance. Bulk update for existing records still in progress.

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/import/`
- **Students**: Bulk student creation with class enrollment
- **Teachers**: Bulk teacher creation with department assignment
- **Validation**: Zod schemas with date, phone, email, and guardian completeness checks
- **Export**: Reusable CSV export utility in `src/lib/`
