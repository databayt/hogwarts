## Mark -- Automated Marking System

### Overview

The Mark sub-block provides automated and AI-assisted grading for exam submissions. Supports auto-grading for objective questions (MCQ, True/False, Fill-in-Blank), AI-powered grading for essays and short answers, rubric-based evaluation, manual grading with override support, and bulk operations.

### Capabilities by Role

- **Admin**: Grade any exam, override grades, view marking analytics, bulk operations
- **Teacher**: Grade exams for assigned classes, use AI-assisted grading, manual override with audit trail

### Routes

| Route                                                            | Page                | Status    |
| ---------------------------------------------------------------- | ------------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark`            | Marking dashboard   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/mark/grade/[id]` | Grade specific exam | Not wired |

### File Structure

```
mark/
├── content.tsx              # Server component - marking dashboard
├── table.tsx                # Client component - data table
├── columns.tsx              # Table column definitions
├── form.tsx                 # Multi-step question/marking form
├── card.tsx                 # Question card component
├── detail.tsx               # Question detail view
├── all.tsx                  # All questions with filtering
├── featured.tsx             # Featured questions display
├── mobile-grading.tsx       # Mobile-optimized grading
├── answer-key.tsx           # Answer key management
├── csv-import-dialog.tsx    # CSV import for marks
├── bulk-auto-grade-dialog.tsx # Bulk auto-grading
├── actions.ts               # Server actions (grading, CRUD, OCR)
├── validation.ts            # Zod schemas
├── types.ts                 # TypeScript types
├── config.ts                # Confidence thresholds, question types
└── utils.ts                 # Grading logic, score calculation
```

### Status

**Completion:** 65% | **Blockers:** Route pages not created, OpenAI API key required for AI grading

17 files with auto-grading, AI-assisted grading, mobile view, CSV import, and bulk operations. Missing route pages. AI features require OPENAI_API_KEY environment variable.

### Integration Points

- **Question Bank**: Reads questions and rubrics for grading reference
- **Results**: Marking results feed into grade calculation and PDF generation
- **Manage**: "Enter Marks" action in exam list links to marking interface
