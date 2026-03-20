## Results -- Comprehensive Results and Analytics

### Overview

The Results sub-block handles the final stage of the exam lifecycle: calculating grades, generating analytics, computing rankings, and creating customizable PDF report cards. Supports three PDF templates (classic, modern, minimal), batch generation, and CSV export with full Arabic RTL support.

### Capabilities by Role

- **Admin**: View all results, generate PDF reports, export data, view analytics
- **Teacher**: View results for own classes, generate reports, view class analytics
- **Student**: View own results (limited scope)
- **Guardian**: View children's results (limited scope)

### Routes

| Route                                                              | Page                | Status    |
| ------------------------------------------------------------------ | ------------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results`           | Results list        | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/[examId]`  | Exam results detail | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/results/analytics` | Analytics dashboard | Not wired |

### File Structure

```
results/
├── content.tsx              # Server component - results list
├── detail.tsx               # Exam results detail view
├── analytics.tsx            # Analytics page
├── analytics-charts.tsx     # Chart components
├── batch-pdf-generator.tsx  # Batch PDF generation UI
├── cache-manager.ts         # LRU cache for performance
├── actions.ts               # Server actions (results, PDF, analytics)
├── actions/
│   ├── batch-pdf.ts         # Batch PDF generation logic
│   └── csv-import-export.ts # CSV operations
├── validation.ts            # Zod schemas
├── types.ts                 # TypeScript types
├── config.ts                # PDF settings, grade boundaries
├── utils.ts                 # Helper functions
└── lib/
    ├── calculator.ts        # Grade calculation (20+ functions)
    ├── pdf-generator.ts     # PDF generation core
    └── templates/
        ├── index.tsx        # Template registry
        ├── classic.tsx      # Formal template
        ├── modern.tsx       # Visual template with charts
        └── minimal.tsx      # Clean text-based template
```

### Status

**Completion:** 70% | **Blockers:** Route pages not created

19 files with grade calculation, rankings, 3 PDF templates, batch generation, CSV export, analytics charts, and caching. Missing route pages.

### Integration Points

- **Manage**: "View Results" button for completed exams
- **Mark**: Receives marks from grading system
- **Grades**: Results should sync to gradebook module (not yet implemented)
