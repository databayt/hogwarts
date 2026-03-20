## Question Bank -- Question Repository Management

### Overview

The Question Bank sub-block provides a centralized repository for exam questions with rich metadata, multiple question types, Bloom's taxonomy classification, AI-powered question generation, and practice mode for students. Serves as the foundation for exam generation.

### Capabilities by Role

- **Admin**: Full CRUD on all questions, AI generation, bulk import/export, analytics
- **Teacher**: Create/edit questions for assigned subjects, AI generation, practice session management

### Routes

| Route                                                              | Page            | Status    |
| ------------------------------------------------------------------ | --------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank`             | Question list   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank/new`         | Create question | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank/[id]`        | Question detail | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank/practice`    | Practice mode   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/qbank/ai-generate` | AI generation   | Not wired |

### File Structure

```
qbank/
├── content.tsx              # Server component - question list
├── table.tsx                # Client component - data table
├── columns.tsx              # Table column definitions
├── form.tsx                 # Question creation/edit form
├── tabbed-layout.tsx        # Tabbed view layout
├── catalog-tab.tsx          # Catalog browsing tab
├── ai-generate-content.tsx  # AI generation interface
├── practice-content.tsx     # Practice mode content
├── practice-session.tsx     # Practice session component
├── practice-actions.ts      # Practice server actions
├── actions.ts               # Server actions (CRUD, AI, search)
├── validation.ts            # Zod schemas
├── validation-standards.ts  # Standards validation
├── types.ts                 # TypeScript types (347 lines)
├── config.ts                # Configuration (question types, Bloom's, difficulty)
└── list-params.ts           # URL state management
```

### Status

**Completion:** 70% | **Blockers:** Route pages not created

16 files with complete CRUD, AI generation, practice mode, and catalog features. Missing route pages.

### Integration Points

- **Generate**: Question selection algorithms query the bank
- **Mark**: Auto-grading uses question answers and rubrics
- **Results**: Question-wise performance analysis
