## Subjects — Subject Catalog Management

### Overview

The Subjects block manages the school's academic subject catalog. Admins can create subjects, assign them to departments, and browse the catalog by education level (elementary, middle, high). Includes a detail view with chapters and materials, a contribution system, and a catalog browsing experience with hero sections and topic cards.

### Capabilities by Role

- **Admin**: CRUD subjects, assign to departments, manage catalog, configure prerequisites; **customize the platform catalog per school** via the `catalog/` controls — hide chapters / lessons / a specific instructor's video, hide a lesson's practice quiz, set the preferred instructor source, and contribute the school's own lesson videos
- **Teacher**: View assigned subjects, contribute materials and assignments
- **Student**: Browse subject catalog, view subject details and materials
- **Guardian**: View subject information for child's classes

### School Catalog Customization (`catalog/`)

The subject detail page (`[slug]`) renders `SchoolCatalogCustomization` for
admins. It is the school-side control surface for the platform-global catalog and
the **stream (LMS)** block. All overrides are per-school `ContentOverride` rows
and are enforced in the stream read paths.

- `school-catalog-customization.tsx` — admin "Customize Content" panel wrapper
- `topic-overrides.tsx` — per chapter / lesson / **instructor video** hide
  toggles + a per-lesson **quiz** hide toggle + a contribute-video entry point
- `lesson-contributions.tsx` — dialog to contribute a school video to a lesson
- `actions.ts` — `toggleContentOverride` (chapter/lesson/video hide),
  `setLessonQuizHidden` (quiz hide via `ContentOverride.hideQuiz`),
  `setInstructorPreference` (preferred source per subject)

> Enforced in `src/components/stream/data/catalog/*` (`get-course`,
> `get-course-sidebar-data`, `get-lesson-with-progress`, `get-lesson-content`).
> Tracked under the LMS/Stream epic (#323).

### Routes

| Route                                                                                 | Page                   | Status |
| ------------------------------------------------------------------------------------- | ---------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/(browse)`               | Browse Subjects        | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/(browse)/elementary`    | Elementary             | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/(browse)/middle`        | Middle School          | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/(browse)/high`          | High School            | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/[slug]`                 | Subject Detail         | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/[slug]/chapters`        | Chapters               | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/[slug]/materials`       | Materials              | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/catalog`                | Catalog                | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/contribute`             | Contribute             | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/contribute/materials`   | Contribute Materials   | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/contribute/assignments` | Contribute Assignments | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/(listings)/subjects/contributions`          | View Contributions     | Ready  |

### File Structure

```
src/components/school-dashboard/listings/subjects/
  actions.ts                   # Server actions (CRUD, scoped by schoolId)
  authorization.ts             # RBAC permission checks
  catalog-chapters.tsx         # Chapter listing for catalog view
  catalog-content-sections.tsx # Content sections for catalog
  catalog-detail.tsx           # Catalog detail page
  catalog-hero.tsx             # Hero section for catalog
  catalog-materials.tsx        # Materials listing for catalog
  catalog-subjects-grid.tsx    # Subject grid for browsing
  columns.tsx                  # Table column definitions
  config.ts                    # Constants and configuration
  content.tsx                  # Server component (data fetching)
  detail.tsx                   # Subject detail view
  form.tsx                     # Subject create/edit form
  hero.tsx                     # Subject hero component
  image-map.ts                 # Subject image mappings
  information.tsx              # Form information step
  list-params.ts               # nuqs URL state
  queries.ts                   # Read-only database queries
  subject-card.tsx             # Subject card component
  table.tsx                    # Client DataTable
  topic-card.tsx               # Topic card component
  types.ts                     # Transport types
  validation.ts                # Zod schemas
  year-section.tsx             # Year-level section component
```

### Status

**Completion:** 90% | **Blockers:** None

### Integration Points

- **Classes**: Subjects linked to classes
- **Teachers**: Teacher subject specialization
- **Departments**: Subject-department relationship
- **Grades**: Subject-wise performance tracking
- **Curriculum**: Chapter and materials management
