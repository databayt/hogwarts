# Dashboard — Production Readiness Tracker

**Status:** :yellow_circle: IN PROGRESS
**Completion:** 87%
**Last Updated:** 2026-09-10

---

## MVP Checklist

- [x] Teacher dashboard refactored onto the student's pattern (2026-09-10) — both halves. **Engineering:** `getTeacherDashboardData` took its weekday from the server clock (`today.getDay()`, UTC on the container), applied no term filter, attached no live classes, and pre-formatted each period with `toLocaleTimeString()` on a `Date.UTC(1970, 0, 1, h, m)` value — the same "08:00 reads 10:00 in Khartoum" bug the student pass fixed on 2026-09-06, three months after it was fixed next door. It now resolves `schoolDayOfWeek(School.timezone)` + `resolveActiveTerm`, runs `attachLiveClasses`, and returns raw `startTime`/`endTime` + `liveClass`. `periodMinutes`/`periodLabel`/`useNowMinutes` were lifted out of `student-client.tsx` into `day-clock.ts` and are imported by both, so the hydration contract exists once; the teacher card now clears itself as the day passes, badges `Now` only while the clock is inside a period, distinguishes "classes are done" from a day off, and shows the same Online marker and Join button the students in that room see. Added `school.teacherDashboard.labels.{now,classesDone,seeYouTomorrow}` in en + ar. **Layout:** stripped to the student's shape at the reader's request — hero and Quick Look commented out (and no longer fetched in `teacher.tsx`), charts moved up under Quick Actions, four metric tiles down to one, `DetailSection` / `ProgressSection` / the Teaching Progress rings removed. `TeacherDashboardData` still carries every removed list, so each surface returns by putting its JSX back
- [x] Phone day timetable below `md` (2026-09-05) — `today-timetable.tsx` renders /timetable's OWN day mode (`SimpleGrid`, one day column + the period column) directly under the next-action banner, so the phone top reads: what today is → the one thing to do → the day's classes → the four places you go. STUDENT and TEACHER only: `getTodaySchedule` is role-filtered for those two and returns the school's whole unfiltered day for everyone else, of which it keeps an arbitrary slot per period — so admin/accountant/staff get nothing rather than a plausible lie, the same call /timetable makes. Falls forward to the next day with classes on a weekend (as `student-view.tsx` does), heading switches `حصص اليوم` → `الحصص القادمة` when it does, `highlightToday` off (it would grey the single column out). `liveIndicators` deliberately NOT passed: the lamp picks its cell by comparing a LOCAL clock against UTC period bounds, which is safe on /timetable (client-mounted, never SSR'd) but a hydration mismatch here (server UTC vs reader Khartoum). A declared holiday is skipped like a weekend, since the card has no room for /timetable's closure notice
- [x] The student's and teacher's own today-schedule cards hide below `md` (2026-09-06) — plus the "حصص اليوم" / "Today's Classes" metric tile on both. The new grid says the same thing a screen higher, and on a weekend it says it about a DIFFERENT day than the tile's count, so keeping both taught the reader to trust neither. The remaining third tile (`واجبات مستحقة` / `حضور مستحق`) spans both columns below `md` so the row has no hole. The `hidden`/`col-span` rides a WRAPPER div, not `MetricCard`'s `className`: a card with an `href` renders `<Link>` around the card, so the grid item is the link and the class would land one level too deep — `hidden` on the card empties the cell instead of removing it. Everything from `md` up is untouched, where there is no grid and these cards are the only schedule
- [x] Banner copy rewritten to the /live hero's sentence and de-coloned (2026-09-05) — every kind's `{mark}` moved INSIDE the opening bold phrase, so the four colon templates (`Overdue work: {mark}`) are gone; each sentence now ends on the next step rather than restating the count. Arabic set written to the /live headline's own length (45 chars): all 13 land at 40–47. English cannot reach that in a 16ch two-line box (Latin tops out near 44; /live's English hero, at 53, sets as three lines), so the English set is written to the ceiling at 38–44 and must NOT be lengthened to match the Arabic count. All 26 re-measured in a real browser at 430px with per-character spans; every one sets in two lines
- [x] Phone home block below `md` — calendar widget + 2x2 app-icon cluster ported from the Android home screen, on the brand green ground; only the Smart Stack's Today page is ported, and the widget's bottom line counts the school's events dated today rather than the day's classes
- [x] Phone next-action banner below `md` — ranked per role from the existing `getUpcomingDataByRole` payload; third copy of the green hero object (see `/live` and `/library`)
- [x] Card copy rewritten against MEASURED line balance (2026-09-05) — all 26 sentences (13 kinds × 2 languages) open with a TWO-WORD bold phrase and set as at most two lines; measured in a real browser with per-character spans, since span boundaries shift Chrome's line breaking enough to flip a break. `MARK_MAX` 20 → 12. **The balance figures this line used to quote (Arabic 0.945 / English 0.928) belonged to the superseded wording** — see the de-coloning entry above for the copy in the tree now. Rewording any of these needs a re-measure, not an eyeball
- [x] `تم` → `اطّلعت` / "Acknowledge" (2026-09-05) — the honest word for a button that only takes the entry off this screen
- [x] Next-action banner rebuilt to the /live pattern exactly (2026-09-05) — the two-pill row is back and is now a PAIR (`افتح` white + `تم` ghost, the siblings' `default`/`ghost` variants); `تم` is a LOCAL dismissal that writes nothing, since no "mark done" action exists behind these ranked rows; card height 229 → 245 (`py-12`); emphasis moved from the bare `{mark}` to a `**…**`-delimited opening PHRASE so the weight is two words, not one digit
- [x] Quick actions hoisted to the phone top (2026-09-05) — `phone-quick-actions.tsx` renders the role's four actions directly under the green banner; all seven role dashboards keep their own copy at `hidden md:block`. Muted band removed and the row re-aligned to the home block's grid (2026-09-06) — no second tinted rectangle under the banner, bleed kept, 32px columns, cell-sized tiles; an action with no Android artwork now falls back to a tinted cell carrying its own icon instead of an empty cell
- [x] Next-action banner brought to /live's look and given its own motion (2026-09-05) — fixed 229px height (headline pinned to a two-line box, so the card can no longer resize under the reader), `text-balance` for two near-equal lines, the dash indicator dropped, every template reordered to open with `{mark}` so the bold lands on the first words, hold raised 6s → 10s, and the `rotateX` flip replaced by a staggered blur-and-fade leave (`ui/blur-in-text.tsx` reversed) into a scramble-reveal entrance (`atom/encrypted-text.tsx`), with a locale-appropriate noise charset. `MARK_MAX` 24 → 20: measured, 22 is where a third line starts at 360px, so the old cap would have silently clipped long assignment titles
- [x] Phone quick-actions row below `md` — the role's four actions as one row of Android tiles, keyed by label
- [x] Role-based views (7 roles: admin, principal, teacher, student, parent, accountant, staff)
- [x] Quick stats cards with real data
- [x] Pending tasks widget
- [x] Recent activity feed
- [x] Real data queries for Teacher dashboard
- [x] Real data queries for Student dashboard
- [x] Real data queries for Parent dashboard
- [ ] Principal dashboard real data — **claim corrected 2026-07-19: budget (`allocated=2500000` hardcoded), parent-satisfaction scores, board meetings, disciplinary `incidentRate`, and staff-evaluation due dates are fabricated constants** (`dashboard/actions.ts:1444-1611`); only the base counts are real
- [x] Financial tracking server actions (fee collection, expenses, budget)
- [x] Emergency alert system with severity levels
- [x] Loading states with skeleton loaders
- [x] Error boundaries with fallback UI
- [x] Compliance tracking system
- [x] Notification service with persistence
- [x] getDashboardSummary action for admin metrics
- [ ] Accountant dashboard real data integration
- [ ] Staff dashboard real data integration
- [ ] Real-time updates (WebSocket/SSE)

## Known Issues

### P0 -- Critical

- None

### P1 -- High

- Accountant and Staff dashboards need full real data integration — **2026-07-19: accountant is ~75% real but weekly-collections / monthly-revenue charts + financial calendar are static (`accountant.tsx:154-283`); staff is ~10% real — `getStaffDashboardData` is self-labeled MOCK (`actions.ts:5332`)**. Also: accountant/principal/staff/admin destructure `dictionary` but never use it — all card titles hardcoded English (principal's `school.principalDashboard` namespace already exists, pure wiring bug; accountant/staff need new namespaces)
- No data caching strategy -- all data fetched on every page load
- Parent, principal, accountant and staff still render their whole view from the
  server file. Admin, student and teacher were split into `<role>.tsx` (fetch) +
  `<role>-client.tsx` (view) on 2026-08-30; the remaining four should follow

### P2 -- Medium

- ~~Student dashboard rendered the same four numbers three times (metric row,
  "Academic Summary" card, progress cards) and charted a fabricated grade trend~~
  — fixed 2026-08-30: duplicates and the fake trend removed
- ~~Teacher's "Attendance Taken" progress card could render a negative count
  (`todaysClasses.length - attendanceDue`, where `attendanceDue` counts every
  class still owing a register, not just today's)~~ — clamped 2026-08-30
- ~~Student dashboard hardcoded ~25 English strings (section titles, badges,
  empty states, activity-ring labels) and formatted dates with the English
  date-fns locale on `/ar`~~ — fixed 2026-08-30; keys added to `school-{en,ar}.json`

- **Every chart drawn from a `--chart-*` token renders invisible.** The colour
  is written `hsl(var(--chart-1))`, but the token in `globals.css` is already a
  full `oklch(...)` colour, so the browser gets `hsl(oklch(...))`, throws it
  out, and paints nothing. The area chart in `chart-section.tsx` is a blank
  plot with only its axis, and the performance gauge renders black. The fix is
  to drop the `hsl(...)` wrapper at each site; found 2026-09-09, and now the
  first thing a student sees in their chart section, which since the same day
  holds that area chart alone.
- GUARDIAN, ACCOUNTANT and STAFF have no drawn loading skeleton. The role-aware
  `DashboardSkeleton` covers ADMIN (with DEVELOPER and PRINCIPAL) plus TEACHER
  and STUDENT; the other three fall back to the neutral body — quick actions,
  usage table, invoice table — because their dashboards have not been measured
  and a placeholder in the wrong order costs more than one left out. Measure
  those three and add their shapes (2026-09-10).
- Charts use some hardcoded sample data in bar-graph component
- No data export from dashboard views
- Period switcher does not persist selection across navigations
- Mobile layout needs optimization for chart components

## Enhancements (Post-MVP)

- [ ] Real-time updates via WebSocket or SSE
- [ ] Customizable widget layout (drag-and-drop)
- [ ] Charts with Recharts integration for all roles
- [ ] Quick actions with actual navigation
- [ ] Push notifications for critical alerts
- [ ] Dashboard data export (PDF/CSV)
- [ ] Comparison views (period-over-period)
- [ ] Custom date range filtering

---

**Last Review:** 2026-03-19
