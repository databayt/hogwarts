---
epic: 09
sprint: Q3-2026
title: Mobile API Layer
file_type: issue
owner: Abdout
maturity: In Progress
completion: 40
tracker: https://github.com/databayt/hogwarts/issues/315
docs: https://ed.databayt.org/en/docs/mobile-api
last_audited: 2026-09-22
---

# Mobile API Layer — Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 40%
**Last Updated:** 2026-05-25

---

## MVP Checklist

_Bootstrap from the Q3 epic tracker (https://github.com/databayt/hogwarts/issues/315). Items there should map 1:1 to
checkboxes here. The tracker is canonical for cross-feature visibility; this file is
canonical for code-side context (read by the `/report` agent)._

- [ ] _To be filled in_

## Recently Landed

- [x] The rest of the phone parity (2026-09-22): `POST /api/mobile/report`
      (the footer's "Report an issue", through `runReportPipeline` with
      `hogwartsReportAdapterFor` supplying the token's user), `GET
      /api/mobile/lumos/course-search` (the search sheet's typeahead and
      featured shelf — `/api/lumos/course-search` for a token), and the admin
      readiness band on `/api/mobile/live/landing`, whose coverage now comes
      from `computeLiveLinkCoverage` (the settings action authorises, then
      calls it).

- [x] Phone parity for `/subjects`, `/live` and `/lumos/courses` (2026-09-22).
      `GET /api/mobile/subjects` now keeps only PUBLISHED subjects, adds the
      student's/teacher's subjects that reach them without a selection row,
      returns them in the web grid's order (lowest grade, then name) and
      carries `school_levels`, which decide whether the level tabs appear.
      `GET /api/mobile/live/landing` serves `loadLiveLanding` — now shared
      with the `/live` page, which used to hold that logic inline — so the
      phone gets the same viewer rules, online state, phases, catch-up and
      recording ranking. `GET /api/mobile/lumos/courses` is the courses page's
      `CoursesRenderer` over the same four reads; `getCourseShelves`,
      `getContinueWatching`, `getStartHereLesson` and `getAllCatalogCourses`
      take an optional server-verified school/user for it. Not mirrored: the
      admin readiness band (its coverage read authorises against the web
      session).

- [x] `GET /api/mobile/subjects` is scoped by role, like `/subjects` on the
      web (2026-09-22). It used to return every subject the school adopted:
      a grade-12 student got 130 subjects across grades 1-12, while the web
      showed them 25. It now reuses `getSubjectIdsForStudent` /
      `getSubjectIdsForTeacher` from the subjects listing. A student with no
      `Student` row gets an empty list, not the whole catalogue. Verified
      locally: student 25 (all grade 12), teacher 48, admin 130 (unchanged).
      `GET /api/mobile/subjects/:id` now drops chapters and lessons the school
      hid (`ContentOverride.isHidden`) for non-admins, and returns
      `textbook_pdf_url` / `textbook_cover_url` / `textbook_reader_href`.
      **Not verified: the hidden-content filter** — prod has no hidden
      overrides to exercise it. **Reaches phones only after the next deploy.**
      `GET /api/mobile/subjects/my-subjects` is deleted: no client called it
      (Android's screen was unreachable, and it's now removed too), and it
      picked subjects by class enrolment rather than the web's grade rule.

- [x] `GET /api/mobile/live/*` — the session list, a session's recordings and a
      signed playback URL (2026-09-20). The join route could already mint a
      ticket; nothing could tell a phone a session existed. Verified against
      the demo school: the same three clock-straddling sessions the browser
      shows (two live, one scheduled), 165 past sessions, and 404 rather than
      403 for anything out of the reader's scope. **Not verified: a signed
      playback URL** — the demo has no `ready` recording to sign.

- [x] `POST/GET /api/mobile/courses/*` — enrol, lesson progress, lesson quiz
      and certificate (2026-09-20). `feature/lumos` on Android has been calling
      these four paths since it was written and every one 404'd, so 45 files of
      course player could not enrol a student or save a second of progress.
      Each route calls the same core module the web action calls. Paid
      enrolment answers 402 with a checkout path rather than inventing a
      mobile Stripe flow.

- [x] `GET/POST /api/mobile/library/*` — books, book detail, borrow, the
      reader's loans and return (2026-09-19). The Android `feature/library`
      module has been calling these paths since it was written; every one of
      them 404'd in production until now, so the block could not show a single
      book. Verified end to end against the demo school, including the borrow
      transaction and its three 409 guards.

- [x] `GET /api/mobile/search` — the Spotlight palette's entity search over
      HTTP, so the Android app can reach the same 15 kinds the web reaches
      through its server action (2026-09-19). Follow-up: the app's search
      screen still lists pages and actions only; wiring the dynamic half is a
      client change, not a server one.

## Known Issues

### P0 — Critical

- [ ] _To be filled in_

### P1 — High

- [ ] _To be filled in_

### P2 — Medium

- [ ] _To be filled in_

## Resolved Issues

_Chronological close log — appended as items ship._

## Enhancements (Post-MVP)

_Deferred to next quarter+._
