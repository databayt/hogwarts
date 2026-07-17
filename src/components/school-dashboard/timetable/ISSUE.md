---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: issue
owner: Abdout
maturity: Production-Ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-07-16
---

# Timetable -- Production Readiness Tracker

**Status:** PRODUCTION-READY
**Completion:** 95%
**Last Updated:** 2026-06-13

---

## MVP Checklist

- [x] Weekly schedule builder with visual grid
- [x] Flexible working days configuration (Sun-Thu, Mon-Fri, custom)
- [x] Lunch break positioning (configurable per school/term)
- [x] Conflict detection engine (teacher/room/class double-booking)
- [x] Class view and teacher view switching
- [x] Room view
- [x] A4 print-ready output with proper styling
- [x] Term-based schedules (different schedule per term)
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Slot editor with suggestions for free periods
- [x] Server actions with proper validation
- [x] TypeScript strict mode compliance (no `any` violations)
- [x] Typography system compliance (semantic HTML)
- [x] Auto-generate scheduling algorithm
- [x] Schedule templates (create and apply)
- [x] Analytics and reporting
- [x] Substitution management
- [x] PDF export
- [x] Role-based views (admin, teacher, student, guardian)
- [ ] Drag-and-drop slot editor (currently click-based)
- [ ] Mobile-optimized view (component exists, needs polish)
- [ ] ARIA grid pattern for accessibility

## Known Issues

### Recently Fixed (2026-07-17 -- teacher fill, the Sudanese school day, isBreak, Arabic naming, skeleton)

Driven by "optimize any pending work + the skeleton", and before that a prod
pass on the demo. **The prod demo (Neon) now carries all of this**; local too.

1. **Teacher fill: 12% -> 100%.** `autoGenerateTimetableForSchool` runs with
   `enforceTeacherExpertise: true` -- a slot only gets a teacher if someone
   holds expertise for that exact subject. `seedTeacherSubjectExpertise` dealt
   each teacher **1-3 RANDOM subjects** (`randomElement`), guaranteeing nothing,
   so whole subjects had no qualified teacher. The legacy seed's 100% fill was
   **fake** -- round-robin with no qualification check. Now **coverage-first**:
   walk the subjects the school actually teaches and give each
   `TEACHERS_PER_SUBJECT = 3` teachers, round-robin. Local 569/720 -> 714/714.
2. **Teachers are a CAPACITY constraint.** The generator caps each teacher at
   `maxPeriodsPerWeek: 25`. Lite's 12 sections x ~30 periods = ~360 slots, but
   12 teachers can supply at most 300 -- **arithmetically unfillable**. Lite
   `teacherUsers` 12 -> 24. Keep `teacherUsers >= ceil(sections * periods / 25)`.
3. **`seedTeachers` silently DROPPED teachers when growing a set.** `employeeId`
   and `emailAddress` are both `@@unique` but were derived from the ARRAY INDEX,
   while `resolveUsers`' `findMany` returns users in arbitrary order -- new users
   landed on indices an existing teacher already held, create threw, and the
   catch looked for an existing teacher **by userId**, found none (it's a NEW
   user), and dropped it. 24 users yielded 18 teachers, EMP0013 skipped, no
   error surfaced. Now next-free allocators for both + a `logWarning`.
4. **`Period.isBreak` column added** -- break-ness is DATA, never inferred.
   9 call sites tested the English substrings "break"/"lunch" against a
   user-editable name (2 of them **case-sensitively**), so an Arabic «فسحة»
   classified as TEACHING time and the generator scheduled classes into the
   break. Writers persist `structure.type !== "class"`; every reader filters the
   column. Regression-tested (renaming breaks to Arabic -> 0 slots in a break).
5. **The seed ignored the school's declared timetable structure.** The demo
   declares `sd-private` but `seedPeriods` hand-rolled `SCHOOL_PERIODS`
   (8x45min, 07:45-15:00) -- so it _claimed_ a 7-period Sudanese structure while
   holding 8 generic ones. `seedPeriods` now reads the declared structure
   (one source of truth, same as the generator swap). `pruneStalePeriods`
   removes periods a different structure left behind, but only when nothing
   references them (it refuses to cascade live slots away, and warns instead).
6. **The grid rendered NO breaks at all.** The single "Lunch" row was positioned
   by `lunchAfterPeriod` <- `SchoolWeekConfig.defaultLunchAfterPeriod`, and the
   demo has **no SchoolWeekConfig row** -> null -> the row never rendered. It
   also found the period by matching "lunch" against the name, and could only
   ever show ONE break. `simple-grid` now derives break rows from the PERIOD
   DATA, keyed to the teaching period each precedes.
7. **The Sudanese school day is real now** (Abdout, 2026-07-17): exactly ONE
   فسحة (40min, mid-morning, when فطور is eaten). **No second break, no lunch**
   -- الغداء is eaten at home after dismissal; a midday "Lunch" is a Western
   import. sd-private **07:15-14:10** (7x50min), sd-gov-default 07:30-14:40.
   `sd-british` KEEPS its lunch (Mon-Fri, British curriculum).
8. **Arabic sections + homerooms.** `autoProvisionSections` hardcoded English
   for EVERY school (`letters = "ABCDEFGHIJ"`, `Grade 1-A`, room `A01`), so a
   Sudanese school got English sections (`lang="en"`) while its grades read
   الصف الأول. Now locale-aware **by `School.preferredLanguage`** via
   `sectionLetters()` / `defaultSectionName()` in `catalog/room-naming.ts`
   (shared with the classrooms Configure tab so the paths can't drift):
   أ/ب/ج (أبجد order), `الصف الأول - أ`, room `أ01`. **Digits stay Latin** --
   the Arabic UI renders numbers in Latin throughout (الحصة 1, 07:15).
   Both paths now persist `lang` on the rows they mint.
9. **Classroom picker showed English on /ar.** 16 `Classroom` rows ("Football
   Field", "Staff Room", "Physics Lab") were English while tagged `lang=ar`.
   Not generated by any live code -- `CLASSROOMS` has been Arabic all along;
   these were **stale rows from before it was Arabized**. `seedClassrooms`
   upserts on `schoolId_roomName`, so **the display name IS the key** and a
   rename can never update a row -- it creates a new one and orphans the old.
   Renamed out-of-band; `seedClassrooms` now warns about unreferenced rooms
   absent from CLASSROOMS (reports, never deletes -- schools add their own).
10. **Skeleton mirrors the grid.** `<Skeleton className="h-96 w-full" />` -- one
    featureless rectangle standing in for the whole timetable -- at **7 call
    sites** across every view, against the block's own rule ("match the actual
    content layout exactly"). New `views/grid-skeleton.tsx`
    (`TimetableGridSkeleton`) mirrors `SimpleGrid`'s DOM: same container, same
    `grid-cols-N` header, period rows, and a break row in the right place, so
    the page resolves in place instead of reflowing. `loading.tsx` now matches
    the live page (centred title, tab bar, two filter comboboxes) and delegates
    the grid, instead of a left-aligned header + `SkeletonCalendarCompact
periods={8}` (wrong side, no tabs, and 8 no longer matches the 7-period day).

**Recurring lesson:** three separate rows lied about their own language
(Islamic subjects, classrooms, sections). The translation layer trusts `lang`
and renders the source verbatim, so a dishonest tag is **unfixable at read
time** -- and with the Google quota dead there is no fallback. Tag what you
actually wrote.

### Recently Fixed (2026-07-16 -- demo data correctness + the i18n long-tail)

Driven by "`/ar/timetable` shows _No timetable data available_". The empty grid
was the surface symptom of two independent seed bugs, and fixing them exposed a
third in analytics.

**Data (the grid was empty on a school with 1,120 slots):**

1. **Active-term mismatch** — `prisma/seeds/index.ts` hardcoded `terms[0]`
   ("Use first term") while `seedTerms` derives WHICH term is active from
   today's date. A seed run inside the Term 2 window (Jan–Jun) marked Term 2
   active but wrote every class + slot to Term 1; `resolveActiveTerm` then read
   Term 2 and found nothing. `TermRef` now carries `isActive` (one source of
   truth) and the seed scopes to `terms.find((t) => t.isActive)`.
2. **Legacy classId-only slots in the wrong rooms** — the hand-rolled
   `seedTimetable` scheduled classes into whatever room was free, so **0 of
   1,120** slots sat in a section's homeroom (they filled the Principal Office,
   Staff Room, Assembly Hall and the Football Field, each to 40/40) while the 24
   real classrooms A01–B12 sat empty, and every slot had `sectionId`/`subjectId`
   null. Both the full seed and `db:seed:single timetable` now call the
   PRODUCTION generator `autoGenerateTimetableForSchool` — the same path a real
   school gets at onboarding — mirroring the earlier retirement of the
   hand-rolled `catalog/demo.ts`. Result: 720 slots, **720/720 in a section
   homeroom**, 720/720 with section+subject, 569 with a qualified teacher, 0
   errors. `seedTimetable` (`prisma/seeds/timetable.ts`) is now unreferenced.
3. **Period times were seeded in the seeding machine's timezone** — `parseTime`
   used `setHours`, so on a CAT (+02) box "07:45" persisted as 05:45Z and the
   grid (which reads `getUTCHours()`, matching how the app writes period times
   via `Date.UTC`) rendered a school day starting at 05:45. Now UTC wall-clock.
4. **Every term picker defaulted to the wrong term** — `getTermsForSelection`
   ordered by `startDate desc`, and analytics/conflicts/generate all default to
   `terms[0]`; the newest term is not the active one, so those pages opened on a
   term with 0 slots. Now ordered active-first. `resolveTerm` in
   `single.ts` had the same latent bug (Term 1 by `termNumber asc`) — also
   active-first now.
5. **Analytics was blind to section-based slots** — `getTimetableAnalytics`
   included only `class`, so once generation moved to the section axis every
   subject fell back to "Unknown" and the class count collapsed to 0. It now
   selects `subject`/`section` and uses the block's documented `sectionId ??
classId` cohort fallback (same rule as `detectConflicts`).

**i18n (~63 live gaps found; the dictionary keys mostly already existed but were
never wired):**

- **SimpleGrid dictionary was dropped at all 5 call sites** — the 4 role views
  passed only `{ liveNow, scheduledToday }`, so `period` / `lunch` /
  `lunchBreak` / `conflict` fell back to hardcoded English **regardless of
  locale** — every grid cell read "Period 1" on /ar. Now threaded in full.
- **Server actions returned English display labels** — `Term ${n}`, `— Draft`,
  `Unknown` were string-concatenated in `actions.ts`, so the term badge stayed
  English on /ar no matter the locale. Added an INTERNAL (unexported)
  `getTimetableDict()` and new `termLabel`/`draft`/`unknown` keys.
- `views/role-router.tsx` — `noData`/`loadFailed` keys existed, unused (this was
  the literal "No timetable data available" on screen).
- `analytics/content.tsx` — ~22 strings; the `analyticsReports`/`analyticsExtra`
  sections already existed and were never imported by the file.
- `generate/content.tsx` — toasts, `andMore`, `Unassigned`, and a **key
  mismatch** (`g?.unplacedClassesDesc` vs the real `unplacedDesc` → always
  English). `DAY_NAMES_AR` replaced by the shared `dayNames` array.
- `slot-editor-dialog.tsx` — Zod messages reach the user via `<FormMessage />`;
  module-scope schema converted to a `createSlotSchema(t)` factory (the
  `*Required` keys already existed in both locales).
- `conflicts/content.tsx` — `{count !== 1 ? "s" : ""}` English plural hack
  (Arabic has no such rule) replaced with explicit singular/plural keys.
- `substitutions/substitution-list.tsx` — day names had zero locale handling.
- **`config.ts` `ABSENCE_TYPES` are hardcoded ARABIC** and were rendered
  directly at both substitution surfaces, so `/en` showed Arabic. New
  `getAbsenceTypeOptions(d)` factory maps them onto the existing
  `substitutions.reasons` keys.

**Subject colour-coding was broken for Arabic** (`config.ts`):
`getSubjectColorIndex` hashed `charCodeAt(0) % 5`, but virtually every Arabic
subject opens with the definite article "ال" (U+0627) — 8 of 9 demo subjects
collapsed onto ONE colour, so the /ar grid rendered flat red while /en spread
across the palette. Now hashes the whole string (same input → same colour).

tsc 0; 149 timetable tests green; i18n parity green. The repo-wide
`hardcoded-ratchet` bilingualField + STATIC-GAP ratchets are red from OTHER
uncommitted work (`site-header`, `school-marketing`, `/documents`,
`/exams/new`) — the timetable block contributes **0** offenders.

Applied to the LOCAL dev database only (`.env` points at
`localhost:5432/hogwarts`); the prod demo on Neon still carries the old data
until the seed runs against it.

**Still open (data, not code):** 7 SD catalog `Subject` rows are named
`"Islamic"` in English while tagged `lang=ar`
(`sd-g{1,2,3,6,8,9,12}-islamic-*`), so an English label sits among the Arabic
subjects everywhere the catalog renders — a catalog seed issue, not timetable.

### Recently Fixed (2026-07-12 -- live-class awareness on the weekly grid)

The "Full Week" grid (`views/simple-grid.tsx`) was invisible to live-class
state — only the Today cards (teacher/student/guardian) showed a Join button
via `attachLiveClasses`, so a session live right now (or scheduled today) had
zero affordance on the weekly grid, and **admin had no live-class signal at
all** (admin never renders Today cards).

1. New helper `getLiveClassIndicators(schoolId)` in `live-class-join.ts` — one
   tenant-scoped `db.conference.findMany` for today's `live`/`scheduled`
   sessions (`deletedAt: null`), returning a `timetableId -> "live" |
"scheduled"` map ("live" always wins over "scheduled" for the same slot).
   Independent of `attachLiveClasses` (which is section+subject keyed, for
   the Today-card Join target, not a per-slot map).
2. `getTimetableByTeacher` / `getTimetableByRoom` / `getTimetableByStudentGrade`
   / the private `getTimetableByClassIds` (feeds guardian's `getChildTimetable`)
   now fetch the indicator map in the same `Promise.all` as their slots query
   and return it as `liveIndicators` — no new client-triggered fetch, the
   existing on-mount action call just returns one more field.
3. `simple-grid.tsx` accepts `liveIndicators?: Record<string, "live" |
"scheduled">` and renders a small corner badge per slot: a pulsing
   `bg-destructive` dot + "Live now" label for `live`, a subtle outline dot
   (title-attr + `sr-only` tooltip) for `scheduled`. Semantic tokens only,
   logical `end-1`/`top-1` positioning (RTL-safe), `print:hidden`.
4. All 4 role views (teacher/student/guardian/admin — admin covers both its
   room and teacher grid modes) thread `liveIndicators` from their existing
   action-call result into `<SimpleGrid>`, resetting it alongside `slots` on
   selection change (admin) so no stale dot flashes.
5. Dictionary: `school.timetable.liveNow` added (en: "Live now", ar: "مباشر
   الآن"); the scheduled-state tooltip reuses the existing
   `school.liveClasses.status.scheduled` ("Scheduled"/"مجدول") — no new key.

Scope note: `views/preview.tsx` (a random-teacher/class demo widget, not one
of the 4 role views) was left unwired — out of the explicit scope and not a
live operational grid.

tsc 0 in `timetable/*` (5 pre-existing errors in `conference/*` from another
in-flight workstream, unrelated); 149 timetable tests green; i18n parity +
rtl-physical-class ratchets green.

### Recently Fixed (2026-06-17 -- zero-click auto-provision, schedule configurator, slot-editor simplification)

Driven by "why no subjects render on `/en/timetable`": the demo had **0 timetable
slots** (and 2 duplicate school years / 2 active terms). Root causes + fixes:

**Auto-provision (every school, zero clicks):**

1. `getProvisioningStatus` no longer gates the `schedule`/`timetable` stages on a
   pre-selected `School.timetableStructure` — they're flagged missing whenever the
   counts are 0, so every school auto-generates a timetable. `repairProvisioning`
   resolves an effective structure slug (explicit choice, else
   `resolveEffectiveStructureSlug` → country-recommended default) and persists it.
2. **Duplicate-year root cause**: `applyTimetableStructureForNewSchool` matched the
   year by `yearName` only, but the seed writes `"2025-2026"` (hyphen) while
   `computeTermDates` writes `"2025/2026"` (slash) — never reconciled → a 2nd
   SchoolYear. Now matches by yearName **OR date-range overlap** with the current
   academic window (format-agnostic, still scoped to the current year). Changing the
   seed's format was rejected — it would orphan existing hyphen-year rows on re-seed.
3. **Term-from-date**: `seedTerms` derived `isActive` from today's date instead of
   hardcoding Term 1; `resolveActiveTerm` Priority 1 now prefers the active term whose
   range contains today (defensive against legacy duplicate-active data);
   `autoGenerateTimetableForSchool` resolves the term via `resolveActiveTerm` (not a
   bare `findFirst`) so generation and the grid always agree on the term.
4. Demo seed (`DEMO_SCHOOL`) now sets `timetableStructure: "sd-private"`.

**"Period Period 1"**: `simple-grid.tsx` prepended the localized "Period" label to a
name already stored as `"Period 1"`. Now strips a leading `Period ` from the name.

**Slot-editor simplification**: collapsed the 3-tab dialog to a flat form; day/period
(click context) + classroom (room view) + section (homeroom mapping) are shown as
read-only context, not pickers; removed the "Options" tab (substitute/recurring/notes
were never persisted); `teacherId` is now optional (`upsertTimetableSlotSchema` +
`validateSlotConstraints` skip the teacher check when absent) so subject-only slots can
be created and the teacher attached later.

**Schedule configurator**: timetable Settings now mirrors the onboarding schedule step
— a preset `<Select>` + quick-config knobs (weekend/periods/duration/start) driving a
shared `StructurePreview` (lifted to the timetable block), applied via
`applyTimetableStructure`; the per-period editor remains for manual fine-tuning. The old
"Use Template" dialog was removed (superseded).

**Realistic generation** (round 2): three generator fixes in `generate/algorithm.ts` +
`autoGenerateTimetableForSchool`:

- `placeSectionSubject` placed a subject in MANY periods of one day (inner period loop never
  broke). Now ≤1 period per subject per day, spread across `selectDaysForSubject`'s days.
- Generation passed `[]` teachers + empty `preferredTeacherIds` → every slot teacher-less.
  Now wires active teachers + their `subjectExpertise` (subjectId == SubjectSelection
  `catalogSubjectId`) and assigns a qualified, conflict-free teacher.
- Slot persistence hardcoded `teacherId: undefined`, discarding every assignment → now
  persists `slot.teacherId`.
- Teacher matching is no longer opportunistic: per day it PREFERS a period where section +
  room + a qualified teacher are all free, falling back to teacher-less only if none.

**Slot-editor pickers**: `getSubjectsForSlotEditor` read `Class` rows by the active termId
(empty when classes live under a different term — the empty-subject-picker bug); now reads
term-independent `SubjectSelection`. `getTeachersForSlotEditor` localizes names to the app
language (`getNames`) and dedupes by display name (the seed reuses ~31 names across 100
teacher rows). Dialog v2: removed all icons + avatars; the 4 auto-detected facts (day /
period / classroom / section) render in one compact row; section shows its name only (app
language, no stored grade label).

**Demo data** (prod Neon, additive + reversible): regenerated to 840 slots (24/24 sections,
full 7×5 grids), **max 1 same-subject-per-day**, **0 teacher double-bookings**, 121 slots
teacher-assigned. Deactivated the stale Sept–Dec active term (one active term remains).
Known data limits (NOT code): the demo over-selects subjects per grade (322 "placed 0/N"
overflow) and has sparse teacher expertise (only 262/480 section-subjects have any qualified
teacher → ~14% teacher coverage). Realistic coverage needs curated SubjectSelection +
expertise seeding. The duplicate SchoolYear row is left in place (harmless).

tsc 0; 197 timetable + 21 catalog-provision tests green; i18n parity green. (The repo-wide
`rtl-physical-class` + `errorReturn` ratchets are red from **other** uncommitted branch
work — `admission/leads/content.tsx` — not this change.)

### Recently Fixed (2026-06-13 -- production-readiness pass: security, correctness, validation, perf, a11y)

Driven by a 9-dimension adversarial audit (tenant / authz / validation /
correctness / perf / i18n / types / a11y / structure). 180 timetable tests
green, tsc 0.

**Security / tenant (P1):**

1. `validateTeacherConstraints` / `validateRoomConstraints` /
   `validateSlotConstraints` were exported in a `"use server"` file → directly
   HTTP-callable with a **caller-supplied `schoolId`**, leaking another tenant's
   teacher/room/constraint data. They are now **un-exported internal helpers**
   (only `upsertTimetableSlot` / `moveTimetableSlot` call them, passing the
   context schoolId). The HTTP surface is gone.
2. `upsertTeacherConstraints` and `addTeacherUnavailableBlock` now verify the
   teacher / parent-constraint belongs to the caller's school before writing
   (global-CUID FKs don't enforce tenancy → was cross-tenant corruption).
3. `filterTimetableByRole` now **throws** on a null schoolId instead of silently
   dropping the tenant filter (was a cross-family guardian leak risk), and is
   generically typed (`TimetableRowMinimal`) instead of `any`.
4. Permission guards (`requirePermission`/`requireAdminAccess`/
   `requireReadAccess`) now distinguish unauthenticated (`NOT_AUTHENTICATED`)
   from unauthorized.

**Correctness (P1):**

5. `detectTimetableConflicts` no longer crashes on **section-based slots**
   (`classId`/`class` null) — it dereferenced `a.class.id`. Cohort identity now
   falls back section → class, and the per-conflict detail fetch was collapsed
   from **N+M serial queries to 2 batched queries**.
6. `moveTimetableSlot` now detects a **section double-book**
   (`SECTION_DOUBLE_BOOKED`) on the target cell, passes `sectionId` to capacity
   validation, and builds the conflict `OR` conditionally (a null
   teacher/room/section no longer matches every unassigned slot).
7. `applyTemplateToTerm` clear+insert is now a single `$transaction`
   (`deleteMany` + `createMany({ skipDuplicates })`) — a partial failure can no
   longer destroy a term's slots while leaving an incomplete replacement.
8. `setActiveTerm` verifies the term belongs to the school, then flips
   active/inactive atomically in one `$transaction` (a crash mid-flip could
   leave every term inactive).

**Validation / perf / a11y:**

9. Zod parsing added to ~12 previously-unvalidated mutations (move, delete,
   applyGenerated, applyTemplate, createTemplate, createPeriod, addUnavailable
   Block, setActiveTerm, upsertTeacherConstraints, getSubstitutionRecords,
   importTimetableSlots) with bounds on numbers/arrays/strings.
10. `getTimetableAnalytics` room utilization is O(slots) (Map) instead of
    O(rooms × slots); removed dead `withPermission/withAdminAccess/withAudit`
    wrappers and the unsafe `any` casts they carried; `logTimetableAction`
    now emits in all environments (production trail).
11. Server-side notifications (move/delete/assign/respond) were **hardcoded
    Arabic** regardless of the school's language — now localized by
    `School.preferredLanguage`.
12. a11y: removed invalid heading nesting in the slot-editor dialog
    (`h4` inside `DialogTitle`, `h5` inside `AlertTitle`); decorative settings
    timeline `aria-hidden`; fixed duplicate `htmlFor` on the preview Switch
    (now an `aria-label`); conflict indicator no longer colour-only (icon +
    `sr-only` text); guardian avatar `alt`; decorative combobox chevrons
    `aria-hidden`.

### Deferred (tracked follow-ups, not blockers)

- [ ] **`actions.ts` split** — 6.5k-line file mixing read queries + write
      actions + helpers; split into `queries.ts` / `actions.ts` (constants must
      stay out of the `"use server"` file). Mechanical but large.
- [ ] **Full ARIA grid pattern + keyboard nav** in `views/simple-grid.tsx`
      (`role=grid/row/gridcell`, roving tabindex, arrow keys, editable cells as
      buttons). The conflict-indicator + heading fixes landed; the grid
      interaction model is the remaining chunk.
- [x] ~~**Content-file i18n long-tail**~~ — CLOSED 2026-07-16/17. `generate/`,
      `settings/`, `conflicts/`, `slot-editor-dialog` and the
      `getActiveTerm`/`getTodaySchedule`/`getTimetableAnalytics` labels all go
      through the dictionary now; verified no user-facing English literals
      remain in JSX text, toasts, labels or placeholders, en+ar parity green,
      and the block contributes 0 `hardcoded-ratchet` offenders.
- [ ] **Consolidate `permissions.ts` + `permissions-config.ts`** into
      `authorization.ts` per the school-dashboard convention.
- [ ] **`logTimetableAction` → dedicated audit table** (currently a structured
      console sink; fine for now, but no queryable history).
- [ ] **`respondToSubstitution` is admin-only** — if a teacher-facing
      substitution-response UI is added, relax the guard to allow the assigned
      substitute teacher to confirm/decline their own record.
- [ ] **Remaining perf** (lower priority): `getTimetableByClass` `include`→
      `select`; dedupe redundant `getTenantContext` in `getTodaySchedule`/
      `getWeeklyTimetable`; `importTimetableSlots` upsert-loop→`createMany`
      (loses per-row error attribution — needs a pre-validation pass);
      `algorithm.optimizeSchedule` O(slots²) delta-scoring.

### Recently Fixed (2026-06-12 -- section-first lifecycle + terms-aware calendars)

1. **Manual slot lifecycle migrated to sections** -- `upsertTimetableSlot`
   now requires `sectionId` + `subjectId` (slot editor has section/subject
   pickers); editing a legacy `classId` row backfills its section fields in
   place; `deleteTimetableSlot` is id-based (section slots were previously
   undeletable via the legacy composite key). New slots carry NO `classId`.
2. **Student/guardian visibility** -- `getWeeklyTimetable`, `getTodaySchedule`
   (STUDENT), `getChildTimetable`, `getTimetableByStudentGrade`,
   `getTimetableByGradeLevel` now OR `Student.sectionId` with legacy
   `StudentClass` classIds; section-generated schedules render the moment a
   student is placed (previously invisible).
3. **Security: `getChildTimetable` access hole closed** -- a caller with no
   guardian record in the school skipped the relationship check entirely;
   now denied.
4. **Edit self-conflict** -- `upsertTimetableSlot` passes `excludeSlotId` so
   a teacher at max periods can re-save their own slot.
5. **Client conflict false-positive** -- `detectConflicts` coalesced cohort
   identity (`sectionId ?? classId`); two section slots no longer "conflict"
   via `undefined === undefined`.
6. **Terms-aware calendars** -- new `calendars.ts` (`ACADEMIC_CALENDARS`,
   `resolveAcademicCalendar`, `computeTermDates`): country/structure + date →
   N terms with correct boundaries + exactly-one-active; wired into
   `applyTimetableStructureForNewSchool` and `resolveActiveTerm` fallback.
   Structure `calendar` override (sd-british → GB). 30+ new tests.
7. Error strings in actions.ts converted to snake-free CAPS codes
   (`SLOT_NOT_FOUND`, `SECTION_NOT_FOUND`, …) per the i18n error-code rule.

Deferred (documented legacy paths, commented in code): `importTimetableSlots`
and `applyTemplateToTerm` still replay `classId` — section migration pending.

### P1 -- High

- [x] Role checks on mutations enforced (every mutation calls
      `requireAdminAccess`/`requirePermission`; the unauthenticated `validate*`
      HTTP surface was removed) — 2026-06-13
- [ ] Print view needs final tuning for varied day counts (fonts/margins)
- [ ] Integration tests for overlapping slots and weekend pattern rendering
- [ ] `importTimetableSlots` + `applyTemplateToTerm` are classId-only (legacy
      replay) — need a resolve step (classId → sectionId/subjectId) before
      legacy rows can be fully retired

### P2 -- Medium

- [ ] React.memo not applied to grid cells (performance at scale)
- [ ] No virtual scrolling for large timetables
- [x] Conflict detection N+M serial queries → 2 batched queries — 2026-06-13
- [ ] No keyboard navigation (arrow keys) in grid cells (part of the full ARIA
      grid follow-up above)
- [x] Conflict indicator no longer colour-only; decorative elements hidden from
      AT; invalid heading nesting removed — 2026-06-13 (full grid SR pattern
      still pending)

## Enhancements (Post-MVP)

- [ ] Drag-and-drop timetable editing with auto-suggestions
- [ ] Recurring event exceptions (holidays, special schedules)
- [ ] Teacher preference tracking for auto-scheduling
- [ ] Zustand store migration (from multiple useState)
- [ ] Virtual scrolling for large timetables
- [ ] Progressive loading strategy
- [ ] Copy schedule from previous term
- [ ] Grade-level and class-level schedule config overrides

---

> **Tracker note:** the frontmatter `tracker: #323` is stale — #323 is the
> "[Epic] LMS / Stream — asset-download wave" epic, unrelated to timetable.
> There is no open timetable issue (the timetable reports #364/#365 are closed;
> the i18n one #365 is addressed by the notification + deferred content-i18n
> work here). No GitHub comment was posted for this pass.

**Last Review:** 2026-07-16 (demo data correctness — seed now uses the production generator, active-term scoping, UTC period times — plus the i18n long-tail: SimpleGrid dict pass-through, server-action term labels, analytics/generate/conflicts/substitutions wiring, and the Arabic subject-colour hash)
