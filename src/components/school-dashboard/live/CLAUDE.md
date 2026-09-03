# Conference Block

## Context

Video conferencing for schools — one self-contained block at
`src/components/school-dashboard/live/`, mirrored 1:1 to `/live`.
Three meeting back-ends behind one UI: **external pasted-link** (live
everywhere, zero infra), **LiveKit SFU** (in-app rooms + recording — fully
coded, dormant until infra), and **native Meet / Zoom / Teams** (`createMeeting`
wired per vendor API, dark until OAuth creds). Originally built for the Aldar
UAE pilot (Epic 03 — kun.databayt.org/en/docs/aldar): self-hosted SFU on G42
Cloud with TURN-over-443-TCP fallback for UAE VoIP throttling; recordings to
AWS S3 `me-central-1` with PDPL-configurable retention.

> The folder was renamed `live-classes/` → `conference/` and the models
> `LiveClass*` → `Conference*` (DB tables/columns/enums preserved via
> `@@map`/`@map` — zero-change migration). Code symbols and dictionary keys
> still use the `liveClass` / `live_class_*` spelling; the route, block, and
> models use `conference`. The legacy `/docs/live-classes` pages were deleted.

## Before You Start

1. Read `README.md` here for file inventory + routes
2. Read `ISSUE.md` for the open backlog
3. The Prisma models live in `prisma/models/live.prisma` (renamed from
   `live-class.prisma`; `Conference*` model names, DB tables preserved via `@@map`):
   - `Conference` — scheduled or ad-hoc session (`provider`, `meetingUrl?`, `meetingProvider?`,
     `visibility` section|school, `catalogLessonId?` → catalog Lesson)
   - `ConferenceParticipant` — one row per invited user (host / student / observer) + telemetry
   - `ConferenceRecording` — composite Egress recording metadata + S3 location + `expiresAt`
   - `ConferenceEvent` — webhook audit log + `eventId @unique` idempotency
   - `ConferenceLink` — set-once recurring link `[schoolId, subjectId, sectionId, termId]`
   - `ConferenceResource` — attached reference; exactly ONE of `schoolExamId` /
     `schoolAssignmentId` / http(s) `url` per row (ContentOverride pattern)
4. LiveKit lib wrappers in `livekit/`:
   - `client.ts` (singletons + `isLiveKitConfigured`/`getLiveKitReadiness`), `token.ts` (JWT),
     `rooms.ts`, `egress.ts`, `recording-urls.ts`, `webhook.ts`, `room-naming.ts`
5. Link-provider adapters in `providers/` (`types`, `external` live, `google-meet`/`zoom`/`teams`
   wired-but-dark, `token-cache`, `index` registry).
6. The plan: `~/.claude/plans/read-https-kun-databayt-org-en-docs-alda-swift-mango.md`

## Key Decisions

- **Visibility (private/public control)**: `Conference.visibility` —
  `section` (default; roster + guardians, host-only when no section) or
  `school` (any member of THIS school: students PARTICIPANT, guardians
  OBSERVER, staff/accountant PARTICIPANT). There is deliberately NO
  cross-school or anonymous tier. Enforced in `resolveParticipantRole`
  (tokens), `canAccessSession` (recordings + rich detail), and every list
  read (`buildLiveClassWhere` OR, `listForStudent`/`listForGuardian`,
  content.tsx SSR). School-wide sessions notify ALL school users via the hub.
- **A session is the online delivery of a REAL class**: the wizard's first
  field is the timetable-slot picker (`getLiveSlots` → the active term's
  slots, break periods and unassigned/sectionless rows excluded; TEACHERs see
  only their own). When `timetableId` is submitted the SLOT IS AUTHORITATIVE —
  the server re-derives teacher/subject/section from the slot row and ignores
  the client's copies, mirroring `createLiveClassFromTimetable` so the two
  entry points can't disagree. That anchor is what makes a session
  attendance-capable (`syncLiveAttendance` needs sectionId + timetableId)
  and what lights the slot up on the weekly grid (`getLiveClassIndicators` keys
  on `timetableId`). Sessions with no slot stay possible — assemblies, town
  halls, one-off tutorials. The anchor is IMMUTABLE on edit (like `provider`):
  re-anchoring would re-key already-written attendance. **Authority holds for
  the whole life of the session, not just at create**: `updateLiveClass`
  rejects a teacher/subject/section change on an anchored row (re-sending the
  unchanged values is a no-op, since the edit form always submits them).
  Otherwise `sectionId` could point at section B while `timetableId` still
  points at slot A, and the sync would mark B's roster against A's period.
- **The catalog is grade-scoped through the section**: subject options come
  from `SubjectSelection` filtered to the chosen section's `gradeId` (label =
  `customName ?? subject.name` — the school's own name for the subject), and
  catalog lessons are filtered by `Chapter.grades` containing the section's
  `gradeNumber`. `Chapter.grades` defaults to `[]`, so the filter is
  `OR: [{ has: n }, { isEmpty: true }]` — a bare `has` would silently hide
  every not-yet-grade-tagged chapter.
- **`status` is not a create input**: every session is born `scheduled`. A
  client-supplied status would mint a session already `live` (skipping room
  provisioning and the concurrent cap) or `ended`. Transitions go through
  `startLiveClass` / `endLiveClass` / the webhook / the guarded list-layer
  update only.
- **Provider choice lives in the wizard (list layer too)**: `list-actions.ts
createLiveClass` branches on `provider` — `livekit` mirrors
  `actions/sessions.ts` (placeholder → `roomNameFor`, HOST upsert, duration
  cap); `external` keeps the adapter flow + `ext-` roomName. Provider is
  IMMUTABLE on edit (room lifecycle is bound to it). Join is provider-aware
  everywhere: table menu, detail page, and the room route redirects external
  sessions to their vendor URL (after the enrollment-gated read).
- **References**: one `catalogLessonId` FK surfaces the lesson's videos /
  attachments / materials / practice-question count on the detail page
  (`getLessonReferenceContent`); quizzes/exams/assignments/ad-hoc links are
  `ConferenceResource` rows — tenant-verified (`verifyResourceRefs`) before
  write, replace-all on update, "quiz" = `SchoolExam.examType QUIZ`, NOT a
  separate model. Picker data (`getLiveClassReferenceOptions`) is
  staff-gated and fetched per-subject on step entry — never on mount.
- **URLs are scheme-locked**: zod `.url()` admits `javascript:`/`data:` —
  meetingUrl and resource urls additionally require `^https?://` because
  they render as `<a href>` / `window.open` targets. Keep the regex when
  touching the schemas.
- **The form is a 5-step wizard** (`form.tsx` + `form-steps.tsx`) on the
  house stepped-modal idiom (classes/events/invoice): local step state,
  per-step `form.trigger(STEP_FIELDS[n])`, `ModalFooter` step ratio,
  `NONE` sentinel for optional pickers (Radix Select forbids empty values).
- **Room naming**: `sch-{schoolId}-lc-{sessionId}` — globally unique and
  embeds the tenant boundary, so the SFU namespace can't leak across
  schools and the webhook handler recovers `schoolId` from the room name
  alone via `parseRoomName()` (`livekit/room-naming.ts`).
- **The in-room token poll is an ELIGIBILITY HEARTBEAT, not a token pump.**
  Verified against the SDK: `Room.connect` returns early when the room is
  already connected, so the polled token never reaches the live room, and the
  SFU refreshes tokens for reconnects itself over the signal channel
  (`SignalClient.onTokenRefresh`). A call in progress is therefore unaffected
  by the poll failing — so transient failures retry with backoff FOREVER and
  never tear down the call; only a deny verdict ejects. Revocation is
  consequently client-cooperative; deliberate removal (`kickParticipant` → SFU
  evict + `status: "removed"`) is the server-enforced path.
- **Token TTL is 5 minutes** with client-side refresh ~60s before expiry
  (see `room.tsx`). The refresh polls **`GET /api/conference/token`** — a
  route handler, NEVER a server action (auth() rotates the session cookie in
  action requests → every action-based poll ships a full RSC page re-render;
  the notifications-bell rule). The shared logic lives in
  `actions/join-core.ts` (plain `server-only` module): the `joinLiveClass`
  action (initial SSR join, may auto-start as HOST) and the route (refresh
  only, `allowAutoStart: false`) both call it. Refresh re-runs the
  eligibility check, so revoked access takes effect at the **next refresh
  boundary** — revocation latency = TTL (≤5 min), NOT instant. The client
  treats deny codes as immediate ejects and transient failures as quiet
  retries (3× 20s) — an established WebRTC session outlives its token; the
  fresh token only matters for reconnects. LiveKit JWTs are stateless; there
  is no server-side invalidation of an already-issued token.
  `tokenIssuedAt` is reserved for future instant revocation but is not yet read.
- **Role → LiveKit grants** mapping is in `livekit/token.ts`:
  HOST = full + roomAdmin, CO_HOST = publish + subscribe, PARTICIPANT
  = publish + subscribe, OBSERVER = subscribe only.
- **Participant eligibility** is resolved per-join in `actions/tokens.ts`
  by joining Student.sectionId / Guardian.studentGuardians against the
  session's sectionId. No pre-fanout — invitations are lazy.
- **State machine**: `scheduled → live → ended` (or `cancelled` /
  `failed`). State transitions are guarded by server actions in
  `actions/sessions.ts` and return `LIVE_CLASS_INVALID_STATE` on
  violation. The webhook handler is the authoritative writer for the
  `live` and `ended` transitions (room_started / room_finished events).
- **Recording lifecycle**: `pending → processing → ready → expired`. We
  populate `s3Bucket` + `s3Region` on `egress_started` (from
  `getLiveKitConfig()`) so playback can sign URLs as soon as
  `egress_ended` arrives. Retention cron at `/api/cron/expire-live-recordings`
  enforces per-school retention.
- **Recordings live in AWS S3 `me-central-1`** (PDPL via region, not
  premises). Decision locked in plan — escalate if Aldar procurement
  bounces "cloud". Bucket name from `LIVEKIT_RECORDING_BUCKET`.
- **Notifications and attendance sync are best-effort, but must still RUN**:
  dispatched via `after()` from `next/server` in actions, the webhook, and the
  end-stale cron — never a bare `void`. A dangling promise is not guaranteed to
  execute once the response is sent (the platform may freeze the function), and
  `syncLiveAttendance` had NO other trigger: the webhook `room_finished`
  path and its backstop cron were both `void`, so opt-in attendance could
  silently never be written. Failures must never roll back the underlying state
  transition — `after()` preserves that (its callback runs off the response path
  and its rejection is logged, not propagated). See `actions/notifications.ts`.
- **`/live` is one page in two states, not a brochure.** When the school
  teaches online the page is a TOOL: the live / coming-up strip first, then
  what this role can do, plus a readiness band for admins. When it does not,
  an admin gets the pitch and the three setup steps (`get-started-band.tsx`)
  and everyone else gets one honest line — because the old page showed a
  student "turn on online teaching, from settings" on every visit, above their
  own live classes. The sessions table lives at `/live/dashboard`, behind the
  `(app)` route group that supplies the heading + tab strip (`nav.tsx` →
  `list-permissions.getTabsForRole`). Students are deliberately NOT redirected
  past the landing the way lumos redirects them: the strip is section-scoped,
  so the page answers "can I join my class" for them too. Consequences worth
  keeping: start times are formatted in the SCHOOL's timezone on the server (a
  bare `toLocaleTimeString` there uses the runtime's — UTC on Vercel); the
  strip read is wrapped in try/catch so a query failure leaves the page
  standing; and the readiness read is wrapped SEPARATELY so a settings failure
  cannot blank the strip. `getLiveLinkCoverage` RETURNS its failure rather than
  throwing, so check the `success` discriminant — a try/catch alone misses it.
- **The landing hero states the OFFER, not the status (2026-09-01).**
  `landing/status-hero.tsx` is the banner. Its ground is the saas-marketing
  green `#00bc6d`, and the inline-END side carries a TRANSPARENT line
  illustration sitting directly on that green inside the shell's own rounded
  box. Earlier passes tried the reference's arrangement literally — an angular
  field, then a photograph cut on a diagonal — and both broke the ground into
  panels. A mark with no rectangle of its own leaves it whole.

  The file is `public/anthropic/marginalia-media-alpha.svg`, DERIVED, not the
  asset the CDN serves at `anthropic/marginalia-media.svg` (also vendored, and
  byte-identical to the remote). Three edits, all reproducible from the source:
  drop the `#F0EEE6` rect that covers its whole 181x102 canvas, which on this
  ground renders as a cream box rather than artwork; tighten the viewBox to the
  artwork's own 64x64 group, because the source floats a small square in a
  mostly empty canvas and would otherwise scale to nothing; and recolour the
  single solid shape from the source's olive `#788C5D` to `#9FE5B1`, the mint
  the marketing hero highlights its headline with. Olive on this green is a
  muddy near-match. Regenerate the derived file from the source, never by hand.

  The mark is positioned with logical offsets and NEVER mirrored by a
  transform — the same rule the photograph needed, kept because a transform
  here would flip the artwork too.

  The headline is set in **thmanyah sans**, already vendored in `public/fonts/`
  and declared by `src/styles/thmanyah-clone.css`, which the ROOT layout
  imports — so it is available on this page without it loading anything of its
  own. The family ships five weights (300 · 400 · 500 · 700 · 900) and the
  headline uses two: 300 for the sentence, 700 for the phrase carrying it. Do
  not reach for a weight the family does not have (the mark was `font-extrabold`
  = 800): the browser synthesises the missing one and loses the face's own
  drawing, which is the whole reason to set it.

  Everything on the banner is a LITERAL hex and pinned DARK: a brand ground
  does not invert, so a `primary-foreground` token on it would be white in
  light mode and black in dark — exactly backwards. Dark rather than light
  because white on `#00bc6d` measures about 2.5:1, which is why the marketing
  hero pairs this green with black. The panel is hidden below `md`, where the
  card stacks and a 44% panel would sit under the headline.

  The Arabic headline's two rows are width-matched with TATWEEL (U+0640) — the
  same knob the marketing homepage's hero uses, and the only way to stretch an
  Arabic line without distorting the face. Two elongate `تجربة`; four carry the
  join into the final `ل` of `تجعل`. Measured, not eyeballed: 330.9px against
  333.5px, and worth measuring rather than counting, because a tatweel is worth
  ~7px inside the bold run and ~16px inside the light one. Arabic-only, so the
  English string carries none. Re-measure in the browser if the size, the
  measure or the weights change — the fit is specific to all three.

  The hero used to carry the live-now state — an `<h1>` reading "one class is
  live right now", the delivery mode under it and a "Join now" pointing at
  whichever session ranked first. That duplicated the strip immediately below
  it, and worse: the strip names the subject, the section and the time. The
  current class belongs to the strip; the hero says what live classes ARE and
  offers the list. The single state it still branches on is `policy.isOnline`,
  because that changes what the page IS. Consequence: the hero takes no
  session props at all, so `getLiveLandingCounts` lost its only caller — the
  page now runs ONE query for the landing instead of two.

  The type and geometry now follow thmanyah.com's own banner (measured from
  `.clone/thmanyah-home`, node 42): a 1170px card at a 36px radius, 259px tall,
  32px of air under it, a two-line headline of about seven words in a ~420px
  measure at 38px medium with ONE phrase in extrabold, over a white pill with
  dark ink. The emphasis is carried by WEIGHT, not by the mint highlight the
  font.thmanyah.com hero uses — that mark is gone from this banner.

  Two buttons, never more, one word each. Primary is always the sessions
  list; the single alternative is picked by role — schedule (whoever may
  create a class) > recordings (whoever may not, and is likely here for a
  lesson they missed) > settings (an admin who can do neither). An offline
  school gets ONE button, the one that turns it on. Four pills was a menu, and
  the page already carries two — the `(app)` tab strip and the role guide,
  which describes every route this role can open.

  Trimmed further the same day: the eyebrow and, for an online school, the
  supporting paragraph are gone — the block name was already in the page
  heading and the sidebar, and a paragraph explaining the product sat above the
  classes of people who came to join one. An OFFLINE school keeps its sentence,
  because it still has to be told why the page is empty and what turns it on.

- **Role gating lives in `landing/viewer.ts`, once.** `resolveLandingViewer`
  is the single source for who may schedule, configure, host, join, or watch a
  recording. ACCOUNTANT is the awkward one on purpose: it passes
  `read_school_dashboard` and sees every session, but `authorization.ts` grants
  it neither a join role nor `view_recordings`, so the page must not offer it
  either. Covered by `src/tests/school-dashboard/live/landing-roles.test.ts`.
- **The card is FIVE rows (2026-09-02).** Subject · chapter · lesson ·
  teacher · where the class is in its own clock. The heading is the SUBJECT
  alone: it used to be `session.title`, which a materialized session builds as
  "subject · section", so the section repeated on the line below it and the
  heading ran to two lines on a phone for no information.

  Chapter and lesson come from `Conference.catalogLesson`, and NOTHING in the
  product fills that in on its own — a materialized slot knows its subject but
  not which lesson of it today's period covers, because this system does not
  schedule curriculum against dates. Only a teacher anchoring one through the
  wizard sets it. Rows with nothing to say are DROPPED, never rendered empty.
  The demo had one anchored session in eighty-seven, which is why the seed now
  anchors them (`attachCatalogLessons`) — and why that repair runs on the count
  guard's SKIP path too, or an already-seeded school would never receive it.

  The last row's phase (`resolvePhase`, on the page) is resolved on the SERVER
  against the render's `now`: soon · started · ending · scheduled · past, with
  a clamped minute count while a class runs. A client tick would be truer by
  the minute but would put the block's first hydration boundary on a label.
  The honest consequence: a card left open does not re-label itself.

- **The row's byline is TWO stacked rows, with a portrait (2026-09-02).** The
  reference sets the author beside a 24px round photo, then drops the placing
  and the date onto their own line beneath. Ours names the teacher, then when
  the class runs — or that it is running now. Stacking them is load-bearing,
  not decoration: it is what makes the copy column the TALLER of the two, which
  is the proportion the reference's card actually has.

  Because of that, the art is now ONE size for every row — 104px basis, 144px
  from md, 120px of picture — and the lead's old 274/250 is gone. A 250px
  square is taller than four stacked text blocks, which inverted the
  proportion. The lead stays distinguished by spanning the full width while
  the others are halves, exactly as the reference distinguishes its own.

  `Teacher.profilePhotoUrl` feeds the portrait and is USUALLY NULL — one demo
  teacher in a hundred has one — so the two-letter monogram is the ordinary
  path, not an error state. `landingSessionInclude` overrides the teacher
  select to pull that column, for the same reason it overrides `subject`: the
  sessions TABLE renders no imagery and should not pay for it. The portrait is
  hand-rolled rather than the shadcn `Avatar`, which is Radix and therefore a
  client component — this row is pure server composition and a decorative disc
  is not worth the block's first hydration boundary.

- **One article row, two blocks (2026-09-02).** `landing/session-row.tsx` is
  the reference's article row, and both the strip and the past shelf draw it.
  The shelf briefly carried its own near-copy, and within a day the two had
  already drifted — 8px of art-column padding against the reference's 12px,
  `py-2` where the reference pads 4px all round below md — which showed up as
  two different mobile layouts on one page. Add geometry to the shared row,
  never to a caller. The `size` prop is now THREE weights — "lead" | "brief" |
  "small" — and the third one is ours rather than the reference's: see the
  entry below.

- **The strip is ONE lead card and two brief ones (2026-09-02).** The lead is
  whatever is live, or the next class to start, and keeps every row. The two
  under it are `size="brief"`: TWO text rows, the subject with its badge and
  then one meta line. Chapter, lesson and the portrait come off, and a running
  brief row says "started" without the minute count.

  The hierarchy is bought by SIMPLIFYING the neighbours, never by decorating
  the lead. That is a deliberate constraint, not an accident of this pass:
  three cards of equal weight made the class running right now exactly as easy
  to miss as the one starting in two hours, and the fix for that is contrast,
  which you get either by inflating one card or by quietening two. Inflating
  was tried the same day and is recorded above — the lead's 274/250 art turned
  the picture into the row. Do not reach for it again.

  The badge stays on the TITLE row for every weight, brief included. It was
  moved down into the meta line first, and on a phone an admin's line then
  carried a name, a section and a clock, and truncated the first two into
  ellipses at once. Up on the title row it costs no vertical space and leaves
  the meta line two items, which is what fits a 254px copy column.

  The row now has only these two weights. A third, `small`, existed for the
  shelf below; that shelf draws a card of its own now, so it went with it.

- **A card says what the ROLE does not already know (2026-09-02).**
  `showsTeacher` / `showsSection` on `LandingViewer`, resolved once in
  `landing/viewer.ts`:
  - a TEACHER's strip is already narrowed to the classes they teach, so their
    cards name the SECTION and drop the teacher's name — their own name is the
    one word on the card that could tell them nothing;
  - a STUDENT's rows are all their own section, so theirs badge the GRADE and
    name the teacher;
  - ADMIN · DEVELOPER · STAFF · ACCOUNTANT · GUARDIAN read across sections and
    get both.

  `showsTeacher` is keyed on `teachesEveryRow`, which the PAGE passes after it
  has resolved a `Teacher` row — NOT on the role. `Conference.teacherId`
  references `Teacher.id`, so a TEACHER account with no teacher row falls
  through to the whole-school scope, and a card that dropped the name there
  would be hiding whose class it is. That is why `resolveLandingViewer` takes a
  second argument and the page re-resolves the viewer inside the try block.
  Covered by `landing-roles.test.ts`.

- **The second shelf is CATCH UP — the classes you MISSED (2026-09-02).**
  `landing/catch-up-shelf.tsx`. It began as a "past classes" shelf in
  thmanyah.com's shelf geometry: two ended sessions in a list column beside a
  grid of six subject tiles. Two things were wrong with that, and both are why
  this section exists in its current form.

  It consulted nothing about the reader. A student who had sat through every
  class that week saw exactly what a student who had missed it saw. So the rows
  are now filtered by PRESENCE: `getLiveLandingCatchUp` drops any session the
  reader actually joined. Presence, not `Attendance` — a `ConferenceParticipant`
  row carries `joinedAt` only once someone reached the room, and rows are
  created lazily at join time rather than fanned out to a roster, so "no row
  with a `joinedAt`" IS the signal. `Attendance` would have been the wrong
  source twice over: it is written only by schools that turned
  `conferenceAttendanceSync` on, and only for LiveKit sessions.

  Whose presence counts is `resolveCatchUpAttendees`, and it is not always the
  reader's: a GUARDIAN catches up on what their CHILDREN missed, so the filter
  runs on the wards' user ids and falls back to the guardian's own only when
  there are no ward rows — an empty list would disable the filter entirely and
  turn "what my child missed" into "everything that ended". A reader who joins
  nothing, which is every administrator, matches nothing and gets the shelf
  degraded to "recently taught". That is honest rather than clever, and it is
  why the heading is not a promise (see below).

  And the tiles answered the wrong question. They showed the SUBJECTS that had
  taught live — a thing an admin might wonder and a student never does — so
  they are gone, and with them `LandingSubjectTile`, the 24-row over-fetch that
  fed the dedupe, and the second column.

  What replaced them is ONE horizontally scrolling row of up to twelve cards,
  on the house scroller (`no-scrollbar` + negative margin + matching padding),
  the same markup lumos uses for its course shelves. A shelf you scroll is the
  right shape for a backlog: it holds twelve without pushing the page down, and
  its form says there is more to the side. `overflow-x-auto` follows the
  document's `dir`, so RTL needs no transform — do not add one.

  The card offers the RECORDING when there is one: `landingSessionInclude`
  takes at most one `ready` recording (never `pending` / `processing` /
  `expired` — those have no S3 object behind them), and the card links to
  `/live/[id]/recordings` instead of the session page, gated on
  `viewer.canViewRecordings` so ACCOUNTANT is never offered a link the
  permission layer would refuse.

  Recordings are still not what the shelf IS. Every recording surface here is
  gated on `isRecordingConfigured()`, and a school with no bucket has none at
  all — a recordings-only shelf would be permanently invisible. An ended
  session exists the moment the room closes and links to the lesson's materials
  either way.

  Gated on the ROWS, never on `policy.isOnline`: a school that has gone back to
  the classroom still has classes it taught online. An empty shelf is also a
  real answer — a student who missed nothing is shown no heading saying so.

- **The catch-up shelf's heading is an ICON (2026-09-02).** No title, no "more"
  link. Every card under it carries a past date, so a printed "Catch up" was
  labelling what the reader could already see, and the "more" link pointed at
  the sessions table that the banner above already offers twice. The words
  survive as an `sr-only` `<h2>` — a section of links with no accessible name
  is a real regression for a screen reader, and the dictionary key stays for
  it. Consequence worth knowing: `landing.catchUp.title` is now invisible to a
  sighted reader, so nobody will notice if its translation rots.

- **Under the shelf: TWO recordings, ranked for the reader (2026-09-02).**
  `landing/recordings-grid.tsx` + `getLiveLandingRecordings`. The shelf above
  says what you missed; this says what you can actually WATCH about it. Two
  wide cards, not a second scroller — a dozen things to watch is another
  backlog, and a backlog is what the reader arrived with.

  Relevance is two rules and both are PER-READER: a recording of a class this
  reader missed outranks one of a class they sat through (the recording of a
  lesson you attended is a revision aid; of one you missed, it IS the lesson),
  and recency breaks the tie. Two students in the same section see different
  pairs.

  The miss cannot be a `where` here the way it is on the shelf. A reader who
  missed nothing would then be offered NO recordings, when what they want is
  simply the most recent — so the presence check comes back as a per-row PROBE
  (`participants` include, `take: 1`) and the ranking happens in memory over an
  over-fetched candidate set. The page must also preserve the QUERY's order
  when it maps the localized rows back: filtering `localizedRows` instead would
  silently replace the ranking with recency alone.

  `status: "ready"` only, and `viewer.canViewRecordings` gates the card's link
  — ACCOUNTANT sees every session but `authorization.ts` grants it no
  `view_recordings`.

- **The demo seeds recordings now, and only because it can do it honestly
  (2026-09-02).** The seed's standing rule was to write NO `ConferenceRecording`
  rows, because a `ready` row with no S3 object behind it is a player that
  spins forever. That reasoning is intact; `seedRecordings` satisfies it by
  pointing every row at the `storageKey` of a `Video` the demo already holds,
  and writing nothing at all when the school has none. Four rows, and which
  four is the point: two on classes the demo student MISSED and two on classes
  they attended, with the attended pair deliberately more RECENT — a fixture
  where every recording is missed would let the ranking above break silently.

- **`landing/session-card.tsx` is the card, drawn by both shelves
  (2026-09-02).** The strip's `session-row.tsx` sets a class beside its
  picture; this sets it under one. Two callers — the catch-up shelf and the
  recordings grid — for the same reason the article row has one implementation:
  the shelf and the strip had drifted within a day of being written twice.

- **The strip under the banner has no heading (2026-09-02).** The reference's
  block there is article rows and nothing else, so `liveTitle` / `upcomingTitle`
  as `<h2>`s and the "view all" link are gone. What they carried moved into the
  row: a live class says so where the reference prints its byline, a scheduled
  one prints its time. The full list stays one click away from the banner.

- **The page's imagery is catalog data, not decoration.** `Subject` IS the
  catalog subject (`concept` · `thumbnail` · `color`) and `Conference.subjectId`
  points straight at it, so session cards carry their subject's real artwork
  through `getCatalogImageUrl` with the subject's colour as the ground. That
  helper returns null when CloudFront is unconfigured, which is a NORMAL state
  — the colour fallback is a first-class path, not an error placeholder. The
  previous stock photo and the vendored Google Meet artwork are gone.
- **Bare room layout**: full-screen LiveKit UI lives under
  `src/app/[lang]/s/[subdomain]/(live-room)/` (NOT under
  `(school-dashboard)`) so it can use a minimal layout without sidebar.
- **Two permission/validation layers, on purpose**: the _rich sessions layer_
  (`authorization.ts` · `validation.ts`) is the strict
  runtime gate for the LiveKit room flow (join / token / start / end); the
  _list layer_ (`list-permissions.ts` · `list-validation.ts` · `list-actions.ts`)
  is the CRUD gate for the dashboard table + external-link sessions. They diverge
  deliberately (list `WRITE_ROLES` is broader). Don't collapse them.
- **Provider abstraction**: link providers live in `providers/` behind a single
  `LiveProviderAdapter`. `external` is the floor; natives create real
  meetings via vendor APIs but persist as `provider="external"` +
  `meetingProvider="<id>"` → **no enum migration**. LiveKit's SFU lifecycle is
  intentionally OUTSIDE this layer (room-based, not link-based).
- **Per-section recording opt-out**: `setSectionRecordingOptOut` (`actions/settings.ts`)
  overrides the school-wide `conferenceRecordingDefault` per section.
- **Docs structure is component-driven**: the `## Structure` section of
  `content/docs-{en,ar}/live.mdx` renders `<LiveStructure />` from
  `src/components/docs/live-structure.tsx` (registered in `src/mdx-components.tsx`).
  When you add/rename block files, update that component's node tree — NOT a code
  fence in the mdx.

- **Online is ADDITIVE, never a closure.** Turning a class online does not send
  the building home: a school can be physically open and online on the same
  day, online on Sunday and in person on Monday, or online for one section and
  not another. Nothing in this block ever cancels a physical class — it decides
  whether a live channel is opened ALONGSIDE it. That framing is what makes the
  policy a union rather than a precedence contest:

  ```
  online = sectionOverride ?? (schoolDefault || windowActive)
  ```

  The window sits INSIDE the inherit deliberately. It is a temporary lift of
  the school-wide DEFAULT, so the tri-state rule survives verbatim — an
  explicit `Section.conferenceOnline` still wins in both directions, even
  mid-emergency.

  Do NOT "fix" this by moving the window outside the inherit. That makes a
  closure override a decision someone deliberately made about a section, and it
  was rejected on exactly those grounds. An admin who wants a held-back section
  online during a closure clears its override — the control they already have.

- **The emergency window is day-granular and open-ended.**
  `School.conferenceOnlineFrom` / `…Until` / `…Note`. `from` is REQUIRED for a
  window to exist; `until` may be null, meaning "until further notice" — the
  shape an emergency actually has, since nobody knows on day one when the roads
  reopen. Both ends are INCLUSIVE, compared as the school-calendar day
  CONTAINING the stored instant. Clearing `from` clears the whole window, which
  is how a school comes back off the switch: there is deliberately no separate
  "cancel closure" verb to forget to call. An `until` with no `from` is NOT a
  validation error — it simply describes no window, and the action drops it
  (rejecting it turned "the admin cleared the start date" into an unexplained
  save failure, at precisely the wrong moment).

- **Window days travel as `"YYYY-MM-DD"` strings and are stored at NOON school
  time.** A `Date` on the wire is parsed as UTC midnight and lands on the
  PREVIOUS day for every school west of Greenwich. And midnight is the wrong
  storage instant even once converted: any later rounding or offset read can
  push it across the date line, silently moving the window by a day. Noon is
  ~12 hours from either boundary, so the day round-trips under every offset on
  earth (`schoolDayToInstant` / `schoolDayOfInstant` in `day-window.ts`; the
  zero-padded strings also compare correctly with `<`/`>=`, which is why the
  schema's ordering refine uses no `new Date()` at all).

- **Delivery mode is orthogonal to being online.** `ConferenceOnlineMode` on
  the school: `timetable` (a session per slot, bounded by the period — the
  strict version), `open` (one standing room per section for the whole teaching
  day, no period boundaries — the loose version), `both`. Read the STORED
  column when branching, not a resolved `policy.mode`: that field is pinned to
  `timetable` whenever the particular answer came back offline, so a school
  online only through per-section overrides would lose its mode.

- **"Already over" is compared against the CLOCK, never against `ctx.date`.**
  Both materializers take a target `date`, and every caller passes it carrying
  the current time-of-day. `materializeOpenRoom` compared its `dayEnd` to
  `ctx.date` and so refused to build ANY future day once the wall clock passed
  the last period's end — a 15:20 run would not build tomorrow's rooms because
  tomorrow's classes end at 12:10. The cron passes `date = new Date()`, which
  makes the two coincide, so nothing caught it until the resolver was run
  against real data for a future day. Use `Date.now()`, as
  `materializeSlotSession`'s `period_over` already did.

- **An open room is an ordinary slot-less session** (`actions/open-room.ts`),
  not a new concept: `timetableId: null`, `subjectId: null`, a section, and a
  schedule spanning the first period's start to the last period's end (falling
  back to the whole calendar day when the school has no bell schedule — a
  school with no periods is precisely the one most likely to want loose
  delivery). Three consequences, all intentional: it cannot write period
  attendance (no `timetableId`); it cannot draw on `ConferenceLink` (keyed on
  subject) so an external one depends entirely on the school's standing link;
  and its host is `Section.homeroomTeacherId` — a section without one is
  skipped with `no_teacher`, because `Conference.teacherId` is required and
  there is no slot to borrow a teacher from. Identity is the deterministic
  tuple (section, no slot, no subject, exact start), not a unique constraint.

- **`School.conferenceFallbackUrl` is what makes the switch mean anything.**
  Prod has no SFU, so an emergency school degrades to `external` — and an
  external session IS its link. Before the fallback, every (section, subject)
  without a `ConferenceLink` was skipped with `no_link` into a cron log, so a
  school that flipped online overnight materialized NOTHING and had no way to
  find out. `getLiveLinkCoverage` now names the uncovered pairs on
  `/live/settings`. It is ONE SHARED ROOM across every pair that falls
  back to it — say so in any copy you write; per-section links stay the private
  option.

- **Rooms and recording are SEPARATE gates.** `isLiveKitConfigured()` needs
  `LIVEKIT_HOST` / `LIVEKIT_WS_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`;
  `isRecordingConfigured()` needs `LIVEKIT_RECORDING_BUCKET`. The bucket used to
  live in `REQUIRED_ENV`, which meant the whole video feature stayed dark until
  someone provisioned S3 — an optional add-on gating the core feature. Guard the
  egress paths on `isRecordingConfigured()` (webhook `room_started`), never on
  the room gate: starting an egress that cannot upload fails asynchronously on
  the SFU side and strands a `ConferenceRecording` row at `pending`, which
  nothing sweeps. A managed SFU (LiveKit Cloud) has no instance IAM role, so the
  empty-credential fallback in `egress.ts` does not save it — set
  `LIVEKIT_S3_ACCESS_KEY`/`SECRET` whenever you set the bucket.

- **The materialization sweep runs on GitHub Actions, not Vercel Cron.**
  `vercel.json` is `"crons": []` (free-plan bridge, `DEPLOYMENT.md`), and
  `live-class-reminders` is the ONLY caller of `materializeOnlineSchools()` — so
  with it off an online school materializes nothing after the day an admin saved
  its settings. `.github/workflows/live-crons.yml` restores the three
  conference jobs and nothing else. Delete it when the Vercel cron array comes
  back, or they fire twice. `process-email-notifications` is deliberately NOT in
  the bridge: it drains ~19,996 unsent emails with no age gate.

- **Only the `started` notification links to `/room`.** `startingSoon` fires 5–20
  minutes BEFORE the class, and `join-core` refuses a non-HOST on a `scheduled`
  session (`LIVE_CLASS_INVALID_STATE`) — a student following an early room link
  would land on an error, not a waiting room. `scheduled` / `cancelled` /
  `recordingReady` describe the session rather than an open room, so the detail
  page is right for them.

- **`metadata.url` on a notification is stored RELATIVE.** It used to be
  absolutified at dispatch time into `{subdomain}.databayt.org` — the wrong host
  for every school on `balqalam.com`, and one that does not serve this app. The
  in-app bell reads the same field, so a stored cross-root URL navigated the
  reader off the product entirely. The email channel absolutifies at render time
  (`email-service.ts`), where a canonical host is actually needed;
  `notifications/card.tsx` additionally treats any host under one of our
  `ROOT_DOMAINS` as internal, which repairs rows written before the change.

- **Attendance needs a DURATION, not a ping.** `MIN_PRESENCE_MINUTES` (5) in
  `attendance-sync.ts`. Compute it as `(leftAt ?? scheduledEnd) - joinedAt` —
  never from `durationSeconds`, and never treating a null `leftAt` as a
  zero-length visit. The webhook writes `leftAt` on `participant_left`, the sync
  runs from `room_finished`, and the two have no guaranteed order: the student
  most likely to have a null `leftAt` is the one who stayed to the end, so the
  naive read marks exactly the wrong person absent.

- **A no-show online class does NOT mark its roster absent** (decided 2026-08-28,
  closing the open question in ISSUE.md). The sync only ever runs from
  `room_finished` or a session stuck in `live`, so a class that never started
  writes nothing — and that is correct. A materialized session nobody attended
  means the class did not happen; marking 25 students absent for it would be a
  data-integrity bug wearing a feature's clothes. Do not "fix" the gap by having
  the end-stale cron sync cancelled sessions.

- **`createLiveClass` checks the provider server-side.** The wizard's
  `disabled: !liveKitAvailable` is a CLIENT gate and a server action is a public
  endpoint; without the check a crafted POST mints a `livekit` row against an SFU
  that does not exist, which then fails at start/join time and reads to a teacher
  as a broken class rather than an unavailable option.

- **The demo seed repairs before it seeds** (`prisma/seeds/live.ts`,
  2026-08-29). A slot without a teacher has no HOST and is invisible to the
  materializer, and the demo had 719 of them: `seedTeacherSubjectExpertise` is
  count-guarded, so every `SubjectSelection` added after it — per-grade catalog
  rows, ten "Math"s — had no qualified teacher and the generator correctly
  emitted teacherless slots. The seed tops expertise up and backfills teachers
  (qualified, free at that day/period, under 25/week, never moving an existing
  assignment), routing `teacher@balqalam.com` onto `student@balqalam.com`'s
  section so the documented trio works. It mirrors the materializer's identity
  rules rather than importing it — the materializer is `server-only` — and
  every write carries `select: { id: true }` (prod lacks `schools.trialEndsAt`;
  a select-less write returns every column and P2022s).

- **A CONFIRMED substitute hosts the online arm.** `resolveSubstitutes`
  (materialize-day.ts) swaps the HOST for today's slots; `getTodaySchedule` /
  `getChildTodaySchedule` swap the displayed teacher and move the card to the
  substitute's day. CONFIRMED only — a pending request is still the absent
  teacher's class on paper. The weekly grid is deliberately untouched: it shows
  the pattern, and a substitution has a date.

- **An open room falls back to the section's busiest teacher.** The real
  onboarding path (`autoProvisionSections`) never writes `homeroomTeacherId`
  and no UI does either, so `open` mode materialized zero rooms for every real
  school and said so only in a cron log. `fallbackHost` picks the teacher with
  the most slots on the section this term, deterministically.

- **Rooms and recording are honest on every surface.** `isRecordingConfigured()`
  reaches both create forms (checkbox hidden, a note in its place), the
  settings switch (a note when on without a bucket) and the detail label ("Not
  available"). The stored preference is untouched — the day a bucket lands,
  recording starts with no re-setup.

## Delivery mode (2026-08-30)

`School.conferenceDeliveryMode` — physical / online / hybrid — is read FIRST by
`effectivePolicy`. Never branch on `conferenceOnlineDefault` outside hybrid;
never write `conferenceOnlineDefault` or the window except through
`updateLiveSettings`, which derives them from the mode. Any select that
feeds the policy engine must include `conferenceDeliveryMode`
(`ONLINE_POLICY_SELECT` does). The settings UI is ONE server component
(`settings-panel.tsx`) mounted from both `/live/settings` and
`/school/configuration/live-classes` — add fields there, not in a page.

## Room configuration (2026-08-30)

`RoomJoinTicket.roomConfig` is the ONLY way school/session configuration
reaches the room client: join-core resolves `joinMuted` (session override ??
school), the five tools, the consent note and whether the session records.
Add a room-level setting there, never as a second fetch from the room page.
Student screen share is enforced in the token grant (`canPublishSources`);
the other tools are UI switches. Guardians are refused in join-core when
`conferenceGuardiansObserve` is off. The reminders cron applies
`conferenceReminderLeadMinutes` per school over a [1, 60]-minute scan.

## Protection policy (2026-08-30)

Videos, recordings and materials are VIEWED, never downloaded, and every
surface that shows them carries the forensic `VideoWatermark`: the lesson
player, the recording player (`recording-player.tsx`), the in-app material
viewer (`lumos/shared/material-viewer`), the room stage and the slides. Do not
add a download route, a `Content-Disposition: attachment` path, or a
`<video>` without `controlsList="nodownload"` + `disablePictureInPicture`.
Screenshots cannot be prevented on the web; the watermark makes them
attributable, PrintScreen blanks the frame and clears the clipboard, and a
hidden tab pauses playback.

## The room opens on a title card (2026-09-03)

`room/title-card.tsx` + `lumos/shared/title-card/`. A class is now a CARD
first — subject artwork edge to edge, a grade badge, the subject as the
heading, the teacher under it, section · chapter · lesson, the time, and one
white **Join** pill — and only becomes a call when that pill is pressed.

**The ticket is minted on Join, never on page load.** This is the load-bearing
part, not the picture. `joinLiveClass` as HOST is not a read: it opens the SFU
room, flips the session to `live`, stamps `actualStart` and writes the
`ConferenceParticipant` row that presence — and therefore the catch-up shelf's
"did you miss this" filter — is later read from. The page used to call it
server-side, so a teacher who opened the tab to glance at a class had already
started it and marked themselves present. Putting a card in front of that
without moving the call would make the card a lie.

What stays on the server is the ELIGIBILITY gate: the page still runs
`getLiveClass`, which is enrollment-gated, and renders the plain refusal when
it says no. Offering someone a Join button that can only ever refuse is worse
than refusing up front. A refusal from the JOIN itself (a student on a
`scheduled` class, the concurrent cap) renders UNDER the pill with the card
still standing — the reader needs to know why while still looking at the class.

Consequences worth keeping:

- The token-refresh heartbeat is gated on `ticket != null`. Nothing expires
  while you sit on the card, because nothing has been issued.
- `JOIN_ERROR_CODES` lives in `room/join-errors.ts`, a PLAIN module. It was in
  `room.tsx` first, which is `"use client"` — a Server Component importing a
  value from a client module gets a client-reference proxy, and the page threw
  "JOIN_ERROR_CODES is not iterable" at request time with nothing said at build
  time. The page turns those codes into a `Record<string, string>` because a
  resolver FUNCTION cannot cross the boundary either.
- The card's data comes from `findRoomCardSession`, which reuses
  `landingSessionInclude` rather than adding a third select — same facts about
  the same row as the landing cards, so they cannot drift apart.
- Content follows the landing card's recorded rules: heading is the SUBJECT
  alone (`Conference.title` is "subject · section" and would repeat the section
  below it), the grade comes off `Section.grade` and never out of
  `Section.name`, and a row with nothing to say is dropped rather than rendered
  empty. Chapter and lesson are absent on most sessions by design.
- Times are formatted on the SERVER in the school's zone; catalog and roster
  names go through `getLabels` / `getName` in one batched call each.
- The play glyph is NOT mirrored under RTL — the reference's own Arabic hero
  points it the same way, because play reads as forward in TIME.

**The mark row is the lesson hero's, verbatim and on purpose (2026-09-03).**
`4K` filled, then `Free` · `CC` · `AD` outlined, after the time and duration —
the same four boxes the lesson prints about its video. Three of them are not
yet true of a live room: the host publishes 720p, there are no captions and no
audio description. They are here as the SHAPE, landed first at Abdout's
direction, with the class's own marks to follow. When you replace them, the
honest sources are `School.conferenceTool*` for the interaction tools and
`Conference.recordingEnabled` for recording; the school select in the room page
is where those would join the card's data.

**The Join pill has two forms, like the hero's Play pill.** A class that has
not started gets the plain one; a class already running gets the resume pill —
`px-5`, a progress track, the remaining figure, and NO word, exactly as the
hero drops "Play" once it has progress to show.

`formatRemaining` mirrors the hero's helper minute for minute: `1h 5m left`
at an hour or more, `30m left` below it, and `0m left` at zero. The zero case
is the point. It printed "ending now" for a day, which is a different KIND of
label from the figure beside every other value, so the chip changed shape in
the last minute of a class — the reference never does that, and a number
running down to zero is what makes the chip readable as a countdown. Ours is
translatable, unlike the reference's, which hardcodes its English and prints
"10m left" on an Arabic hero. `useClassProgress`
ticks it every 30s. The landing cards deliberately resolve their phase on the
SERVER and accept going stale, because a clock would cost that block its first
hydration boundary; this card is already a client component (it has a Join
button), so the tick is free here and a bar frozen at render time would be
worse than none. Elapsed and remaining are durations between two absolute
instants, so a skewed device clock shifts both equally and changes nothing —
which is why `startsAtMs` / `endsAtMs` cross as NUMBERS while the printed start
time stays a server-formatted wall-clock label in the school's zone. `now` is
seeded in an effect, never during render, or the markup would not match what
the server sent.

**The button row is the hero's row, not a variation of it.** The pill sits
DIRECTLY in the frame's `mt-4 flex items-center gap-3`, with the round glass
button beside it — a flex column wrapped around the pill (which is where the
join refusal lived first) changes how the pill sizes and the row stops matching.
That is why `TitleCard` grew a `note` slot: anything under the buttons gets its
own line beneath the row rather than restructuring it.

The round button is the hero's watchlist toggle's slot. A class has no
watchlist, so it carries the nearest real second action instead: a link to a
recording of THIS class, shown only when `landingSessionInclude`'s probe finds
a `ready` one (never `pending` / `processing` / `expired` — those have no S3
object) AND the viewer passes `view_recordings`, which ACCOUNTANT does not
despite reading every session. No recording, no button.

**The phone values come off the Figma frame with a pixel ruler, not by eye
(2026-09-03).** `Hogwarts` → node `574:30`. Measured, and worth keeping:

| what             | value                              |
| ---------------- | ---------------------------------- |
| side padding     | 16px                               |
| button           | 42px tall, 8px radius, `#F2F2F7`   |
| button gaps      | 16px above and below               |
| marks            | 13px box, 11px type, 6px apart     |
| marks + meta ink | `#8D8D93` / `#8E8E93` (systemGray) |

Three of those had been eyeballed wrong. The button was a PILL — the reference
is a rounded rectangle, and at 42px tall that is not a subtle difference. The
marks and the meta line were WHITE — the reference sets both in systemGray and
spends white on the title, the description and the buttons; a row of white
boxes under white copy flattens the block into one grey mass. And the filled
mark (`4K`) is a GREY fill with black type, not a white one.

The literal hexes are deliberate. This surface is pinned dark, so a
theme-aware token would invert the button in light mode — exactly backwards
over artwork. Same reasoning the marketing banner's record gives.

The meta line also absorbed the time and the duration. The reference puts
genre, date and runtime in ONE dot-separated sentence above the button and
leaves the mark row holding only boxes; ours had the clock sitting in with the
marks. And the mark row is start-aligned while the title above it is centred —
that mix is the reference's, not an oversight.

**The card is a SECTION of a scrolling page, not a screen (2026-09-03).**
The frame's first block is 646px tall on a 390px frame and the page carries on
past it into more blocks. So the poster is `aspect-[4/5]` — 390x487.5, the
frame exactly — the stack flows after it, and the `(live-room)` layout is
`min-h-dvh` rather than `h-dvh overflow-hidden`. The in-call view sets its own
`h-dvh`, which is what still pins the ROOM to the viewport. More sections are
expected below the card; the ground under it is deliberate, not a gap.

Locking the card to the viewport is what put the title 269px below where the
frame puts it, and it is the single biggest thing that was wrong.

**The stack is TWO text rows, a button, a paragraph, then marks.** The frame's
order, and the reason the grade badge and the quill byline came off the room's
card: it has a title and ONE dot-separated info line above its button, not
four rows. Section, start time and duration go in that line — three items, as
the frame has three, because six wrapped it onto two lines. `Section.name` is
already "Grade 10 - A", so the grade would repeat it. The teacher, the chapter
and the lesson moved into the paragraph, which is where the frame puts its
narrator too.

**The identity is a fixed 80px BAND, bottom-anchored** (`-mt-[108px]` on
`h-20`, `justify-end`). The frame runs its title and info line from y=380 to
459 under a poster ending at 487.5. A constant pull-up on the block's TOP was
right only for the rows it happened to have that day and moved 90px the moment
the badge and byline came off; anchoring the band's FOOT is height-independent.
Taller content overflows upward into the fade, where there is room for it.

Measured after: poster 488, info bottom 460, button 476, paragraph 534 —
every one within a pixel of the frame.

**On a phone the card is the reference app's PHONE page (2026-09-03).** Not
the wide card scaled down — a different arrangement, in the same DOM, switched
at `sm`. Title, byline and meta CENTRE over the artwork; below them a solid
black shelf carries a full-width button with the mark row under it, and the
order of those two flips back above `sm`. The wide layout is untouched.

It also grew the reference's top bar: `‹ Back` on the inline-start side and
the secondary action on the end. Two consequences worth knowing. Back is a
`Link` to the class page, never `router.back()` — a student who arrived from a
notification has no history to go back to, and the room had no way out but the
browser button. And the recordings link MOVED there from beside the pill, at
every width, which is what leaves the button free to run the phone's full
width; the wide layout changed with it.

The chevron carries `rtl:-scale-x-100` while the play triangle does not. That
is not an inconsistency: a chevron points through the READING order and must
mirror, a play glyph points through TIME and must not.

**The frame is shared, not copied.** `lumos/shared/title-card/` holds the
Apple-TV frame (artwork · bottom-anchored fade · badge / title / byline / meta
/ chips / pill) plus the class strings for each part; the lumos lesson hero and
this card both draw it. The hero was inline in
`lumos/dashboard/lesson/content.tsx` and was lifted out verbatim — verified by
pixel-diffing the lesson page before and after. Add geometry to the shared
frame, never to a caller; this block's own records already show what happens
otherwise (the landing strip and the past shelf drifted within a day).

## The room's chrome is the lumos player's glass (2026-09-03)

`lumos/shared/video-player/glass.ts` is the single source for the dark
translucent surface (`rgba(20,20,20,0.4)` + `backdrop-blur-[40px]`), the pill,
the menu and the bottom scrim. The player and the room import it; the two
copies that used to live in `video-overlay.tsx` and `video-player.tsx` are
gone.

The room is now one full-bleed black stage with everything floating on it —
title and quality on a start-side pill, moderation and the attendance note on
the end side, status as centred notices, and the controls over a bottom
gradient. The header and bar used to be flex rows that ate ~110px of a phone's
height before a single face was drawn.

Two things to preserve:

- **The control bar is TWO clusters, and the coarseness is deliberate.** What
  you do with yourself and the stage, then what you do with the class. A
  cluster cannot split, so four finer pills wrap to a THIRD row at 390px.
- **The stage's bottom reserve is MEASURED, not a constant.** A `ResizeObserver`
  on the controls feeds `paddingBottom`. The bar is one row on a laptop, two on
  a phone, and two on a laptop the moment the side panel narrows the stage — so
  any hard-coded reserve is wrong on some real screen, and being wrong means
  LiveKit draws its bottom row of faces underneath the controls.

The `(live-room)` layout now cancels the root `layout-container` gutter
(`margin-inline: calc(-1 * var(--container-px))`, the same escape the thmanyah
clone uses). That 32px of page ground was easy to miss on a black room; under
the card's artwork it read as a white frame around the picture.

Do NOT restyle LiveKit's own tiles with these tokens — the glass is for our
chrome, the tiles are the SDK's.

## The in-call chrome is the player's phone layout (2026-09-03)

The room after Join wears the lesson player's PHONE chrome — the iOS video
player frame in the Hogwarts Figma (node 605-7): a glass pill at the top
start, one at the top end, and one glass card along the bottom holding the
scrubber, the clock and a row of five. Nothing else sits on the picture.

**The shape is Apple's; the semantics are the class's.** The frame's five are
AirPlay · −15 · pause · +15 · captions, and none of those means anything
live, so the row keeps the SHAPE — five bare glyphs, the middle one larger —
and takes the class's own actions:

    discussion · camera · MICROPHONE · hand (host: share) · more

Abdout chose this over "Apple bottom card only" (today's pills kept) and
"literal Apple glyphs" (class controls under one `⋯`), and chose the mic for
the centre over hand and camera — 2026-09-03.

- **Mic is the centre**: the control a class reaches for most, the way pause
  is in a film. Red when muted, as before.
- **One panel button.** Chat, questions, poll and raised hands are four TABS
  of one `SidePanel`, so one glyph opens it and carries the count (unanswered
  questions, plus hands for the host; an open poll with nothing pending is a
  dot). That collapse is what lets the row fit a 390px phone in ONE line —
  the two clusters it replaces wrapped to two and cost the stage ~110px.
- **`⋯` holds the rest**: whiteboard and slides (host), screen share for a
  student the school lets share, the device selects, and the attendance note
  that used to be a `lg:`-only pill.
- **Top start (the reading edge — the RIGHT under RTL)**: `✕` leaves (the
  frame's close; `room.disconnect()` on the room context, NOT the SDK's
  `DisconnectButton`, which ships its own styles) · people (host-only — the
  `ParticipantsPanel`'s new `variant="glyph"`, its list floating UNDER the
  pill rather than stretching it) · fit. **Top end**: the connection — the
  signal glyph tinted by the last sample (`QUALITY_TONE`), the delivery
  tiers under it. That slot is volume in the frame; a phone has a rocker.
- **The scrubber is the class clock.** `room/class-progress.tsx`: the same
  5px track and 18×14 thumb as `VideoProgressBar` (its `PROGRESS_BAR`
  constants imported, not restated), read-only — `role="progressbar"`, not a
  slider, because a class has no timeline to drag — driven by
  `startsAtMs/endsAtMs` threaded from the card through `RoomClient` into
  `RoomShell`'s `clock`. Elapsed on the START side, `−left` on the END,
  Latin figures kept `dir="ltr"`, a red `مباشر` between them. It ticks once
  a second in its OWN state: the LiveKit tree above must not re-render with
  the second hand. An open room (no clock) renders no row at all.
- **The title pill is gone** from the in-call chrome — the frame shows none,
  and the reader just chose the class. The hands count moved onto the panel
  badge. If a school misses the name, it is one line above the scrubber, the
  way the lesson player prints `infoTitle`.
- **Auto-hide, the player's way** — `room/use-auto-hide.ts`: fades 3s after
  the last touch (`CONTROLS_HIDE_DELAY`, shared), a tap on the stage toggles,
  a MOUSE `pointermove` re-arms (a touch move is ignored — a thumb jitters
  before it taps, and the tap would only hide what the jitter revealed), and
  any open menu / the side panel / keyboard focus PINS it. The pin is DERIVED (`visible: pinned || visible`), never set in an
  effect — `react-hooks/set-state-in-effect` is an ERROR in this repo, and
  the first cut tripped it twice.
- **Overlay, not reserve.** The stage runs edge to edge under the chrome; the
  `barHeight` ResizeObserver reserve is gone. On a phone the teacher's 16:9
  picture sits in a letterbox and the card lands on the black band under it;
  a grid's bottom row can be under the card for the seconds it shows, which
  is the frame's own trade. Nothing reflows when the chrome comes and goes.
- **Menus close via a document `pointerdown` listener scoped to
  `[data-menu-root]`**, not a `fixed inset-0` catcher. The glass has a
  `backdrop-filter`, which makes it the containing block of any `fixed`
  descendant — so a catcher "the size of the screen" was the size of the
  pill, and clicks beside it closed nothing.
- **Fit and fullscreen are one glyph.** Where `document.fullscreenEnabled`
  the room itself goes fullscreen; where it cannot (iPhone Safari reserves
  fullscreen for `<video>`) the same glyph toggles every tile's
  `.lk-participant-media-video` between cover and contain — the frame's
  aspect toggle, meaning the same thing on every device it can.
- Labels went into `DEFAULT_ROOM_LABELS` AND both `live-classes.json` (the
  dictionary sync test): `live · discussion · fullscreen · exitFullscreen ·
fitScreen · fillScreen · classProgress · elapsed · remaining`.
- `glassPanel` (the rounded-2xl card) joined `glass.ts` beside the pill and
  the menu, for the lesson player to adopt when its bar takes the frame.

**Still open**: the second frame (605-80) was not fetched — Figma's Starter
plan caps MCP reads at 20 per MONTH, and they ran out on the first frame.
Its state is to be reconciled once Abdout pastes it.

## Room architecture (2026-08-29)

`room.tsx` owns the join ticket (refresh, eject on a server "no") and how the
room ENDS (`onDisconnected(reason)` → removed / ended / elsewhere / lost +
Rejoin). Everything inside the call is `room/`:

- `room-shell.tsx` composes header (quality dot, title, hand count), `stage.tsx`
  (whiteboard > slides > screen share > camera grid, cameras in a side strip
  when something else has focus), `side-panel.tsx` (chat via `useChat`,
  questions, polls, hands), `control-bar.tsx` (role-aware), and the overlays.
- `adaptive-delivery.ts` is a PURE ladder (tests pin the hysteresis);
  `use-adaptive-delivery.ts` applies the tier to every remote CAMERA
  publication — screen shares are never touched. It needs
  `adaptiveStream: false` on the room; do not turn it back on.
- `class-channel.ts` is the PURE protocol (codec + reducer; host-only messages
  are dropped when they come from a non-host, votes tally only on the host);
  `use-class-channel.ts` wires it to `useDataChannel("lc")`. Reduce through
  `stateRef` synchronously — the tally that follows a vote is sent before
  React re-renders. A late joiner asks the host on `RoomEvent.Connected`
  (the first ask, at mount, is before the channel exists).
- Hands are participant ATTRIBUTES (`hand=1`), not messages: the SFU replays
  them to late joiners. That is why HOST/CO_HOST/PARTICIPANT tokens carry
  `canUpdateOwnMetadata`, and why `attributes.role` is on every token — the
  receiver trusts host-only messages by it.
- `actions/room-events.ts` is idempotent on `lc:<session>:<kind>:<key>`; the
  shell persists questions (not the questions tab — a host who never opens it
  still leaves a record) and closed polls.
- Slides are the browser's PDF viewer in an iframe over
  `/api/lumos/file/<kind>/<id>?inline=1`; the page rides in the URL fragment.

## Danger Zones

- **Schedule instants combine in the SCHOOL timezone**: the wizard sends
  `startDate` (browser-midnight Date) + `"HH:mm"`; `list-actions.ts` combines
  them with the precise helpers in `src/lib/timezone.ts`
  (`schoolWallTimeToUtc` / `schoolCalendarDayOf` / `schoolTimeStringOf`)
  using `School.timezone`. NEVER combine with `setHours()`/`getHours()` —
  that reads the server TZ (UTC on Vercel) and shifts every stored instant
  by the school's UTC offset, breaking reminders and live-now windows.
- **Online school = stored POLICY + per-day materialization.** A term's
  timetable is a weekly PATTERN, so a school that "teaches online"
  (`School.conferenceOnlineDefault`, overridden per section by the TRI-STATE
  `Section.conferenceOnline` — `null` inherits) never gets a term's worth of
  pre-created rows. The reminders cron materializes ONE school day
  (`actions/materialize-day.ts`), and `actions/slot-session.ts` is the single
  writer + the single day-qualified lookup. Two consequences to preserve:
  - the sweep's slot filter must MIRROR `getTodaySchedule` (`termId`,
    school-TZ `dayOfWeek`, `weekOffset: 0`, `period.isBreak: false`,
    section+teacher present). `rotationWeek` is deliberately ignored — no read
    path in the app resolves an A/B rotation, so filtering on it would put
    sessions on days the timetable doesn't show.
  - the existence check runs against every DECIDED status (incl. `cancelled`
    and `ended`), NOT just joinable ones. The sweep re-runs every 15 minutes;
    a joinable-only check would resurrect a class the teacher cancelled, all
    day long. The interactive Start button keeps the joinable-only default so a
    teacher can hold a second sitting after one ends.
- **One holiday predicate, two deliberately DIFFERENT reactions.**
  `school-calendar.ts findSchoolClosure` is the single source; the
  materialization sweep calls it (via `isSchoolClosedOn`) and **suppresses**,
  while `getTodaySchedule` / `getChildTodaySchedule` call it and **inform** —
  returning `closure` alongside the normal day so the views render a notice
  over an otherwise-intact timetable.

  This is NOT the "mirror the read path exactly" rule being broken by
  accident. Materializing writes rows, lights up Join buttons and mails every
  student a reminder for a class that will never happen — worth suppressing.
  Blanking the read would be worse than the bug: `ScheduleException` rows are
  hand-entered, and one stale row would take a school's whole timetable away
  with no explanation. A suppressed write is recoverable (the next sweep
  re-materializes); a hidden read just looks broken. Keep the asymmetry, and
  keep it in one predicate so the two can't disagree about what a holiday IS.

  `src/app/api/cron/build-tomorrow-trips/route.ts` still holds a third,
  inline copy. Do not point it at `findSchoolClosure` on its own: that cron
  derives `tomorrow` and `weekday` in UTC throughout, so a school-timezone
  holiday gate bolted onto a UTC day check would look at the WRONG day for any
  school west of Greenwich. Move the whole cron onto `schoolDayWindow`, or
  leave it. Tracked in ISSUE.md.

- **A period that is already over is never materialized.**
  `materializeSlotSession` returns `period_over` for any slot whose
  `scheduledEnd` has passed, unconditionally (so back-filling a past date is a
  no-op too). This only became necessary once a school could flip online
  MID-DAY: without it, a 13:00 flip materializes every morning slot as
  `scheduled`, publishes Join buttons for classes that finished hours ago, and
  hands the end-stale cron a pile of instantly-stranded rows to cancel. A slot
  that has STARTED but not finished is still created — a teacher flipping the
  switch mid-lesson should get a room for the rest of it. Because of this the
  slot-session specs are time-dependent by construction and pin their clock
  with `vi.setSystemTime`; keep that or the file starts failing on its own the
  day the fixture date passes.

- **`materializeOnlineSchools`'s candidate filter must include the window arm**,
  or a school that is online ONLY through a window never sweeps. That arm is
  deliberately coarse (any `conferenceOnlineFrom` whose `until` is null or
  within 48h of now) because activeness depends on the school's own timezone
  and only `materializeSchoolDay` knows it. The grace bound matters: without
  it, a school whose closure ended two years ago occupies a slot in
  `MAX_SCHOOLS_PER_RUN` forever and can crowd out schools that are online today.

- **Saving settings materializes the day inline via `after()`.** An emergency is
  exactly the moment a 15-minute wait for the next cron tick is unacceptable.
  Best-effort by design — the cron re-runs the same idempotent sweep, so a
  failure costs latency, never correctness — but it must stay `after()`, never
  a bare `void` (see the note below).

- **Materialized sessions deliberately do NOT notify.** `notifyClassScheduled`
  fires for a human scheduling a class; firing it per slot per day would mail
  every student their whole timetable every morning. The reminder cron (which
  runs in the same pass) is the notification an online school actually wants.
- **`revalidatePath` on a SINGLE session needs the literal `[id]` segment.** A
  BLENDED path — a real cuid inside an otherwise-bracketed route — matches no
  cache tag at all, even with `"page"`: Next registers a page under its route
  PATTERN or its concrete URL, never a mix. Use
  `liveSessionRevalidatePaths()` (helpers.ts); it is coarser by
  construction (all sessions share one tag) and that is the trade Next offers.
- **Schedule ordering + the duration cap are enforced on UPDATE too**, against
  the EFFECTIVE boundaries (the supplied half merged with the stored one) —
  `list-actions.ts updateLiveClass`. Any new path that mutates
  `scheduledStart`/`scheduledEnd` must run both. Ordering is checked BEFORE the
  cap because the cap divides the two instants: an inverted schedule yields a
  negative duration, which is never `> cap`, so it would slip both guards at
  once. Ordering in the schemas goes through `endsAfterStart()` — day first,
  then the zero-padded `"HH:mm"` string, never a `new Date()` (that would mix in
  the browser's or the server's timezone, not the school's).
- **List-layer status writes are transition-guarded**: `updateLiveClass`
  allows no-change, `scheduled → cancelled|ended`, and `live → ended` for
  EXTERNAL sessions only. `→ live` belongs to `startLiveClass`/the webhook
  (room + concurrent cap); a LiveKit `live → ended` must go through
  `endLiveClass` (stops egress, tears down the room). Everything else is
  `LIVE_CLASS_INVALID_STATE` — never let a CRUD surface resurrect rows.
- **Attendance sync is provider-guarded**: `syncLiveAttendance` skips
  `provider !== "livekit"` — an external session has NO participant rows, so
  syncing one marks the entire roster ABSENT. Keep the guard even though
  external sessions "shouldn't" reach `ended` via the cron.
- **`revalidatePath` needs `"page"`**: `liveRevalidatePath()` returns a
  bracketed dynamic path, which Next silently ignores without the second
  argument. Every call site is `revalidatePath(liveRevalidatePath(…), "page")`.
- **The session list lives on TWO pages, so mutations revalidate both.**
  `/live` is the landing page (hero + the live/coming-up strip) and
  `/live/dashboard` is the table. `liveListRevalidatePaths()`
  (helpers.ts) returns both; every mutating action loops it rather than calling
  `liveRevalidatePath()` bare, which would leave one of the two stale.
  The dashboard sits inside the `(app)` route GROUP, and a route group
  contributes no URL segment — so the path is `…/live/dashboard`, NOT
  `…/live/(app)/dashboard`, which matches no cache tag at all.
- **Recording deletes only settle**: `deleteRecording` filters
  `status in [ready, failed, expired]`, and the webhook's `egress_ended`
  write is guarded (`deletedAt: null` + in-flight status, notify on count>0)
  — a late egress retry must never resurrect an admin-deleted row.
- **Tenant leak**: every read/write MUST filter by `schoolId` resolved
  from `getTenantContext()` — never from client input. `getLiveClass`
  in `actions/sessions.ts` resolves `schoolId` by trying dashboard,
  student, and guardian permissions in turn; if none match it returns
  UNAUTHORIZED rather than falling through to a global lookup.
- **Webhook signature**: `/api/webhooks/livekit/route.ts` verifies HMAC
  via `WebhookReceiver.receive()` before touching the DB. Don't bypass.
- **Webhook idempotency**: `ConferenceEvent.eventId` is `@unique`. The
  handler checks for an existing row before mutating — preserves
  at-least-once delivery semantics.
- **Room name parsing**: `parseRoomName()` is the only way to recover
  `schoolId` from a webhook. If a malformed roomName arrives, the
  handler drops it silently rather than guessing a tenant.
- **NotificationType enum drift**: 5 sync points must stay in lockstep
  with `prisma/models/notifications.prisma`:
  `notifications/config.ts` (`NOTIFICATION_TYPE_CONFIG` +
  `NOTIFICATION_EXPIRATION`), `notifications/validation.ts`
  (`notificationTypeSchema`), `notifications/email-service.ts`
  (`typeLabels` × 2 languages), `dictionaries/{en,ar}/notifications.json`
  (`types` map). Tests in `notifications/__tests__/config.test.ts`
  fail loudly on the first three; the dictionary + email-service drift
  silently.
- **`LIVEKIT_S3_ACCESS_KEY` / `LIVEKIT_S3_SECRET`**: only used by the
  LiveKit SFU process to PUT objects. The Next.js app reads recordings
  with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` via the existing
  S3 signer. Do not conflate.
- **List-layer reads must role-scope** (added 2026-06-13): `list-actions.ts`
  `getLiveClasses`/`getLiveClass` and the `content.tsx` SSR path MUST run rows
  through `resolveViewerSectionScope()` — STUDENT/GUARDIAN see only their own
  section's sessions (a session row carries `meetingUrl`). `getLiveClassFormData`
  is staff-only. The list-layer permission files gate writes, NOT reads — don't
  assume a role check upstream covers a new read.
- **Concurrent cap goes through `concurrentCapError()`** (helpers.ts): both
  `startLiveClass` (sessions.ts) and the HOST auto-start branch of `joinLiveClass`
  (tokens.ts) call it. A missing school row is a hard error — never `if (school && …)`
  (that silently bypasses the cap). Any new "start a room" path must call it too.
- **Webhook writes are status-guarded `updateMany`** scoped by `{ id, schoolId, status }`
  — never a bare `update({ where: { id } })`. A late/retried event must be a no-op,
  not a state resurrection.

## Related Blocks

- [Notifications](../notifications/CLAUDE.md) — `actions/notifications.ts`
  resolves its own audience (teacher + section roster + guardians via
  `loadSession`) then dispatches through the shared hub
  (`dispatchNotificationsToAudience({ targetUserIds })` in
  `src/lib/dispatch-notification.ts`). Do NOT go back to a direct
  `db.notification.createMany` — that bypasses the email channel, per-user
  preference filtering, `expiresAt`, `prewarm`, and URL absolutification (all 4
  were silently missing before 2026-06-20). All 4 mutating paths fan out:
  `sessions.ts` (LiveKit) AND `list-actions.ts` create/update/delete (external).
- [Timetable](../timetable/) — renders an **Online** marker beside the physical
  room on all three role views when a slot has a session TODAY (`OnlineBadge`,
  gated on `liveClass.sessionId` — a bare recurring link is not "online
  today"), and a **closure notice** from `findSchoolClosure`. An open room has
  neither a slot nor a `subjectId`, so `attachLiveClasses` reaches it through a
  SEPARATE section-level lookup, ranked last behind the per-slot session and the
  subject's own recurring link. Anchors scheduled sessions
  (`Conference.timetableId` is optional); `attachLiveClasses` resolves the Join
  target for teacher/student/guardian today-cards (guardian via
  `getChildTodaySchedule`).
- [Attendance](../attendance/CLAUDE.md) — the session detail page states how
  attendance is handled for THAT session (`describeAttendanceSync`), because an
  external meeting carries no presence and silence read as "handled" right up
  until the register was empty. This is the common case for an emergency
  school. `actions/attendance-sync.ts`
  `syncLiveAttendance` writes `Attendance` (method `VIRTUAL`) from
  participant presence on `room_finished` + the `end-stale-live-classes` cron.
  **Opt-in** per-school (`School.conferenceAttendanceSync`), **LiveKit-only**
  (external links carry no presence), requires `sectionId` + `timetableId`,
  idempotent on the section unique key (revive-on-update, never filter
  `deletedAt` in the lookup — see attendance CLAUDE.md).
- [Sections](../listings/students/) — `Section.students` is the
  enrollment source for student-join eligibility AND the attendance roster.

## Demo / Test

Phase 1 ships with no demo seed — schedule a class via the UI from
`admin@balqalam.com` (pw `1234`) on `demo.localhost:3000` once env vars
are configured.

Required env vars (set in `.env`):

- `LIVEKIT_HOST` — e.g. `https://livekit.databayt.org`
- `LIVEKIT_WS_URL` — e.g. `wss://livekit.databayt.org`
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`
- `LIVEKIT_RECORDING_BUCKET` — S3 bucket name
- `LIVEKIT_RECORDING_REGION` — default `me-central-1`
- `LIVEKIT_S3_ACCESS_KEY` / `LIVEKIT_S3_SECRET` — for SFU egress writes
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — for app-side playback
  signing (separate from SFU credentials)

## After You Finish

1. Update `ISSUE.md` and `README.md` here
2. Update the docs if user-facing: `content/docs-{en,ar}/live.mdx`
   (Structure section is `<ConferenceStructure />` — edit the component)
3. Run `pnpm tsc --noEmit` to verify no regressions
4. Run the conference specs under `src/tests/` (tests were moved out of an
   in-block `__tests__/` folder in the URL-mirror reorg) — should stay green
5. **Before any Prisma changes**: create a Neon branch via
   `mcp__Neon__create_branch`, test on the branch, then promote
