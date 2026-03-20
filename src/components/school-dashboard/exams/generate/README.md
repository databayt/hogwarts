## Generate -- Template-Based Exam Generation

### Overview

The Generate sub-block automates exam creation using predefined templates, distribution rules, and intelligent question selection algorithms. Generates balanced exams that meet specific difficulty, Bloom's taxonomy, and question type requirements.

### Capabilities by Role

- **Admin**: Full CRUD on templates, generate exams for any class/subject
- **Teacher**: Create templates for assigned subjects, generate exams, preview before finalizing

### Routes

| Route                                                                    | Page                   | Status    |
| ------------------------------------------------------------------------ | ---------------------- | --------- |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate`                | Generation dashboard   | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/templates`      | Template list          | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/templates/new`  | Create template        | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/templates/[id]` | Template detail        | Not wired |
| `/{lang}/s/{subdomain}/(school-dashboard)/exams/generate/preview`        | Preview generated exam | Not wired |

### File Structure

```
generate/
├── content.tsx              # Server component - generation dashboard
├── templates-content.tsx    # Templates listing page
├── table.tsx                # Client component - data table
├── columns.tsx              # Table column definitions
├── form.tsx                 # Template creation form
├── distribution-editor.tsx  # Visual distribution configuration
├── catalog-tab.tsx          # Catalog browsing
├── version-library.tsx      # Template version management
├── contributions.tsx        # Contribution tracking
├── actions.ts               # Server actions (CRUD, generation)
├── validation.ts            # Zod schemas
├── types.ts                 # TypeScript types
├── config.ts                # Generation settings
├── utils.ts                 # Selection algorithms, bloom filtering
└── list-params.ts           # URL state management
```

### Status

**Completion:** 65% | **Blockers:** Route pages not created

15 files with template management, distribution editor, and question selection algorithms. Missing route pages.

### Integration Points

- **Question Bank**: Queries available questions for selection
- **Manage**: "Generate from Template" option links to manage block
