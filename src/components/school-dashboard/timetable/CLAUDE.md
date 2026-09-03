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
- **The today-schedule reports a declared holiday, it does NOT hide the day**
  (2026-08-14): `getTodaySchedule` / `getChildTodaySchedule` return
  `closure: { title, exceptionType } | null` from
  `conference/school-calendar.ts findSchoolClosure`, and the three role views
  render `<ClosureNotice>` above the cards. Blanking was the obvious move and
  is the wrong one: `ScheduleException` rows are typed by hand, so one stale
  row would take a school's whole timetable away with no explanation, and the
  reader could not tell a data error from a real holiday. The conference
  materialization sweep reads the SAME predicate and genuinely suppresses —
  a suppressed write is recoverable, a hidden read just looks broken. Keep the
  asymmetry; keep one predicate. (The header's "No automatic holiday handling"
  note is now half true: reads inform, the weekly grid is still unaware.)
- **Join renders on every Today row, not just the Current/Next card**
  (2026-08-28): `isRowLiveJoinable(startTime, endTime)` in
  `views/live-join-button.tsx` is the per-row gate — in progress, or starting
  within the same 10-minute window. `isLiveJoinable` answers the card's
  question ("is THIS the current/next class?"), which a row in the day's list
  cannot ask. Before this, a student with two online periods saw an Online badge
  on both and a Join button on whichever one the card happened to show. Both
  helpers keep the block's local-vs-UTC convention (browser-local `now`,
  UTC-extracted wall-clock period bounds) — match it, don't fix it in one place.
  The teacher view falls through to `StartLiveClassButton` per row exactly as
  the card does, which matters more now that the materialization cron runs on a
  GitHub Actions bridge: a teacher pressing Start is what brings a class online
  for a school that never turned the online-school policy on.

- **The student view is the grid, and the edge decides who reaches it**
  (2026-09-01): `src/routes.ts` gated `/timetable` to ADMIN/TEACHER/DEVELOPER
  while this block had a complete student lane (`STUDENT: ["view_class"]` in
  `permissions-config.ts`, a `defaultTab="today"` branch, Today/Full tabs) and
  every student surface linked to it — so a student got `/unauthorized` from
  `proxy.ts` before any of it ran. The matrix pointed them at `/my-timetable`,
  which has no page. Fixed with EXACT entries for `/timetable` and
  `/timetable/full`; the `/timetable/*` wildcard stays admin-only because
  `generate`/`settings`/`conflicts`/`analytics` have **no page-level guard** —
  the edge matrix is their only gate, so widening the wildcard opens all four.
  `isRouteAllowedForRole` checks exact before wildcard, which is what makes the
  split hold. At the same time `StudentView` stopped switching on `defaultTab`
  and now always renders `SimpleGrid`: a student has ONE schedule, so Today and
  Full were the same data twice. The Current/Next card stays — `SimpleGrid`
  carries live _indicators_ but no Join, so dropping the card would remove a
  student's only path into a live class. TEACHER and GUARDIAN keep the tab
  split (their views genuinely differ per tab), so the layout hides the two
  non-admin tabs on `role === "STUDENT"` only. `PageNav` paints its bottom
  border even when every item is hidden, so the layout skips the strip
  entirely rather than passing an all-hidden list. The header card (name +
  grade, term badge, subject/period counts, Download) was dropped too, so the
  student page is the heading and the grid — **this removed the student's PDF
  export and Print entries**, which lived only in that card's dropdown
  (`useTimetableExport` is no longer imported here; teacher and guardian keep
  theirs). Browser Ctrl+P still works — `print.css` and the grid's `print:`
  classes are untouched. `termInfo`/`lunchAfterPeriod` still arrive via
  `commonProps` and are deliberately left undestructured. The grid is now
  rendered BARE — no `Card` wrapper — under an AdminView-shaped toolbar
  (`space-y-12` above the grid), so the two surfaces are visually identical.
  The week/day control itself is the PRICING PAGE's billing toggle, reused
  verbatim — `saas-marketing/pricing/billing-toggle.tsx`: a two-column
  `ToggleGroup` with a `bg-muted` thumb absolutely positioned at `start-0
w-1/2` and slid by `translate-x-full rtl:-translate-x-full`. Copy its
  classes exactly rather than approximating; two details are load-bearing.
  `onValueChange` must early-return on a falsy value or clicking the active
  half clears the selection. The two halves are RENDERED FROM AN ORDER ARRAY,
  not hard-coded: the viewport picks `["day","week"]` under 768px and
  `["week","day"]` above it, and the leading entry IS the default
  (`picked ?? ORDER[0]`). Order and default are therefore one fact and cannot
  drift; the thumb slides on `viewRange === ORDER[1]` rather than on a literal
  mode, so it keeps following the active half when the halves swap. The week
  label is its own `studentView.week` ("أسبوع") — a segmented control wants one
  word per half, and `studentView.weekView` ("عرض الأسبوع") stays as it is
  because `layout.tsx` renders it as the teacher/guardian tab. The halves are
  `min-w-[64px] px-3`, NOT pricing's `min-w-[148px] px-6`: 298px of chrome above
  a one-column phone grid was the whole width of the content. 130px total.

- **The grid scrolls on a phone instead of compressing** (2026-09-02,
  `views/simple-grid.tsx`): the scroller (`overflow-x-auto`) was always there,
  but its inner wrapper was `min-w-full` — so nothing ever exceeded the
  container and a five-day week divided a 390px phone into ~65px columns.
  The inner now carries a per-column FLOOR, `min-w-[var(--tt-grid-min-w)]`
  with the variable set inline to `totalCols * 128px`. A floor rather than a
  fixed width is the whole trick: it costs nothing where there is room (a
  laptop's natural column is ~170px, a 2-column day view floors at 256px), so
  one rule covers every viewport and both modes with no breakpoint. It rides a
  CSS VARIABLE consumed by a class, not an inline `minWidth`, precisely so
  `print:min-w-0` can beat it — an inline style could not be overridden, and
  768px of forced width would clip on A4. Verified: mobile week scrolls
  (768px in a 437px box, page itself does NOT overflow), mobile day and every
  desktop width are byte-identical to before. This is the SHARED grid, so
  admin/teacher/guardian get the same relief on a phone.

  The period column then PINS while the days scroll under it —
  `sticky start-0 z-10 print:static` on all THREE first-column cells (header
  clock, break row, period row); miss one and the column tears apart mid-scroll.
  Three details are load-bearing. `start-0`, never `left-0`: in RTL the period
  column sits on the RIGHT and a physical property pins it to the wrong edge.
  `z-10`, because the day cells are `relative` and come LATER in the DOM, so
  they paint over an unlayered sticky sibling. And each pinned cell needs its
  OWN opaque background — the header cell previously inherited its row's
  `bg-neutral-50` and had none of its own, which is invisible until the moment
  it pins and the scrolled columns run underneath it. Like the floor, it needs
  no breakpoint: sticky is inert without a scroll to stick through.

- **The dashboard page heading is display-face on phones only** (2026-09-02,
  `atom/page-heading.tsx`): `max-md:[font-family:'thmanyah_sans',sans-serif]`
  puts the title in the same face the /live and /lumos heroes use, while `md`
  and up keeps `--font-heading` (which `:root[dir="rtl"]` resolves to the serif
  `fontThmanyahText`). This is a SHARED atom — the change lands on every
  school-dashboard AND saas-dashboard title, which was the intent. Two notes:
  the @font-face is declared in `styles/thmanyah-clone.css`, imported by the
  ROOT layout, so the family is already loaded everywhere and this costs no new
  font request; and /live and /lumos each hardcode the family inline
  (`live/landing/status-hero.tsx`, `lumos/courses/content.tsx`) with no shared
  constant, so a third copy now exists — worth extracting if a fourth appears. And in Tailwind v4 `translate-x-*` compiles to
  the CSS `translate` property, NOT `transform` — so `getComputedStyle(el)
.transform` reads "none" on a thumb that is in fact translated, and
  `transition-transform` still animates it (v4 expands that to
  `transform, translate, scale, rotate`). Don't "fix" a slide that is
  already working. The toolbar switches week/day, which narrows the SAME grid to one
  column rather than swapping in another component — `SimpleGrid` already
  handles a 1-length `workingDays` (`grid-cols-2`, `col-span-1` break row). Day
  mode falls forward to the next working day when today is not one, so a
  student opening it on a Friday sees Sunday rather than an empty grid.

- **Identity comes from the SESSION; a caller-supplied id is a question, not an
  answer** (2026-09-02): the web reads were already right — `StudentView` calls
  `getTimetableByStudentGrade`, which resolves `Student` from `session.user.id`
  and ORs `sectionId` with `StudentClass` classIds, and `getPersonalizedTimetable`
  resolves `Teacher.id` (NOT `User.id`) the same way. Two server-side callers
  were not:
  1. **`GET /api/mobile/timetable/:userId` trusted its path param.** It resolved
     the target from `userId` scoped only to `auth.schoolId` and never asked
     whether the CALLER was allowed to see them — so any authenticated pupil
     could walk the id space and read every classmate's week and every teacher's
     schedule. Now routed through `canAccessStudent` (the same helper the other
     eight student-scoped mobile routes use: self, linked guardian, or staff),
     with teachers gated on self-or-staff. Locked by
     `src/tests/app/api/mobile/timetable/user-route.test.ts`.
  2. **`getTimetableByTeacher` gated on `requireReadAccess()`**, which only asks
     "may this role see A timetable?" — so a STUDENT could POST any `teacherId`
     to that server action and get the answer. Now `requirePermission("view_all")`,
     which the matrix grants exactly to the roles that legitimately browse
     someone else's grid (DEVELOPER / ADMIN / TEACHER / ACCOUNTANT / STAFF) and
     withholds from STUDENT / GUARDIAN. `getTimetableByRoom` has the same shape
     and is deliberately NOT changed — a room is not a person — but it is filed.
     The mobile route also read ONLY `sectionId`, so every student whose data
     predates the section-first migration got an EMPTY week. That is the block's
     own "reads OR both axes" rule, broken on the one surface that did not have a
     test.

- **The student's default view follows the viewport** (2026-09-02): a five-day
  grid is unreadable on a phone, so under 768px the toolbar opens on `day`.
  It is DERIVED (`picked ?? (isNarrow ? "day" : "week")`), never seeded into
  state from `matchMedia` — reading a media query during render hydrates
  mismatched, since the server has no viewport. The consequence worth keeping:
  the default keeps tracking rotation until the student picks a side, and their
  pick then wins at every width. Not persisted anywhere.

- **Two traps in that toolbar, both silent** (2026-09-01):
  1. **`sv` is `studentViewUi`, which has NO `today`/`weekView`** — those live
     under `studentView` (what `layout.tsx`'s tabs read). Writing
     `sv?.weekView ?? "Full week"` type-checks, renders, and shows **English on
     /ar** forever. Two sibling dictionary blocks with near-identical names;
     read the JSON before reaching through `sv`.
  2. **`highlightToday` ERASES the subject colour rather than tinting it.**
     `simple-grid.tsx` appends `day === today && "bg-primary/5"` in the same
     `cn()` as `getSubjectTailwind(...)`, and tailwind-merge collapses two
     `bg-*` utilities to the last one. Today's column is therefore grey in
     every week grid in the app, admin's included. Day mode passes
     `highlightToday={viewRange === "week"}` so its single column keeps its
     colours; the week-mode case is left as pre-existing behaviour.

- **Count distinct SUBJECTS, not enrolled Class rows** (2026-09-01): a student
  holds one `Class` row per subject _per section_, so `enrolledClasses.length`
  reported "36 subjects" above a grid holding nine. `getTimetableByStudentGrade`
  now counts distinct subject names across the student's own slots, falling back
  to the enrollment count only when a term has no slots yet.

- **RETIRED 2026-09-02 — "the weekly grid is awareness-only".** That rule held
  while Join lived on the Today cards; removing the student's day list killed
  its premise, and the note above it already said Join would have to move into
  the grid if that happened. It has. The grid now takes an optional
  `renderSlotAction(slot, period)` render prop and all four role views pass one.
  Why a render prop and not `liveJoin` + `lang` + labels + `canStart` props:
  what belongs in a cell is a ROLE question — a student joins, a teacher may
  instead need to START the class — and role logic already lives in the role
  views. `simple-grid.tsx` stays ignorant of Conference entirely.

  The plumbing is `resolveTodayJoinTargets` in `live-class-join.ts` (a plain
  server module, so exporting from it is NOT an HTTP endpoint the way an
  `actions.ts` export is), called by all four weekly reads. It returns
  `timetableId -> LiveClassJoinInfo` for TODAY's slots only, which is why no
  caller needs a day check and why day mode's next-working-day fallback is
  correctly join-free. Both invariants are locked by tests: today-only filtering
  (tiers 2/3 are not day-aware) and `schoolDayOfWeek` over the server's
  `getDay()`.

  **State is a MARK on ONE cell, never a background** (2026-09-03): cells always
  keep their subject colour, and only the cell worth acting on is marked at all —
  `LiveMark` (`views/live-mark.tsx`, an inline ring-and-dot drawn with
  `currentColor`) in the corner, coloured `--live` green running, `--upcoming`
  amber next, `--missed` red gone.

  Three shapes were tried before this one and each failed the same way, which is
  the reason to leave it alone: colouring every online cell's BACKGROUND, then
  blinking them, then marking every online cell with a quiet icon. Every version
  that touched more than one cell turned today's column into a row of identical
  signals and buried the single one that needed acting on. One cell, one mark.

  This replaced two earlier attempts, and the reasons they failed are the reasons
  to keep this shape. Colouring every online cell's BACKGROUND made the column a
  wall of blinking colour that read as decoration and buried the one actionable
  cell. And a background lamp could never win cleanly anyway:
  `getSubjectTailwind` emits `hover:bg-*` and `dark:hover:bg-*` alongside its
  base colour, and tailwind-merge does not collapse a hover variant against a
  base `bg-*`, so the lamp handed the cell back to its subject colour the moment
  the pointer touched it. A foreground mark has none of these problems. Colour
  maps (`LIVE_STATUS_TEXT`) stay static strings — a computed `text-${status}`
  compiles to nothing under JIT.

  **Clicking a cell opens a DIALOG, in both directions** (2026-09-03): an admin
  clicks to CHANGE the slot (`slot-editor-dialog.tsx`), everyone else clicks to
  UNDERSTAND it (`views/slot-detail-dialog.tsx`), and the two deliberately share
  chrome — same `max-w-lg` body, same dot-separated read-only context row —
  because divergent chrome for the same gesture reads as two products.
  `SimpleGrid` takes `onSlotInspect` for the read-only grids, mutually exclusive
  with `onSlotClick` by construction.

  The detail dialog follows the ONBOARDING SUCCESS MODAL, not the slot editor:
  `md:max-w-sm`, `px-8 py-12 text-center`, and a vertical stack — illustration,
  muted caption, prominent value, one action. The illustration is the CDN
  hourglass, an `<img>` rather than an inlined glyph because it is artwork with
  baked-in colours; `asset()` returns an absolute URL untouched, which is the
  documented call-site pattern for a grouped CDN namespace, and it stays out of
  `next/image` deliberately (cdn.databayt.org already sets immutable headers, and
  an 11KB vector has nothing to optimise). It carries NO traffic-light colour —
  the artwork cannot take one, and the state is already on the cell the dialog
  was opened from.

  The dialog is where the per-person answer lives, which is its whole reason to
  exist over a tooltip: `getSlotDetail` resolves the viewer from the SESSION and
  returns their own attendance for that period — a guardian gets their child's,
  a teacher the roster split and whether they have taken it. It also absorbed the
  Join button; the full-cell link overlay it replaced could not coexist with a
  clickable cell. Two traps met while building it: the day name must come from
  `d?.dayNames` (config's `DAYS_OF_WEEK` is English labels for the admin editor
  and printed "Thursday" on /ar), and attendance is only asked for when the slot
  falls on the school's TODAY, so a Thursday cell opened on Tuesday reports
  nothing rather than last week's marks.

  Two consequences to keep in mind. **A cell can show Join with no dot** — the
  dot is gated on `sessionId` (the 08-14 "a standing link is not a session"
  decision) while `LiveJoinButton` also renders tier-3 standing links, which
  have `sessionId: null`. That asymmetry is inherited from the Today rows this
  replaces; do not "fix" it by tightening the grid, or grid-join becomes weaker
  than the rows it replaced. And **the admin cell is itself a click target**
  (it opens the slot editor), so the grid wraps the action in a
  `stopPropagation` span — verified both ways: Join does not open the editor,
  the cell still does.

- **The standing link obeys the online policy; a materialized session does not**
  (2026-09-03): tier 3 of `attachLiveClasses` is the only tier with no
  Conference row behind it, so it is the only one that can outlive the decision
  that created it — a school that switches back to `physical` keeps its
  `ConferenceLink` rows, and every slot of that subject would offer a room
  forever. It is now gated on `resolveOnlinePolicies` (physical → never;
  online → always; hybrid → school default, per-section and per-grade overrides,
  and the go-online window). Gated INSIDE the shared resolver, not in one
  caller, so the weekly grid, the Today cards and the mobile route can never
  disagree — `online-policy.ts` exists precisely because five readers must agree.
  Tiers 1, 2 and 4 are deliberately NOT gated: those are real rows the
  materializer only creates per policy, and online is ADDITIVE — suppressing a
  room someone is sitting in because the school flipped mid-day is the worse
  failure. Do NOT branch tier 3 on `deliversTimetable`/`deliversOpenRoom`; those
  govern materialization SHAPE, not whether a link is usable.

  This is also the answer to "can it be per subject?" — the policy is
  per-section, and subject granularity is already expressed by which
  (section, subject) pairs have links or sessions. No new configuration.

- **The Online marker is gated on `liveClass.sessionId`, not on `liveClass`**
  (2026-08-14): `attachLiveClasses` returns a `liveClass` for a session today
  OR for a recurring default `ConferenceLink`. The link means "there is a room
  you could use" — every school with a standing Zoom URL has one — so badging
  it would stamp "Online" on every card forever in a school that never went
  online. Only a materialized session for today earns the badge. It renders
  BESIDE the room, never instead of it: online delivery is additive, and the
  room is still where the class meets for anyone who can get there.
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
  so the page reflows when data lands.

  It now takes the SAME `workingDays` / `periods` arrays the grid is about to
  receive, instead of the hardcoded 5/7/3 defaults (2026-09-03). Those arrive
  from RoleRouter's `commonProps`, NOT from the slot read, so the placeholder
  can be exact rather than a guess — and it has to be: a phone in day mode
  renders ONE column, and the old fixed five-column skeleton was a 3× width
  error in front of it. Pass `visibleDays` where the caller narrows them; the
  numeric fallback survives only for callers with nothing better.

  Its band heights are MEASURED off the live grid, not derived from padding. A
  real cell's height is driven by its text — a subject wrapping to two lines on
  a phone — which a placeholder cannot reproduce, so matching the classes alone
  still left it 68px short. Header 41/65, teaching row 65/85, break row 68/84
  (mobile/sm+), which brings the settle to ±8px at both breakpoints. Re-measure
  if the cell typography changes.

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
- [Conference](../live/CLAUDE.md) — `Conference.timetableId` starts a
  live class from a slot; `attachLiveClasses` (`live-class-join.ts`) resolves the
  Join target for the teacher/student/guardian today-cards, which also carry
  the `<OnlineBadge>` and `<ClosureNotice>` from `views/live-join-button.tsx`.
  `attachLiveClasses` resolves a Join target most-specific-first: this slot's
  session → this (section, subject)'s session → the subject's recurring link →
  **the section's all-day OPEN ROOM** (conference delivery mode `open`, which
  has neither a slot nor a subject and so needs its own section-level lookup —
  without it those schools had no path from any card to their room). Guardian uses
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
