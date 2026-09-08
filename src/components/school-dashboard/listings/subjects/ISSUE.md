# Subjects — Production Readiness Tracker

**Status:** 🟢 READY
**Completion:** 90%
**Last Updated:** 2026-06-14

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Subject catalog management
- [x] Browse by education level (elementary, middle, high)
- [x] Subject detail with chapters and materials
- [x] Search and filtering
- [x] Class and teacher assignment
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Catalog browsing experience (hero, grid, cards)
- [x] Contribution system (materials, assignments)
- [x] RBAC authorization checks

## Known Issues

### P2 — Medium

- [ ] Prerequisites tracking not yet implemented
- [ ] Curriculum standards mapping not yet implemented
- [ ] Learning outcomes not yet defined per subject

## Enhancements (Post-MVP)

- [ ] Prerequisites tracking between subjects
- [ ] Curriculum standards alignment
- [ ] Learning outcomes per subject
- [ ] Subject grouping (electives, core, etc.)
- [ ] Grade-level subject configuration
- [ ] Subject-wise performance analytics
- [ ] Bulk "hide all videos from instructor X" (today the instructor preference
      only re-sorts; per-video hide is manual via the catalog controls)

## Resolved

- **2026-09-07 — Biology has its designed cover.** `curriculum/sd/g12/biology/cover.svg`
  (a Figma export: blue line-art of corals, algae and diatoms across the lower
  half of a white board, 2669×3691, one embedded 1000 px raster, no text)
  is rasterised to `cover.jpg` at 1000×1383, q82 4:4:4, 251 KB, and published
  to `catalog/textbooks/sd-g12-biology/cover.jpg` in both buckets. The
  aggregator's scan it replaces is kept at
  `curriculum/sd/g12/biology/_old/2026-09-07-aggregator-cover/cover.jpg` and
  is still on the CDN as `pages/1.webp`. The hero tint the cover screen
  samples now reads `hsl(225 30% 30%)`, a navy drawn from the line art.
  **Gotcha:** textbook art is served `max-age=31536000, immutable`, so
  overwriting a key is not enough — the edge keeps the old bytes until a
  CloudFront invalidation on distribution `E3PHDXTDSBCQSJ` (alias
  `cdn.databayt.org`); browsers that already hold the old cover keep it until
  the year expires. No code changed: the reader reads `Subject.cover`, and
  the seed resolves that from the local `cover.jpg`, so the new art survives
  the next `pnpm db:seed:single sd`. Open: the design leaves the top half of
  the board empty, and our title is set below the book rather than on it.

- **2026-09-08 — The reader opens on the cover, full screen.** The first
  screen was a small 3D book on a tinted hero; it is now the cover itself at
  the size of the page — `object-fit: cover` in portrait, `contain` once the
  screen is wider than 5/7 so the board is never cropped, the sampled tint
  carrying the margins. A drawn cover leaves its head free, so that is where
  the book's own titling goes: stage, subject, grade, centred in the upper
  half over a white veil, with the counts beneath (`stageElementary`,
  `stageMiddle`, `stageHigh` are new keys; the stage comes from
  `Subject.levels[0]`, not from a guess at the grade number). The app's own
  affordances — Contents, Start reading, About — sit in a slim foot. On a
  subject that still shows the aggregator's scan the veil mutes the scan's
  printed titling behind ours rather than hiding it; that doubling ends when
  the subject gets a drawn cover.
- **2026-09-08 — The subject page wears the same design.**
  `/subjects/sd-g12-biology` drew its hero from `banner.jpg`, a ClickView
  triptych, while the drawn cover appeared only in the textbook card far
  below. The 1000×1000 artwork is now taken straight out of the cover SVG's
  embedded raster (no re-render), upscaled to 2048 and cropped to the densest
  2048×378 band — picked by scanning ink coverage — then published as
  `banner.jpg` to both buckets and invalidated. The hero's own scrim
  (`from-black/75`) keeps the white title readable over the light ground, and
  `catalog-hero.tsx` mirrors the art in Arabic, which an abstract pattern
  takes without complaint. Left alone deliberately: `thumbnail.jpg`, the
  square subject tile, is still the ClickView art authored for all 25
  grade-12 subjects in the 2026-09-05 pass — replacing it would change browse
  pages nobody asked about.

- **2026-09-07 — Footer menu measured against the reference crop.** With
  ours rendered at the same 390×844 and cropped to the same rectangle as
  `IMG_2579`, three things were wrong and are now fixed. The round row is
  four capsules that fill the column (64×47 pt, 5 pt gaps), not spread
  circles — an earlier pixel-threshold reading had been polluted by the page
  text behind the glass. The pill charcoal is #36363a and the grey #e6e6e9,
  read off the crop; gaps are 5 pt and pill icons 22 pt, round-row icons
  24 pt. And the scrim does not whiten the page — it _dissolves_ it: a 24 px
  backdrop blur veiled 35% toward the paper, masked to fade in above the
  first pill. Proof it renders: the page-text band's standard deviation
  falls from 63.6 with the menu closed to 2.6 with it open. **Gotcha:**
  writing `backdrop-filter` and `-webkit-backdrop-filter` together makes
  Lightning CSS emit only the prefixed one, and Chromium then reports
  `backdropFilter: none` — the blur silently never applied. Declare the
  unprefixed property alone and let the transformer prefix it.
- **2026-09-07 — Footer menu mirrored to the reference, point for point.**
  Measured from the 12 Books screenshots (iPhone, 390×844 pt): the ✕ and the
  menu button are 46 pt circles inset 35 pt from the end edge, the running
  head and the `N of T` counter (15 pt, system font) sit centred on those two
  lines; the open menu is a 274 pt column at the end side (16 pt inset) of
  45 pt pills 7 pt apart (17 pt system font, text 17 pt from the start edge,
  20 pt icons 20 pt from the end), then four 43 pt circles spread across the
  column with 12 pt insets, ending 34 pt above the counter, which stays in
  view over the scrim (page fades to the paper colour under a 10 px blur).
  The `AA` glyph is a small A beside a large one. The search sheet is bare:
  title, blank body, a 47 pt field with its round ✕ at the bottom, no header
  ✕ and no drag handle, 94 svh tall. Kept deliberately: PDF and original
  pages in the round row where the reference has rotation lock and vertical
  scroll (neither exists on the web yet). Gotcha: the sheets portal to
  `<body>`, outside `.book`, so reader variables do not reach them —
  `--book-ui` lives on `:root` for that reason, while the contents sheet's
  `var(--book-font)` still resolves to the page default rather than the
  reader's font preference (open).
- **2026-09-07 — Biology is the second book.**
  `/subjects/sd-g12-biology/textbook`: the twin keeps only 19 readable folios
  of 253 (OCR debris), so the printed→PDF offset now comes from the first
  source that has one — the author's `pageOffset` in `structure.json`, the
  folios' vote, or a vote from the structure's own chapter/lesson headings
  found in the page text (a page matching many headings is a contents page
  and abstains; the winner needs a 2:1 majority). Biology's `structure.json`
  is published to both buckets with `pageOffset: 8`, and chapter 2 corrected
  to printed 25 — the book's own contents table says 9, but printed 9 is
  still asexual reproduction and the heading sits on 25. The scanned cover's
  OCR (the aggregator's banner) no longer opens the front matter: the cover
  screen shows that page. A chapter that opens on its predecessor's page
  keeps its contents link (genetic engineering and genetic counselling share
  printed 199; one flow, two rows). Verified headless at 390×844: 303
  screens, 24 sections, 73 of 73 contents rows live with printed numbers,
  chapters open on PDF 9 / 33 / 140 (printed 1 / 25 / 132), no console
  errors; 29 parser/spine tests, tsc and eslint green. Follow-ups: the OCR is noisy («الشكاخر»
  for «التكاثر», Latin headings as digit soup) — a kun `textbook` re-OCR
  job, not the reader's; the catalog's 22 biology chapters are the book's
  sections (the book has three units), so the opener kicker «الوحدة N»
  counts sections.
- **2026-09-07 — Textbook reader rebuilt as a book (iOS Books pattern),
  physics first.** `/subjects/sd-g12-physics/textbook` now opens on the cover
  (tinted hero, 3D frame, title/edition/counts, Contents + Start reading, About
  sheet), then a designed contents page carrying the printed page numbers, then
  the text one screen per page: CSS multi-column flows per chapter, slide
  transition, edge taps / swipes / arrow keys (mirrored for RTL), a running
  head, round close, `N of T` counter (the number alone when the chrome is
  hidden) and the round menu → Contents — %, Search Book, Themes & Settings,
  share / PDF / original pages / bookmark. Printed page numbers come from the
  folios OCR left on the pages (`detectPageOffset`, physics: PDF − 8);
  chapter/lesson pages from `structure.json`, published on the CDN for physics
  only. Verified headless in Chromium at 390×844 and 1440×900: 282 / 165
  screens, chapter 1 opens on printed page 2, taps and keys advance, search
  hits land in view, original pages load, themes apply; tsc, eslint and the
  parser/spine tests are green. Follow-ups: publish `structure.json` for the
  other g12 subjects (name anchoring can land on the printed contents page);
  the physics cover on the CDN is the aggregator's scan — swap in a designed
  cover; the opener kicker says «الوحدة N» while the book says «الباب» — read
  the book's own term from the structure; text-layer twins (no markers) get
  fixed 10-page chunks and no original-pages view; a hydration warning on the
  route comes from the dashboard header's spotlight button, not the reader;
  no e2e spec yet; curl / vertical-scrolling modes are not built.

- **2026-09-06 — Textbook reader.** The textbook tile no longer opens the raw
  PDF; it opens `/subjects/[slug]/textbook`, a native-text reader of the book's
  Markdown twin (Thmanyah serif, six text sizes, Arabic-folded search, contents
  anchored to pages, optional original-page images, PDF one click away).
  Verified with an authenticated fetch of `sd-g12-biology`: 253 page sections,
  Arabic toolbar, hero hidden, 56/73 TOC entries anchored; a bogus slug 404s.
  Not visually checked in a browser this session (the browser MCPs failed to
  connect) — tsc, eslint and 11 parser tests are the evidence.
  Follow-ups (P3): page markers for the text-layer twins (kun `textbook`
  skill), `structure.json` beside the twin on the CDN for exact chapter
  pages, inline figure extraction, an e2e spec for the route.

- **2026-09-04 (c) — The stale class rows are repaired, and the demo student is
  in grade 12.** `prisma/seeds/repair-class-curriculum.ts` rebuilds a school's
  classes against its active `SubjectSelection` rows, which are the authority on
  which (grade, subject) pairs should exist. It repoints a wrong class when the
  grade's curriculum wants a subject of the same name, so its enrollments,
  attendance and results survive; deletes what is still unmatched; and collapses
  duplicates of a pair onto the row carrying the most history. Demo went 504
  classes (36 correct, 396 grade-mismatched, 72 with no grade) to 123, one per
  curriculum pair, with 83 repointed and 385 deleted. Re-running the `classes`,
  `attendance`, `assignments`, `exams` and `grades` seeds restored the demo:
  8,538 enrollments, 52,560 attendance rows, 9,873 results, 702 assignments,
  401 exams.
  `prisma/seeds/move-student-grade.ts` moves one student between grades —
  academic grade, section, stream and enrollments together, then drops the
  coursework anchored to classes they left. `student@balqalam.com` is now in
  الصف الثاني عشر section ب and sees 18 grade-12 subjects.
  Both scripts are dry-run by default; pass `--apply`.
  **Also RUN AGAINST PRODUCTION (Neon account #1 `ep-little-credit`) on
  2026-09-04, scoped to the demo school.** Prod demo went 448 classes to 240,
  one per curriculum pair, with 208 repointed and 208 deleted; no attendance or
  results hung off the deleted rows, so the losses were 13,845 enrollments,
  1,039 assignments and 140 exams. No re-seed was needed there — the repair left
  no curriculum pair without a class. The student is in الصف الثاني عشر section
  B with 23 grade-12 subjects. The other prod tenants (qdwa, albayan,
  kingfahad, alqabas) were NOT touched.
  **The Neon branch-before-touch step could not run: the project is at its
  10-branch limit and the spare slots are old archived backups that are not
  mine to delete. A `pg_dump` of the affected tables was taken instead.**
  **The read-path fix is still NOT deployed.** Prod results are correct because
  the data is now correct, but the `?studentId` bypass and the
  "student with no Student row sees everything" gap persist in the running build
  until this branch ships. `/subjects` also still returns `/unauthorized` for a
  student on prod, since the sidebar/authorization half of pass (a) is
  uncommitted.
  **SEED BUG, still open:** `seedClasses` names a class `<subject.name> - <level
name>` while older rows were named from the selection's `customName`, so its
  `schoolId_name` upsert misses them and adds a second class for the same
  (grade, subject) — 15 duplicates appeared on the re-seed. The repair script's
  dedupe pass clears them, but the seed should key on the pair instead. That
  needs a `@@unique([schoolId, gradeId, subjectId])` on `Class`.

- **2026-09-04 (b) — A student now sees only their own grade's subjects.**
  The first pass treated the student's grade as a fallback, so class
  enrollments decided the list. Demo class rows for grade 10 point at grade
  4/5/8/9/11/12 catalog subjects (legacy rows, created before class seeding was
  curriculum-gated), and the student is enrolled in all of them — so the page
  showed 36 subjects spanning every level. `getSubjectIdsForStudent` now makes
  the grade the gate: the grade's active `SubjectSelection` rows always count,
  and a class/timetable attachment is kept only when `Subject.grades` includes
  the student's `AcademicGrade.gradeNumber` (a subject that declares no grades
  stays in). `SubjectsContent` and `getSubjects` also stop honouring
  `?studentId` / `?teacherId` for `STUDENT` and `TEACHER` — they always resolve
  to the caller's own record — and a `STUDENT` with no `Student` row now sees
  nothing instead of the whole catalog. Demo student drops 36 → 17, all grade
  10; `/subjects/elementary` is empty for them.
  **NOT FIXED:** the stale `Class.subjectId` rows themselves. The seed's
  `upsert` update branch omits `subjectId` and non-curriculum pairs are
  skipped, so a re-seed will not repair them — they need explicit cleanup.

- **2026-09-04 (a) — Student & Teacher Subject Scoping and Sidebar Access.**
  Enabled the `subjects` navigation entry for `STUDENT` in `platform-sidebar/config.ts`
  and command menu. Filtered the browse view (`SubjectsContent`), table query (`getSubjects`),
  and `getSubjectList` by student ID (resolving `StudentClass`, section timetable slots,
  and grade fallbacks) and teacher ID (resolving primary `Class`, co-teaching `ClassTeacher`,
  `Timetable` slots, and `TeacherSubjectExpertise`). Cleaned up browse layout tab navigation
  strip so single-view roles (students) do not render stray tab rules or admin-only catalog tabs.

- **2026-07-16 — Hid the "Customize Content" panel + i18n gaps on the subject
  detail page.** `subjects/[slug]/page.tsx` no longer renders
  `SchoolCatalogCustomization` (the admin hide/show + contribute collapsible);
  the component + its actions (`topic-overrides`, `ContentOverride`,
  `setLessonQuizHidden`) are retained, just not surfaced here. Removed the
  now-dead admin-only `db.video.findMany` + `videosByLesson`/`quizHiddenLessonIds`
  machinery it fed. i18n: `catalog-content-sections.tsx` count units
  (`test/tests`, `exam/exams`, `item/items`, `pg avg`) and the `Diagnostic`
  exam-type now read dictionary keys — added `unitExam/unitExams/unitTest/
unitTests/unitItem/unitItems/pagesAvg` + `examTypes.diagnostic` to both
  `school-en.json` and `school-ar.json` (parity test green). tsc 0 errors.
  **NOTE:** the panel was removed for ALL subject detail pages (route is generic
  `[slug]`), not just `sd-g1-math`.
- **PENDING (blocked on DB) — `sd-g1-math` still shows leftover Grade-7 chapters
  on the live demo.** The corrected Grade-1 structure (Numbers 0-9, Add/Sub
  within 9, Numbers 10-99, Measurement — 5ch/47le) is staged in the working tree
  (`curriculum/sd/g1/`, `prisma/seeds/catalog/sd-content.ts`). Apply with
  `pnpm db:seed:single sd` (fixes chapters + rotating concept thumbnails) then
  `pnpm db:seed:single sd-content` (qbank + exams) — but these must run against
  the live demo DB (Neon **account#2** `ep-muddy-mountain`, separate login). The
  local `.env` points at the quota-frozen account#1 DB (`ep-little-credit`,
  unreachable), so the seed can't run from the dev environment as-is.
- **2026-06-14 — School catalog customization controls** (part of the
  LMS/Stream flow pass, tracked under #323): wired the previously-dead per-video
  / per-instructor hide toggle (the page now fetches each lesson's videos +
  override state); added a per-lesson **quiz hide** control
  (`ContentOverride.hideQuiz` + `setLessonQuizHidden`, enforced in stream's
  `getLessonContent`); `toggleContentOverride` now preserves the override row
  while a quiz override remains. tsc clean, 54 catalog + 259 stream tests green.
  Schema (`ContentOverride.hideQuiz`) is deploy-pending (`prisma db push`).

---

**Last Review:** 2026-06-14
