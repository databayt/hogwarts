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
last_audited: 2026-09-19
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
