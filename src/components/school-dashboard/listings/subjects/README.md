## Subjects — Subject Catalog Management

### Overview

The Subjects block manages the school's academic subject catalog. Admins can create subjects, assign them to departments, and browse the catalog by education level (elementary, middle, high). Includes a detail view with chapters and materials, a contribution system, and a catalog browsing experience with hero sections and topic cards.

### Capabilities by Role

- **Admin**: CRUD subjects, assign to departments, manage catalog, configure prerequisites; **customize the platform catalog per school** via the `catalog/` controls — hide chapters / lessons / a specific instructor's video, hide a lesson's practice quiz, set the preferred instructor source, and contribute the school's own lesson videos
- **Teacher**: View assigned subjects (filtered by teacher classes, co-teaching, timetable, and expertise), contribute materials and assignments
- **Student**: View their own grade's subjects only. The academic grade is the gate: the grade's active `SubjectSelection` rows always show, and a class enrollment or section timetable slot is added only when the catalog places that subject in the student's grade. A student is always scoped to their own record — `?studentId` is ignored for the `STUDENT` role
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

> Enforced in `src/components/lumos/data/catalog/*` (`get-course`,
> `get-course-sidebar-data`, `get-lesson-with-progress`, `get-lesson-content`).

### Textbook reader (`textbook/`)

`/{lang}/subjects/{slug}/textbook` opens the subject's textbook as a book, one
screen per page, in the reading pattern of the iOS Books app (the textbook tile
in `catalog-content-sections.tsx` links here). Screen one is the cover (hero
tinted from the cover image, 3D frame, title, edition, page/unit/lesson counts,
Contents and Start-reading pills, an About-the-book sheet), screen two the
contents table with the book's printed page numbers, then the text.

Data, all from the CDN beside `Subject.pdf`: the Markdown twin
(`…/textbook.md`, kun `textbook` skill), the optional authoring
`…/structure.json` (chapter and lesson start pages — published for
`sd-g12-physics` and `sd-g12-biology` so far; it may state `pageOffset`,
printed → PDF, when the scan's folios are unreadable; without it the contents
are anchored by name matching) and `…/pages/<N>.webp` for the original-pages
view.

- `parse.ts` — twin → page/block tree; reads the printed folio off each page
  and `detectPageOffset` votes the PDF→printed offset (physics: 8);
  Arabic-folded search normalisation; `anchorToc` name matching.
- `spine.ts` — pure: `normalizeStructure`, `resolvePageOffset` (the
  author's `pageOffset`, else the folios' vote, else `inferPageOffset` — the
  structure's own headings found in the page text, contents pages abstain;
  biology's folios are OCR debris, its headings vote 8), `resolveToc`
  (structure pages through the offset, clamped, never backwards — two short
  chapters may share a page — anchors as fallback), `groupSections` (front
  matter + one flow per chapter, or fixed chunks; `isNoisePage` drops
  digit-soup pages from the front matter), `isCoverPage` (a scan's first
  page is its cover: the cover screen shows it, the text does not).
- `article.tsx` — server: one `.book-flow` per section, `<section id="p-N">`
  per page, chapter/lesson openers (kicker, title, ornament), folio marks.
- `engine.ts` — client, no React: each flow is a CSS multi-column box whose
  column equals the viewport, so the browser's columns are the pages. Measures
  `flow.scrollWidth` (translation-invariant), maps page markers and elements
  to columns by rect deltas (RTL-aware, fragment ranges via
  `getClientRects`), keeps an anchor (page + block) across relayouts and
  exposes an external store the shell subscribes to.
- `book.tsx` — client shell: cover + contents screens, the server flows
  wrapped in sliding tracks, chrome (running head, round close, `N of T`
  counter, round menu button), tap zones (edges turn, centre toggles the
  chrome), swipe and keys mirrored by book direction, position memory,
  bookmarks, search, the original-pages layer.
- `sheets.tsx` — reading menu (Contents — %, Search Book, Themes & Settings,
  share / PDF / original pages / bookmark) and the bottom sheets (vaul Drawer).
- `cover.tsx`, `toc.tsx`, `ornament.tsx`, `prefs.ts`, `search.ts`,
  `format.ts`, `types.ts`, `structure.ts`, `reader.css` (themes
  original/paper/quiet/night, Thmanyah or Rubik, six sizes, three leadings).
- `hero-gate.tsx` — the `[slug]` layout wraps every sub-route in the catalog
  hero; this client gate drops it on `…/textbook`.

Gotchas: the reader root must stay below the app's dialog layer (`z-index:
45`; drawers are 50) or the sheets render underneath yet still take clicks;
never put `data-chrome` on the root — the stage click handler ignores anything
inside `[data-chrome]`; measure the flow, not its wrapper (a translated wrapper
inflates `scrollWidth` in LTR); the page at the top of a screen is the earliest
page with a fragment in that column, not the last marker before it. Tests:
`src/tests/school-dashboard/listings/subjects/textbook-parse.test.ts`.

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

### Reused by the public Community hub

`catalog-hero.tsx`, `catalog-content-sections.tsx`, `catalog-detail.tsx`,
`catalog-chapters.tsx`, and `catalog-materials.tsx` are rendered **verbatim** by
the anonymous `/[lang]/community` surface (`src/components/saas-marketing/community`).
They are `"use client"` components, so any path customization must use
**plain-string** props — never functions (a function prop can't cross the RSC
server→client boundary and silently fails to render). The deep-link props default
to the school-dashboard paths and are overridden by the community surface to public
`/community/[slug]/...` paths:

- `CatalogHero` → `gradeBasePath` (default `/${lang}/subjects`)
- `CatalogContentSections` → `materialsHref`, `qbankHref`, `examsHref` (`""` hides the
  "see all" link), `videosHref`, `videoTileBasePath` (`""` → tiles fall back to `videosHref`)

When adding a new deep link to any of these shared components, give it a prop with
a school default — don't hardcode a `/subjects//exams//lumos/` path. See
`saas-marketing/community/CLAUDE.md`.

### Integration Points

- **Classes**: Subjects linked to classes
- **Teachers**: Teacher subject specialization
- **Departments**: Subject-department relationship
- **Grades**: Subject-wise performance tracking
- **Curriculum**: Chapter and materials management
- **Community hub**: catalog components reused on the public anonymous surface (see above)
