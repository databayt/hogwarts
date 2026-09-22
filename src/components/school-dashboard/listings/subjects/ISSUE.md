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

- **2026-09-22 — The textbook is served to the Android app, and figures render.**
  `textbook/load.ts` now owns the book assembly (Markdown + `structure.json` →
  meta, cover, contents, sections, openers); `content.tsx` renders from it and
  the new `GET /api/mobile/textbooks/[slug]?lang=` returns the same structure as
  JSON, so the native reader and the web cannot disagree about a page. Figure
  lines `![caption](pages/N.webp)` were printed as raw text on the web; `parse.ts`
  now emits an `image` block and `article.tsx` renders it (`.book-figure`,
  capped at one page). sd-g12-biology: 144 figures, 22 sections, 514 KB JSON.

- **2026-09-20 (b) — The concepts are one generic word each, and `nature` is a
  24th.** 15 slugs renamed (`earth-science`→`earth`, `languages`→`language`,
  `arts`→`art`, `biology`→`life`, `life-skills`→`skills`, `pe`→`sport`,
  `economics`→`economy`, `sociology`→`society`, `teacher-pd`→`teaching`,
  `career-tech`→`career`, `computer-science`→`computer`,
  `celebrations`→`celebration`, `psychology`→`mind`, `civics`→`civic`,
  `religion`→`faith`); `math`, `english`, `history`, `geography`, `health`,
  `physics`, `chemistry` and `science` keep their names. `science` and `nature`
  are deliberately **different ideas** — Abdout's call — so the rooted-tree
  artwork moved to the new `nature` concept and `science` went back to having no
  cover until it gets its own.

  **The trap, and it bit:** `conceptArchive()` falls back to the raw concept
  name when it is not in `CONCEPT_TO_ARCHIVE`, so a row left on an old slug does
  not error — it resolves to a clickview key that does not exist and renders a
  0×0 broken image. The concept slug is stored in **four** places and all of
  them must move together. The easy ones to miss are the child tables:
  `catalog_chapters.thumbnailKey` and `catalog_lessons.thumbnailKey` hold the
  legacy `catalog/concepts/g<N>-<concept>/thumbnail` shape too — 9,195 rows
  locally, which the first migration pass missed and a browser check caught as
  `clickview/high-languages-thumbnail.jpg` at 0×0. The migration is committed as
  `scripts/catalog/rename-concepts.sql` (idempotent, verified by a no-op
  re-run); **it MUST be run against prod at deploy time behind a Neon restore
  point**, because the code ships the new names while prod's rows are still on
  the old ones.

  Renaming is otherwise safe: `CONCEPT_TO_ARCHIVE` is an explicit slug→archive
  map, so the archive VALUES (and therefore every live clickview key) never
  moved. `nature` maps to `life-science`, with a `high` override to the
  pluralised `life-sciences` the high archive actually uses — all three levels
  verified 200. Its nearest-concept rule deliberately does **not** claim
  بيئة/environment, which stays with `earth`, so no existing subject silently
  changed concept.

  **A concept slug does not only appear as `concept: "x"`, and that is the
  second way this bites.** Searching for that one shape missed three more
  surfaces, all found only by grepping for slugs that can ONLY be concepts
  (`teacher-pd`, `career-tech`, `earth-science`, `life-skills`, `celebrations`):
  **53 `colorFor("…")` arguments** in the same six seed files whose `concept:`
  lines had already been renamed; `banners.ts`'s `OLD_SLUG_TO_CONCEPT` and
  `sd.ts`'s `LESSON_TYPE_CONCEPT`, where the concept is the **value** and the
  key is a subject slug or lesson type that must NOT move; and — invisible to
  any repo grep because `curriculum/` is gitignored — **231 authored `concept`
  values in 29 `structure.json` files**. Those last ones fail silently in the
  other direction: `sd.ts` validates them against `CONCEPTS` and drops an
  unknown one with a warning, so the hand-authored concept/image map from
  2026-09-05 would have degraded to pool rotation on the next seed. 18 of them
  are published, so they were re-uploaded to both buckets and invalidated.
  Deliberately NOT renamed: `image-map.ts`, `engine.ts`, `catalog-assignments.ts`'s
  `LAB_SUBJECTS` and `generate-us-curriculum-mdx.ts` key on **subject** slugs
  (`career-education`, `teacher-development`), not concepts.

  Scope: `concepts-data.ts` (registry, colours, rules, both subject maps, the
  pool), `clickview-key.ts` (map keys only), 71 `concept:` literals + 53
  `colorFor()` args + 25 map values across six curriculum seeds, `banners.ts`,
  `sd.ts` and `assemble-sudan-curriculum.ts`, one test, 231 structure.json
  values, and **11,544 DB rows** (6,444 in the first pass, 5,100 in the child
  tables the first pass missed). Verified by resolving all 504 concept keys in
  the database through the real resolver and curling every one of the 119
  distinct clickview targets — all 200 — re-loading the page that had been
  broken (63 images, none broken), and statically checking all 346 authored
  structure.json concepts against `CONCEPTS` (0 invalid; 24 concepts, every one
  with an archive mapping). `tsc` clean, 417 catalog tests pass. **Note:** nothing resolves to `nature` yet, so its
  cover is published but unused until a subject is assigned to it.
  Also fixed in passing: `assemble-sudan-curriculum.ts` set `concept: "arabic"`
  in six places, which was never a valid concept and fell through to
  `nearestConcept` — now `language`, the value that fallback produced anyway.

- **2026-09-20 — Nine designed covers, published as shared concepts rather than
  per subject.** A second Figma batch (`Frame 13–23`, same 2669×3691 board as
  biology's, textless artwork on the lower half) was mapped to nine of the 23
  concepts in `concepts-data.ts` instead of to nine subjects — Abdout's call, so
  one drawing serves every subject and every grade that resolves to the concept:
  `languages` (Arabic letterforms), `religion` (Islamic tilework), `english`
  (a grammar desk), `math` (a street grid dissolving into leaf veins),
  `geography` (a Nile-delta city map), `earth-science` (a canoe on woodcut
  water), `arts` (a geometric elephant), `computer-science` (a circuit board)
  and `science` (a rooted tree). Rasterised by the new
  `scripts/catalog/render-cover.mjs` — headless Chromium at 2x, sharp lanczos3
  to 1000×1383, JPEG q82 4:4:4 — which reproduces biology's hand-made cover to
  within 0.1 % (257,424 vs 257,085 B), so it is the committed version of the
  2026-09-07 recipe.

  Published two ways. **(a) The concept slot was empty.** 242 of 380 subjects
  carry `cover = catalog/concepts/<concept>/cover`, and that key resolved to
  nothing — not raw, not through `legacyConceptToClickview` (its regex only
  matches the older `g{grade}-{concept}/{thumbnail|banner}` shape), not as the
  `-{size}.webp` variant `image-url.ts` falls back to for a bare prefix. All
  three consumers of `Subject.cover` call `getCloudFrontUrl(key)` raw, so a
  JPEG at the extension-less key is what they fetch; nine such objects now put
  art on **113 subjects across every grade and curriculum** that previously
  rendered a flat colour. **(b) Grade 12** additionally got the matching
  `curriculum/sd/g12/<dir>/cover.jpg` for the 15 subjects whose concept is one
  of the nine, because a local file always beats the concept fallback in
  `sd.ts`'s `localArtKey` — without it g12 would not have changed. Each source
  export is kept beside it as `cover.svg` (`cover.png` for `religion`, which
  exported as PNG), and the outgoing cover archived to
  `_old/2026-09-20-pre-designed-cover/`.

  No code, schema or seed change: all 25 g12 rows already pointed at
  `catalog/sd/g12/<dir>/cover.jpg`, so this is a byte replacement under an
  existing key. Uploaded `--force` to `databayt-cdn` and `hogwarts-databayt`,
  then mirrored onto the legacy `catalog/textbooks/<slug>/` prefix with
  `aws s3 cp` (default `COPY` directive, which carries `image/jpeg` +
  `immutable` across) — production's DB still points there until the catalog
  pointer flip owed from the 09-19 deploy, and the mirror also makes the
  pending `migrate-catalog-keys.ts` copy a no-op instead of clobbering the new
  art with the old scan. All 30 g12 keys and all 9 concept keys verified by
  content-length after invalidating `E3PHDXTDSBCQSJ`.

  **Also open:** three sources are soft (`languages` 736×414, `science`
  626×468, `math` 597×900) and upscale 1.4–1.7×; `Frame 18` (node `652_41`) was
  never exported; ten g12 subjects still carry the aggregator's scan
  (agriculture, biology's own designed cover aside, chemistry, physics,
  engineering, commerce, military-sciences, family-sciences, history, PE).

- **2026-09-13 — The biology hero wears its own banner again.** The
  2026-09-08 entry below is reverted: the cover-art crop read as a textbook
  cover on the subject page. `banner.jpg` is back to the ClickView triptych
  (bee, DNA, pedigree chart; 120,272 bytes, MD5 `0bee18ff…`), restored from
  `databayt-cdn`'s own version history (id `oHoQo_at…`, 2026-09-05) to both
  buckets and invalidated. Verified by a real admin login on
  `demo.balqalam.com/ar/subjects/sd-g12-biology`. The local source
  `curriculum/sd/g12/biology/banner.jpg` was restored too, so
  `upload-textbooks-all.ts` cannot re-publish the crop; the crop is kept in
  `_old/2026-09-08-cover-crop/`. Banners come from ClickView art, not the
  cover. No DB or code change was needed.

- **2026-09-12 — The search sheet mirrors IMG_2580.** `sheets.tsx`
  (`book-sheet-search`) + `reader.css`: top radius 38, ground `#fefeff`
  (`#1c1c1e` dark), edge at 47 (`calc(100svh - 47px)`), title 37 under the
  edge, 48-pt glass capsules (fill `#fdfdfd`, 1-px rim, soft shadow) on
  12 / 13 / 17 insets, magnifier 16, placeholder 17 `#717171`, ✕ 17, and a
  mic only where the browser can dictate (Web Speech; new `dictate` label in
  both dictionaries). Re-measuring overturned blueprint §8 — the old
  `#efeff0` 319×49 field was the keyboard band. **NOT verified on a real
  iPhone with the keyboard up.** `scripts/books-mirror-capture.mjs` now takes
  `BOOKS_TIMEOUT` (ms) for a cold dev server.

- **2026-09-11 — Books mirror blueprint for the textbook reader.** The reader
  was measured against its iPhone references (`public/books-app/`, 390×844 @3x)
  element by element; the blueprint at `.claude/plans/books-app-mirror-blueprint.md`
  carries the reference numbers with provenance tags, the deltas (opener 34→36,
  ornament 153→105, menu pills 45→47, contents head 22/17→17/15, rows 17→15,
  theme cards square→103:95, Customize 52→48, Arabic leading 1.9→1.7), the
  motion table and a phased plan. **OPEN defect found there:** `cover.tsx` puts
  `data-chrome` on `.book-cover-art`, so every tap on the cover screen is
  ignored and a mouse user cannot leave the cover (keys and swipes work).
  Verification harness: `scripts/books-mirror-capture.mjs` +
  `scripts/books-mirror-crops.py`.

- **2026-09-09 — A summary sits beside the textbook in Materials.** Both tiles
  come off one board: the shared `BookCoverTile` renders the cover art plus the
  reader's three cover lines, and a green disc in the top corner (logical
  `start`, so it follows the reading direction) marks the summary. New
  `catalog.summary` key in both dictionaries. **OPEN: the summary tile has no
  destination** — no `SUMMARY` material type, no `/subjects/[slug]/summary`
  route and no summary content on the CDN yet, so it renders as a plain tile.
  Pass `summaryHref` to `CatalogContentSections` to make it a link, one line at
  each of the two call sites. A third tile off the same board carries the
  question bank, on a blue disc, and it _does_ link — straight to the existing
  `qbankHref`.

- **2026-09-09 — The subject page's content sections re-ordered, and the
  textbook tile carries the book's cover lines.** Materials now precede Videos;
  a video tile's title moved off the middle of its thumbnail into the frosted
  foot, on the line above duration and views. That foot keeps its light glass
  cloud (a dark scrim was tried and rejected) and earns its legibility from a
  whiter frost plus dark ink, rather than from darkening the artwork. The textbook tile prints the same
  three lines the reader's first screen prints — stage, kashida-stretched title,
  grade — under the same white veil, from the same `catalog.reader` labels. The
  stage/grade helpers (`stageLine`, `gradeLine`) moved out of the reader's
  server `content.tsx` into the pure `textbook/format.ts` so the client tile can
  share them. The tile's title is the subject's **untranslated** name, as a
  printed cover keeps its own language — on `/en` the translated name read
  "neighborhoods" for الأحياء. Wired at both call sites (school `[slug]` and
  community). tsc clean; verified on `demo.localhost:3000` in ar and en.

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

- **2026-09-08 — Gotcha: `git apply --cached --unidiff-zero` lands at the
  working tree's line numbers, not the index's.** The three stage keys in the
  previous commit went into `school.timetable` instead of
  `school.subjects.catalog.reader`. The JSON stayed valid, and the app was
  right because it reads the working tree, so nothing failed — the mistake
  only existed in the commit. When staging a hunk of a shared dictionary,
  verify semantically afterwards (`git show :<file> | python -c "…json…"`),
  never by reading the diff. The safe move is to rebuild the blob from
  `git show HEAD:<file>`, insert at a structural anchor, `git hash-object -w`
  and `git update-index --cacheinfo`.
- **2026-09-08 — The cover is only a cover.** Contents, Start reading and
  About are gone from it; the book is entered by turning the page, and the
  reading menu still carries Contents, Search and the rest. The About sheet
  had no other entry, so it went with them (`AboutSheet`, `CoverInfo.description`
  and the cover's `stats` are all deleted rather than left dead). What is left
  is what a textbook prints: **المرحلة الثانوية / الأحــيــاء / الصف الثالث
  ثانوي**, big, all in the foreground colour, centred in the board's free
  head. Three details: the title is the catalog's own name (`Subject.name`)
  rather than the twin's longer authoring title; the grade is the book's
  place inside its stage, not in the school, so grade 12 reads "الثالث ثانوي"
  (`gradeOrdinal` + `ordinal1..6` + `stageSuffix*`, and the English template
  reads `{n}` so it stays "Grade 12"); and the title is stretched with
  kashida (`elongate` in `format.ts`, U+0640 after forward-joining letters),
  never with `letter-spacing`, which would break the joins — with an
  exception for lam-alef, whose ligature a stroke would spoil.
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
