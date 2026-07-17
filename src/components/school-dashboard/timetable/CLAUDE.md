---
epic: 05
sprint: Q3-2026
title: Timetable (LMS scheduling)
file_type: claude
owner: Abdout
maturity: Production-Ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/timetable
last_audited: 2026-07-16
---

# Timetable (LMS scheduling) Block

## Context

Timetable (LMS scheduling) — Q3 2026 sprint epic 05, maturity `Built+Polish`, ~80% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [323](https://github.com/databayt/hogwarts/issues/323).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/323) for cross-feature dependencies

## Key Decisions

- **The demo seed uses the PRODUCTION generator** (2026-07-16): both
  `prisma/seeds/index.ts` and `db:seed:single timetable` call
  `autoGenerateTimetableForSchool` — the same path a real school gets at
  onboarding — instead of the hand-rolled `seedTimetable`. That legacy seed
  scheduled classes into any free room (offices, labs, the football field: 0 of
  1,120 slots landed in a section homeroom) and wrote classId-only rows with no
  sectionId/subjectId, which the section-based reads can't see. Same move the
  catalog block already made retiring `catalog/demo.ts`: seed and onboarding
  share one source of truth. `prisma/seeds/timetable.ts` is now unreferenced —
  do NOT wire it back in. The generator only `createMany`s (skipDuplicates), so
  every caller must `deleteMany` the term's slots first to stay idempotent.
- **Anything the seed writes must be scoped to the ACTIVE term** (2026-07-16):
  `seedTerms` derives which term is active from today's date, so `terms[0]` is
  NOT reliably the active one — a seed run during the Term 2 window wrote every
  class + slot to Term 1 while marking Term 2 active, and `resolveActiveTerm`
  (what every read path uses) then found 0 slots on a school with 1,120. `TermRef`
  carries `isActive` as the one source of truth; use `terms.find(t => t.isActive)`.
- **Term pickers must default to the ACTIVE term, not the newest**
  (2026-07-16): analytics/conflicts/generate all default to
  `getTermsForSelection()[0]`, so that action orders `isActive desc` first. A
  bare `startDate desc` opens those pages on a term the school isn't teaching.
- **Period times are UTC wall-clock** (2026-07-16): the app writes them as
  `new Date(Date.UTC(1970, 0, 1, h, m))` and the grid reads `getUTCHours()`.
  The seed's `parseTime` must match — it used `setHours`, so times drifted by
  the seeding machine's offset (07:45 → 05:45 on a CAT box).
- **Timetable auto-provisions for EVERY school, zero clicks** (2026-06-17):
  `getProvisioningStatus` flags the `schedule`/`timetable` stages missing
  whenever counts are 0 (no longer gated on a pre-chosen
  `School.timetableStructure`); `repairProvisioning` resolves an effective
  structure slug via `resolveEffectiveStructureSlug` (explicit choice → country
  default) and persists it. `autoGenerateTimetableForSchool` resolves the term
  through `resolveActiveTerm` (NOT a bare `findFirst`) so generation and the grid
  agree on the term — critical when legacy data has duplicate active terms.
- **Generation realism** (2026-06-17): `placeSectionSubject` places a subject
  AT MOST ONCE per day (spread across days), and per day PREFERS a period where
  the section, a room, AND a qualified teacher are all free before falling back
  to a teacher-less period. `autoGenerateTimetableForSchool` wires real teachers
  - `subjectExpertise` (its `subjectId` == SubjectSelection `catalogSubjectId`) so
    slots get a conflict-free qualified teacher; the persist step must NOT hardcode
    `teacherId: undefined` (that silently discarded every assignment — a real bug).
    Generation still emits teacher-LESS slots where no qualified teacher is free;
    coverage is bounded by how well `TeacherSubjectExpertise` covers the school's
    `SubjectSelection`.
- **Slot-editor pickers are term-independent + localized** (2026-06-17):
  `getSubjectsForSlotEditor` reads `SubjectSelection` (NOT `Class` by termId —
  classes can live under a different term → empty picker).
  `getTeachersForSlotEditor` localizes names via `getNames` (app language) and
  dedupes by display name. The dialog renders the auto-detected day/period/
  classroom/section as ONE icon-less row of VALUES ONLY (dot-separated, no
  labels): period carries its start time (`Period 1 (8:00)`) and the section is
  shown as its GRADE (`Grade 1`), which is what the room maps to. Title is
  terse (`Add slot`/`Edit slot`), no description.
- **Slot-editor subjects are grade-aware** (2026-06-17):
  `getSubjectsForSlotEditor` returns `gradeIds: string[]` per subject (grouped
  from `SubjectSelection`, no longer `distinct` by `catalogSubjectId`). The
  dialog filters the subject picker to the resolved section's `gradeId` (room
  A01 → Grade 1 → only Grade 1 subjects); falls back to the full list when the
  grade can't be resolved or no subject carries grade metadata.
- **Room/teacher grid names are localized** (2026-06-17):
  `getTimetableByRoom`/`getTimetableByTeacher` run subject names through
  `getLabels` and teacher names through `getNames` (app language) before
  returning slots — stored Arabic teacher names no longer leak onto `/en`.
- **Year match is date-range, not yearName-string** (2026-06-17):
  `applyTimetableStructureForNewSchool` reuses a year by `yearName` OR date-range
  overlap with the current academic window. The seed names years `"2025-2026"`
  (hyphen) and `computeTermDates` `"2025/2026"` (slash) — a string-only match
  created duplicate SchoolYears (the demo's 2-year/2-active-term bug). Do NOT
  "fix" this by changing the seed's yearName format — that orphans existing
  hyphen-year rows on re-seed. The overlap arm stays scoped to the current window
  so it never reuses a stale prior year.
- **Slot editor is a flat, context-aware form** (2026-06-17): day/period (click
  context), classroom (room view), and section (homeroom `Section.classroomId`
  match) render READ-ONLY; the only inputs are subject (required) + teacher
  (optional). `teacherId` is optional in `upsertTimetableSlotSchema`;
  `validateSlotConstraints` SKIPS the teacher check when it's absent (passing an
  `undefined` id to `validateTeacherConstraints` matches a random teacher →
  phantom conflicts). No "Options" tab — substitute/recurring/notes were never
  persisted.
- **`StructurePreview` is shared** (2026-06-17): lives at
  `timetable/structure-preview.tsx`; the onboarding schedule step re-exports it.
  Settings `schedule-configurator.tsx` reuses it so onboarding + dashboard share
  one schedule UI (preset Select + live preview + quick-config knobs).
- **Section is the slot axis** (2026-06-12): `Timetable.sectionId` + `subjectId`
  are the operational identity of a slot; `classId` survives only on legacy
  rows for exams/results history. `upsertTimetableSlot` requires
  sectionId+subjectId and BACKFILLS section fields when editing a legacy row
  (in-place migration on touch). `deleteTimetableSlot` is id-based — never
  reintroduce composite-key deletes (they can't match section slots).
- **Reads OR both axes**: every student/guardian read resolves
  `Student.sectionId` ALONGSIDE `StudentClass` classIds
  (`OR: [{ classId: { in } }, { sectionId }]`). Dropping either arm makes one
  generation of data invisible.
- **Timetable before people**: auto-generation emits teacher-less slots
  (`teacherId: null`); the slot editor is where teachers get attached. Don't
  make teacherId required anywhere in the generation path.
- **Terms come from calendars**: `calendars.ts` (`ACADEMIC_CALENDARS` +
  `resolveAcademicCalendar` + `computeTermDates`) derives N terms from
  country/structure/date — `computeTermDates` guarantees exactly one
  `isActive` term. Structures may carry a `calendar` override (sd-british →
  GB). Consumed by `catalog/provision.ts` and `lib/term-resolver.ts`.
- **Errors are CAPS codes** (`SLOT_NOT_FOUND`, `SECTION_NOT_FOUND`,
  `TEACHER_NOT_QUALIFIED`) — translated client-side, never literal English.

## Danger Zones

- **NEVER infer break-ness from `Period.name`** (2026-07-17): `Period.isBreak`
  is the source of truth. `name` is user-editable free text, and 9 call sites
  used to test it for the English substrings "break"/"lunch" (2 of them
  case-sensitively) — so an Arabic «فسحة» classified as TEACHING time and the
  generator scheduled classes straight into the break. Writers derive it from
  `StructurePeriod.type !== "class"`. `structures.test.ts` locks this.
- **Teacher fill is the generator's silent failure mode** (2026-07-17): it runs
  with `enforceTeacherExpertise: true`, so a slot only gets a teacher if someone
  holds expertise for that exact subject — and it reports success either way.
  ALWAYS check `teacherId != null` counts before/after any regeneration. Two
  independent things break it: sparse `teacher_subject_expertise` (fix:
  coverage-first seeding), and raw capacity — each teacher is capped at
  `maxPeriodsPerWeek: 25`, so `teacherUsers >= ceil(sections * periods / 25)`
  or the grid is arithmetically unfillable no matter how good the expertise.
- **A Sudanese school day has ONE فسحة, no lunch** (Abdout, 2026-07-17): 40min
  mid-morning, when فطور is eaten; الغداء is eaten at home after dismissal. Do
  not reintroduce a midday "Lunch" to `sd-gov-default`/`sd-private` — `sd-british`
  is the only SD structure that legitimately has one. Locked by tests. **Never
  infer Sudanese practice from a rename or from web search — ask Abdout** (web
  search returns Sudan ISD _Texas_, South Sudan, Egypt and Oman, not Sudan).
- **Any seed upserting on a DISPLAY NAME has a rename-orphan hazard**
  (2026-07-17): `seedClassrooms` keys on `schoolId_roomName` and `seedPeriods`
  on `schoolId_yearId_name`, so renaming a value in the constant CANNOT update
  the existing row — it creates a new one and orphans the old, invisibly. That
  is exactly how 16 English classrooms survived the CLASSROOMS Arabization and
  kept showing in the /ar picker. Reconcile explicitly; delete only what nothing
  references (`pruneStalePeriods` refuses to cascade live slots away and warns).
- **Rows must not lie about their own `lang`** (2026-07-17): the translation
  layer trusts the tag and renders the source verbatim, so `lang="ar"` on an
  English string is unfixable at read time — and the Google quota is dead, so
  there is no fallback. Hit three times (Islamic subjects, classrooms, sections).
  `autoProvisionSections` + the Configure tab now persist `lang` on what they mint.
- **Naming is locale-aware by `School.preferredLanguage`** (2026-07-17): section
  letters and homeroom codes come from `sectionLetters()` / `defaultSectionName()`
  in `catalog/room-naming.ts`, shared by `autoProvisionSections` AND the
  classrooms Configure tab — change the helper, never re-inline, or the two
  provisioning paths drift (the reason `defaultRoomName` was centralised).
  Arabic uses أبجد order (أ، ب، ج) and **Latin digits** (أ01, not أ٠١) to match
  how the UI renders numbers everywhere else (الحصة 1, 07:15).
- **The grid skeleton must mirror `SimpleGrid`** (2026-07-17): use
  `views/grid-skeleton.tsx` (`TimetableGridSkeleton`), never a bare
  `<Skeleton className="h-96 …" />`. A blob gives no hint of the grid's shape,
  so the page reflows when data lands. Its defaults describe the Sudanese day
  (5 days, 7 periods, break after 3) — update them if the structure changes.

- **Reads that only `include: { class: ... }` are blind to real slots**
  (2026-07-16): section-based slots carry subject/section directly and have
  `class: null`. `getTimetableAnalytics` read only `class`, so every subject
  became "Unknown" and the class count went to 0 the moment generation moved to
  the section axis. Select `subject`/`section` and coalesce cohort identity as
  `sectionId ?? classId` — the same fallback `detectConflicts` uses.
- **Never hash a subject/label on its FIRST character** (2026-07-16):
  `getSubjectColorIndex` used `charCodeAt(0) % 5`, and virtually every Arabic
  subject opens with the definite article "ال" (U+0627) — 8 of 9 demo subjects
  collapsed onto one colour, so /ar rendered a flat red grid while /en looked
  fine. Hash the whole string. The same trap applies to any first-char keying
  (avatar initials, grouping, bucketing) in an Arabic-first product.
- **`SimpleGrid`'s `dictionary` prop falls back to hardcoded ENGLISH, not to
  `isRTL`** (2026-07-16): `period`/`lunch`/`lunchBreak`/`conflict` have no
  Arabic fallback (unlike `days`, which falls back via `isRTL`). All 5 call
  sites in the 4 role views must pass the full object — passing a subset
  silently leaves "Period 1" in English on /ar.
- **Server actions must not compose display labels from literals**
  (2026-07-16): `getActiveTerm`/`getPersonalizedTimetable`/`getTermsForSelection`
  return a ready-to-render `label`; building it as `` `Term ${n}` `` left the
  badge English on /ar forever. Use the INTERNAL `getTimetableDict()` helper —
  keep it unexported (every export here is an HTTP endpoint).
- **`validate*Constraints` are INTERNAL, not exported** (2026-06-13): in a
  `"use server"` file, every `export` is an HTTP endpoint.
  `validateTeacherConstraints`/`validateRoomConstraints`/`validateSlotConstraints`
  take a `schoolId` parameter — exporting them let any caller probe another
  tenant's data with a forged schoolId. Keep them unexported; only
  `upsertTimetableSlot`/`moveTimetableSlot` call them, passing the
  `getTenantContext()` schoolId. The same rule applies to any new
  schoolId-taking helper.
- **`moveTimetableSlot` conflict `OR` must be conditional** (2026-06-13): a null
  `teacherId`/`classroomId`/`sectionId` must NOT become `{ field: null }` in the
  OR — that matches every unassigned slot in the cell and reports phantom
  conflicts. Push each conflict error only when the corresponding id is truthy
  AND equal. The `sectionId` arm is what catches a section double-book.
- **`detectTimetableConflicts` must not deref `slot.class`**: section-based
  slots have `classId`/`class` = null. Use the section→class cohort fallback
  (`cohortOf`); a bare `a.class.id` crashes the whole detector. Detail fetches
  are batched (2 queries), not per-conflict.
- **Cross-tenant writes via global-CUID FKs**: `teacherId`/`teacherConstraintId`
  are globally unique, so the FK alone does not enforce tenancy. Verify the
  referenced row belongs to the caller's `schoolId` before any write that
  trusts a caller-supplied id (`upsertTeacherConstraints`,
  `addTeacherUnavailableBlock` do this).
- **`upsertTimetableSlot` ordering**: the existing-row lookup MUST precede
  `validateSlotConstraints` so `excludeSlotId` excludes self — otherwise a
  teacher at max periods can never re-save their own slot.
- **`getChildTimetable` access check**: a guardian-less caller must be DENIED
  (`!guardian → ACCESS_DENIED`); skipping when no guardian record exists is a
  cross-family data leak (was a real hole, fixed 2026-06-12).
- **`detectConflicts` cohort identity** (util.ts): `sectionId ?? classId` —
  bare `classId` comparison makes any two section slots "conflict" because
  `undefined === undefined`.
- **Legacy replay paths**: `importTimetableSlots` + `applyTemplateToTerm`
  still write `classId` (commented at each head). Don't copy their patterns
  into new code.
- **Dictionaries**: slot editor labels live in `school-en.json`/`school-ar.json`
  under `school.timetable.slotEditor` — keep parity when adding keys.

## Related Blocks

- [Catalog](../../catalog/CLAUDE.md) — `provision.ts` consumes
  `calendars.ts` + `structures.ts` for the schedule stage; SubjectSelection
  feeds the generator and the slot editor's subject picker
- [Attendance](../attendance/CLAUDE.md) — consumes slots for teacher
  scoping, period-mode, and current-period auto-selection;
  `markPeriodAttendance` resolves sectionId from `timetableId`
- [Conference](../conference/CLAUDE.md) — `Conference.timetableId` starts a
  live class from a slot; `attachLiveClasses` (`live-class-join.ts`) resolves the
  Join target for the teacher/student/guardian today-cards. Guardian uses
  `getChildTodaySchedule` (mirrors the STUDENT branch of `getTodaySchedule`
  behind the guardian-access gate) so `<LiveJoinButton>` can render on
  `guardian-view.tsx`. Attendance can be auto-marked from a slot's live-class
  presence (conference `attendance-sync.ts`, opt-in).
- Admission — `placeStudentInSection` sets `Student.sectionId`, which is what
  makes the section-based timetable visible to a student

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
