## Dashboard — Role-Based Home Pages

### Overview

The dashboard sub-block provides personalized landing pages for each user role with relevant widgets, quick actions, and key metrics. It renders role-specific views for Admin, Teacher, Student, Parent, Accountant, Staff, and Principal, each pulling real data from the database via server actions.

### Capabilities by Role

- **Admin**: School-wide statistics, enrollment trends, pending tasks, quick actions (create class, add student)
- **Principal**: Complete school overview with financial tracking, emergency alerts, compliance status
- **Teacher**: Today's classes (clock-aware, with a Join for the ones that are also online), teaching analytics, workload, expense claims
- **Student**: Today's timetable, upcoming assignments, recent grades, announcements
- **Parent**: Children overview, child's grades, attendance summary, school announcements
- **Accountant**: Financial overview, invoice history, revenue charts, payment tracking
- **Staff**: Resource usage, quick-look metrics, upcoming events

### Phone home block (below `md`)

On phones the dashboard opens with the Android app's home-screen top block,
ported from `feature/dashboard` (`HomeGrid` → `TopBlockLayout`): a calendar
widget beside a 2x2 cluster of four app icons — Notifications, Messages, Lumos,
Subjects — with the Android tile art copied into `public/tiles/`. Each icon
fills its cell rather than sitting at Android's fixed 64dp, so the only gap is
the grid's own (14px columns, 20px rows); the calendar card is the marketing
homepage's closing mint, `#9fe5b1`. The page
heading is hidden below `md` (`PageHeadingSetter hideOnMobile`), since the
Android home screen carries no title above its grid. It hides
itself from `md` up and sits above whatever the role's dashboard renders, so it
adds a row for every role without touching the role views.

- `home-block.tsx` — server half; counts the school's events dated today for the
  widget's bottom line, tenant-scoped and best-effort (falls back to zero).
- `home-block-client.tsx` — the grid. Widget first in DOM order, cluster second,
  which mirrors correctly in Arabic without any left/right classes.
- Copy lives at `school.dashboard.homeWidget` and carries the Android strings,
  not the sidebar's, so both products read the same.

Only the Smart Stack's Today page is ported — the Android widget's three-page
pager would fight a page that already scrolls vertically.

### Phone next-action banner (below `md`)

`next-action.tsx` (server) + `next-action-rank.ts` (pure ranking) +
`next-action-client.tsx` (rotation). Under the home block, a banner states the
single most important thing the signed-in role has to do and flips to the next
after a ten-second hold, looping.

- It is the THIRD copy of the green hero object, alongside
  `school-dashboard/live/landing/status-hero.tsx` and `components/library/hero.tsx`.
  When the GROUND changes — hex, radius, padding, headline face, pill — change
  all three. Two things here are deliberately NOT shared, because only this
  copy cycles: the fixed height, and the motion between sentences.
- **Fixed height, by construction.** The headline is pinned to a two-line box
  (`h-[2.7em]` at `leading-[1.35]`), which is the only variable piece, so the
  card measures a constant 245px at every phone width. A card that grew and
  shrank on a timer would shove the rest of the dashboard up and down. Copy that
  overruns two lines is clipped; the height never gives. The padding is a step
  deeper than /live's (`py-12`, not `py-10`) — a phone card wants more air than
  a page banner.
- `text-balance` splits those two lines to near equal width rather than leaving
  a long line over a short one.
- **Motion, two halves.** Leaving, the sentence evaporates: the line lifts and
  goes out of focus while its letters fade one after another, a staggered
  reversal of `components/ui/blur-in-text.tsx`. Arriving, it sorts itself out of
  noise — the scramble-reveal from `components/atom/encrypted-text.tsx`, written
  for the old site's "Take Sorting Quiz" link, ported here so one component owns
  the letters both motions run on.
- Every letter is its own span. Arabic still joins across them; `opacity` and
  `filter` do not affect shaping, which is why the lift is one `translate` on
  the block and never a per-letter one — `display: inline-block` DOES break the
  joining. The noise is Arabic letters on `/ar` and Latin on `/en`: Latin
  gibberish inside an Arabic line opens an LTR run inside an RTL one and the
  bidi algorithm then moves it around the line.
- The scramble is seeded in an effect, never in render, so the server and the
  first client render agree on the real sentence.
- `rankNextActions` reads what `getUpcomingDataByRole` already returns, so the
  banner adds no query. An empty ranking renders nothing, never an empty banner.
- **Two pills, the siblings' pair.** `افتح` opens the ranked destination;
  `اطّلعت` is a LOCAL dismissal — it drops the entry from the card for this
  visit and moves to the next. It writes nothing, because no such action exists
  behind these ranked rows; the next reload asks the data again. "Acknowledge"
  is the honest word for what it does.
- Copy is `school.dashboard.nextAction.kinds.<kind>`, each a sentence OPENING
  with a TWO-WORD emphasised phrase delimited `**like this**`. The delimiters,
  rather than bolding the bare `{mark}`, are what let the weight be a phrase —
  "**2 issues** are active and waiting on you" reads as a subject and a
  predicate where one bold digit reads as a typo. Where the phrase ends differs
  per language, so it is the translator's call. A template with no delimiters
  still emphasises everything up to and including the data, so a kind added
  later is plain, never unemphasised.
- **The copy length is measured, not guessed.** All 26 sentences (13 kinds × 2
  languages) are rendered in a real browser at phone width, per-CHARACTER spans
  and all, and checked against the two-line box. Span boundaries shift Chrome's
  line breaking by a few pixels, which is enough to flip a break, so measuring a
  plain `<strong>` plus a text node lies about where the lines land.
  **Rewriting one of these sentences means re-measuring it**, not eyeballing it
  — a word longer or shorter moves the break and the tail is then clipped.
- **The target is the /live hero's sentence, in Arabic.** That banner's headline
  is 45 characters over seven words, and the Arabic set is written to it: every
  kind now lands between 40 and 47, so the card reads at the same weight as the
  page banner it copies. **English cannot reach that number here.** Latin is
  wider than Arabic at the same measure, and 16ch × two lines tops out around 44
  characters — the /live hero's own English line (53) sets as three. So the
  English set is written to the box's ceiling instead, 38 to 44, which is as
  close to the reference as the fixed height allows. Do not "fix" the English by
  lengthening it to match the Arabic count; it will be clipped.
- **No colons.** Four kinds used to hang the data off a colon
  (`Overdue work: {mark}`), which put the mark OUTSIDE the emphasised phrase and
  read as a log line. The mark now sits inside the opening phrase in every kind,
  and each sentence ends on what the reader should do next — "and today still
  counts", "so start with one now" — rather than restating the count.
- `MARK_MAX` (12) is load-bearing, not cosmetic: with a fixed two-line box, a
  mark that overruns is a sentence with its end cut off. Fourteen put the two
  assignment templates onto a third line.
- Reduced motion drops both animations but keeps the rotation, on the same
  clock.

### Phone day timetable (below `md`)

`today-timetable.tsx` (server) renders the day's classes directly under the
next-action banner. It is /timetable's own day mode — the SAME `SimpleGrid` the
student surface renders, narrowed to one day column beside the period column —
not a second timetable. Nothing here re-implements a cell, a break row or a time
label; a grid that drifted from the real one would be worse than no grid.

- **Only STUDENT and TEACHER get it.** `getTodaySchedule` filters by role for
  those two and for everyone else returns the school's ENTIRE day unfiltered, of
  which it then keeps whichever slot sorts first per period. That is an
  arbitrary class, not "the school's day", so an admin, an accountant or a staff
  member gets nothing rather than a plausible-looking lie. /timetable makes the
  same call — only the student surface offers a week/day toggle at all.
- **It falls forward.** Asked on a Friday, the card reads the next few days and
  shows the first one with classes on it, exactly as `student-view.tsx` picks the
  next working day. The search stops at the first hit, so a school day costs one
  read and only a weekend pays for a second; a school with no periods at all
  bails on the first read rather than asking the same question five times. The
  heading says `حصص اليوم` when it landed on today and `الحصص القادمة` when it
  did not, and the column header names the day either way.
- `highlightToday` is OFF. The single column IS the day, so the highlight has
  nothing to contrast against, and tailwind-merge collapses its `bg-primary/5`
  onto the subject colour rather than over it — leaving it on greys the day out.
- **A declared holiday is skipped, not drawn.** `getTodaySchedule` informs
  rather than blanks — it returns the day's pattern alongside a `closure`, and
  /timetable prints a "school is closed" notice above the grid. This card has no
  room for a notice, so a closed day is treated like a weekend and it moves on.
- **`liveIndicators` is deliberately NOT passed.** The grid's live lamp lights
  on the cell it considers current, and that cell is decided by comparing a LOCAL
  wall clock against UTC-extracted period bounds. On /timetable that is fine,
  because the grid mounts after a client fetch and is never server-rendered.
  This card IS server-rendered, and in production the server's zone is UTC while
  the reader's is Khartoum — the two would light different cells and the lamp's
  label would be a hydration mismatch on every school day. Joining a live class
  stays on /timetable and /live, where the time gate lives.
- Copy is `school.dashboard.todaySchedule`; the grid's own labels come from
  `school.timetable`.
- **The role dashboards' own today-schedule cards hide below `md`**, and so does
  their "classes today" metric tile — `student-client.tsx` and
  `teacher-client.tsx`. This grid says the same thing a screen higher, and on a
  weekend it says it about a DIFFERENT day than the tile counts, so keeping both
  taught the reader to trust neither. From `md` up there is no grid and those
  cards are the only schedule on the page, so they stay. The teacher's third
  tile spans both columns below `md` so that metrics row has no hole; the
  student's row is `md`-and-up entirely now — see below, it is down to the one
  tile that was already hidden there.
- **Those `hidden` / `col-span` classes ride a WRAPPER div, never
  `MetricCard`'s `className`.** A metric card with an `href` renders as `<Link>`
  around the card, so the grid item is the link — a class passed to the card
  lands one level too deep, and `hidden` there empties the cell instead of
  removing it.

### The student dashboard was stripped to the day and the money (2026-09-09)

Over two passes the reader removed nearly every student-specific section.
Attendance went first and everywhere: the `الحضور` metric tile, the attendance
ring in "My Progress", the "Attendance Rate" row of the Academic Progress table
(both the real data in `getStudentResourceUsage` and the fallback in
`resource-usage-section.tsx`), and the Attendance radial chart. The Study Hours
bar chart went with it. Then the rest: the average-grade and assignments-due
tiles, the whole "My Progress" rings card, the performance gauge, upcoming
assignments, recent grades and school announcements — `DetailSection` no longer
exists.

What a student is left with, in order: on phones the home block, the
next-action banner, the day timetable and the phone quick-actions row; then
Quick Actions (`md`+), the chart section — now the grades area chart alone, and
moved up to sit directly under the quick actions at either width — then the
Academic Progress table and Fee Payments. `MetricsSection` and
`TodaySection` survive as one `md`-and-up tile counting today's classes and the
`md`-and-up schedule card, so below `md` neither renders at all.

Three things to know before restoring any of it. `getStudentDashboardData`
still fetches and types the full `StudentDashboardData` — `attendanceSummary`,
`recentGrades`, `upcomingAssignments`, `announcements` are all there and merely
unread, so every one of these surfaces comes back by putting its JSX back, not
by rewiring data. A lone area chart in a row sized for two would double its own
height, since `ChartContainer` is `aspect-video`, so `chart-section.tsx` pins
it to the height it had beside the radial. And none of this touched another
role at the time: parent, principal, admin, accountant and staff still keep
every section and all three charts. The teacher dashboard was brought over
deliberately a day later — see the next section.

### The teacher dashboard took the student's pattern (2026-09-10)

The student dashboard was the reference; the teacher's now follows it in both
halves.

**The engineering half — the day, read the same way.** `getTeacherDashboardData`
used to take its weekday from the server clock (`today.getDay()`, UTC on the
container), so for a school whose local day straddles the UTC boundary the card
showed the wrong day. It applied no term filter, so a slot from a finished term
could still land in it. And it pre-formatted each period as a `"09:05 - 09:50"`
string with `toLocaleTimeString()` — on a `Date.UTC(1970, 0, 1, h, m)` value,
which is exactly the "an 08:00 period reads 10:00 in Khartoum" bug the student
pass fixed on 2026-09-06. All three are gone: the query now resolves
`schoolDayOfWeek(School.timezone)` and the active term, runs `attachLiveClasses`
over the slots, and returns raw `startTime` / `endTime` ISO plus `liveClass`,
exactly as the student's does. The card reads those bounds through
`day-clock.ts`, so it clears itself as the day passes, badges `Now` only while
the clock is inside a period, says the day is done rather than offering a day
off, and carries the same Online marker and Join button the students in that
room see. Three labels were added to `school.teacherDashboard.labels` for it:
`now`, `classesDone`, `seeYouTomorrow`.

**The layout half — stripped to match.** At the reader's request the teacher
dashboard was cut to the student's shape: the Upcoming/Weather hero and the
Quick Look row are commented out (and `teacher.tsx` no longer calls
`getQuickLookData` / `getWeatherData` — do not fetch what is not rendered), the
chart section moved up to sit directly under Quick Actions, `MetricsSection`
went from four tiles to one `md`-and-up tile counting today's classes, and
`DetailSection` (pending assignments, class performance, upcoming deadlines),
`ProgressSection` (grading and attendance bars) and the Teaching Progress
activity rings were removed outright. What a teacher is left with, in order: on
phones the home block, the next-action banner, the day timetable and the phone
quick-actions row; then Quick Actions (`md`+), Teaching Analytics, Teaching
Workload, Expense Claims, the one metric tile and the classes card.

`getTeacherDashboardData` still fetches and types the full
`TeacherDashboardData` — `pendingAssignments`, `classPerformance`,
`upcomingDeadlines`, `pendingGrading`, `attendanceDue` and `totalStudents` are
all there and merely unread, so every removed surface comes back by putting its
JSX back, not by rewiring data. `HeroSection` and `QuickLookSection` are still
defined in the file for the same reason.

### Phone quick-actions row (below `md`)

On phones the row is hoisted OUT of the role's own dashboard and rendered
under the day timetable by `phone-quick-actions.tsx` (directly under the
next-action banner on a day with no classes) — four screens
down under the charts, nobody reached it. It carries no ground of its own since
2026-09-06: the muted band was a second tinted rectangle on a page that already
has the green banner. It keeps the full bleed, because the bleed is what puts
its four columns on the home block's grid — same `px-4` payback, same 32px
column gap, tiles sized by the cell rather than fixed at 64px, so two of its
tiles land directly under the home block's cluster tiles at every width. That
is the relationship `home-grid.kt` builds on the Android home screen between
the widget row and the 4-up rows below it. Measured at 390px: both grids put
tiles at x=16..82 and x=114..179, 66px wide.
Each of the seven role dashboards keeps its own copy at `hidden md:block`; if
you delete the phone component, take that class off all seven.

`quick-actions.tsx` renders its four actions as one row of Android tiles on
phones and keeps the coloured cards from `sm` up. The tile is keyed by the
action's LABEL, not its `iconName` — the Android set is per-feature. An action
missing from `tileByLabel` falls back to the card at every width.

### The "today" card clears itself — student and teacher alike

The card lists what is LEFT of the day, not the whole day: a period drops off
the moment it ENDS (2026-09-06), so a student who leaves the dashboard open
watches it empty out. In-progress periods stay — that is the row they most
need. The badge follows the same clock: `Now` only while the clock is inside a
period, `Next` on the first row otherwise, so index 0 can no longer claim to be
happening when it is three hours away. When every period has passed the empty
state says the day is done rather than offering a day off, which is the same
empty list with the opposite meaning. The "classes today" metric card above
still counts the FULL day, because that is the question it answers.

Two conventions make it work, both borrowed rather than invented:

- **Local `now`, UTC period bounds.** Period times are stored as
  `Date.UTC(1970, 0, 1, h, m)` and read back with `getUTC*`, the timetable
  block's standing convention (`isRowLiveJoinable`, `getCurrentClass`). The
  card used to `format()` them locally, which shifted every printed time by the
  reader's offset — an 08:00 period read 10:00 in Khartoum. Fixed in the same
  pass; a filter on the real time under a display two hours out would have made
  rows vanish before their printed start.
- **Filter after mount, never during the first render.** The card is
  `"use client"` but Next server-renders it, and in production the server's
  clock is UTC while the reader's is not. `useNowMinutes` returns `null` until
  mounted, so the server and the first paint both render the whole day and the
  filtering starts one tick later. It re-reads every 30s.

Both conventions now live in `day-clock.ts` (2026-09-10), which
`student-client.tsx` and `teacher-client.tsx` both import. They were written
for the student on 2026-09-06 and copied nowhere; lifting them out is what let
the teacher card take the same behaviour without a second copy of the
hydration contract.

### Routes

| Route                                                         | Page                | Status |
| ------------------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-dashboard)/dashboard`          | Role-based redirect | Ready  |
| `/{lang}/s/{subdomain}/(school-dashboard)/dashboard/settings` | Dashboard settings  | Ready  |

### File Structure

```
src/components/school-dashboard/dashboard/
+-- content.tsx                  # Server component - role router
+-- actions.ts                   # Server actions for data fetching
+-- weather-actions.ts           # Weather data actions
+-- types.ts                     # TypeScript type definitions
+-- day-clock.ts                 # The day's clock, shared by every role's "today" card
+-- validation.ts                # Zod schemas
+-- config.ts                    # Dashboard configuration
+-- quick-actions-config.ts      # Quick action button config
+-- phone-quick-actions.tsx      # The role's four actions, hoisted to the phone top
+-- loading.tsx                  # Skeleton loader
+-- error-boundary.tsx           # Error fallback UI
+-- client.tsx                   # Client-side wrapper
+-- admin.tsx                    # Admin dashboard -- server fetch only
+-- admin-client.tsx             # Admin dashboard view (client)
+-- principal.tsx                # Principal dashboard view
+-- teacher.tsx                  # Teacher dashboard -- server fetch only
+-- student.tsx                  # Student dashboard -- server fetch only
+-- teacher-client.tsx           # Teacher dashboard view (client)
+-- student-client.tsx           # Student dashboard view (client)
+-- parent.tsx                   # Parent dashboard view
+-- accountant.tsx               # Accountant dashboard view
+-- staff.tsx                    # Staff dashboard view
+-- header.tsx                   # Dashboard header
+-- welcome-banner.tsx           # Welcome message
+-- notification-service.tsx     # Real-time notifications
+-- empty-state.tsx              # No-data fallback
+-- section-heading.tsx          # Section title component
+-- section-columns.tsx          # Column layout
+-- stat-*.tsx                   # Stat card variants (15+ variants)
+-- card-*.tsx                   # Card components (10+ variants)
+-- chart-*.tsx                  # Chart components (10+ variants)
+-- quick-actions.tsx            # Quick action buttons
+-- quick-action.tsx             # Single quick action
+-- quick-look-section.tsx       # Quick-look metrics
+-- quick-look-section-server.tsx # Server-side quick-look
+-- financial-overview-section.tsx # Finance section
+-- invoice-history-section.tsx  # Invoice list
+-- resource-usage-section.tsx   # Resource tracking
+-- revenue-chart.tsx            # Revenue visualization
+-- comparison-chart.tsx         # Period comparison
+-- attendance-chart.tsx         # Attendance visualization
+-- grade-chart.tsx              # Grade distribution
+-- weekly-chart.tsx             # Weekly trends
+-- weather.tsx                  # Weather widget
+-- upcoming.tsx                 # Upcoming events
+-- top-section.tsx              # Top metrics row
+-- schedule-item.tsx            # Schedule entry
+-- announcement-card.tsx        # Announcement widget
+-- info-card.tsx                # Info display
+-- metric-card.tsx              # Metric display
+-- progress-card.tsx            # Progress indicator
+-- performance-gauge.tsx        # Performance meter
+-- activity-rings.tsx           # Activity visualization
+-- transactions-list.tsx        # Transaction feed
+-- upgrade-card.tsx             # Plan upgrade prompt
+-- dashboard-showcase.tsx       # Feature showcase
+-- chart-showcase.tsx           # Chart gallery
+-- card-showcase.tsx            # Card gallery
```

### Status

**Completion:** 85% | **Blockers:** None

All 7 role-specific views are implemented. Principal, Teacher, Student, and Parent dashboards use real database queries. Admin dashboard has partial real data. Accountant and Staff dashboards are functional with real data integration in progress. The block includes 97 component files covering stat cards, charts, quick actions, and section layouts.

### Loading (skeleton)

`/dashboard` is six pages behind one URL, so its placeholder is role-aware
since 2026-09-10. `page.tsx` reads the role with `currentRole()` — a JWT cookie
read, no database — and passes it to `DashboardSkeleton` through its own
`<Suspense>`; the route's `loading.tsx` covers only that await and draws the
role-blind shell.

`DashboardSkeleton` (in `school-dashboard/loading.tsx`) draws the phone prefix
every role gets (`home-block`, `next-action`, `today-timetable`,
`phone-quick-actions`, all `md:hidden`) and then one of three bodies:

| Shape | Roles | Sections, in order |
| --- | --- | --- |
| ADMIN | ADMIN, DEVELOPER | hero, quick look, quick actions, usage, invoices, three charts, attendance |
| PRINCIPAL | PRINCIPAL | the admin's first six, stopping before the attendance grid |
| TEACHER | TEACHER | quick actions, three charts, usage, invoices, metric tile, today |
| STUDENT | STUDENT | as TEACHER, with the area chart alone across the row |
| neutral | everything else, and before the role is known | quick actions, usage, invoices |

Before it, ONE skeleton drew the admin page for every role — a teacher and a
student both watched a weather hero, a Quick Look row and an attendance grid
resolve into a page that has none of the three.

Measured against the live admin and student pages at 1440px: quick actions
100px, usage table 44 + 40 + 36/row, invoice table 44 + 40 + a 96px empty cell
(the invoice list is a client read, so the empty state IS the frame the
skeleton hands over to), chart plot 250px, the student's row-wide area plot
320px. Two are close rather than exact — the Quick Look card lands ~10px short
of its 142px original and the chart section ~16px short of 863px. The teacher
body was read off `teacher-client.tsx` rather than measured in the browser; it
is the student's shape with the full chart trio and four usage rows.

### Integration Points

- [Attendance](../attendance/README.md) -- Attendance charts and stats
- [Exams](../exams/) -- Grade distribution and results
- [Listings](../listings/) -- Student/teacher counts and quick stats
- [Finance](../finance/) -- Revenue charts, invoice history
- [Timetable](../timetable/README.md) -- Today's schedule widget
- [Notifications](../notifications/README.md) -- Alert system integration
