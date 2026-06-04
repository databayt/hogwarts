# Live-Classes — Open Issues

> Tracker: [databayt/hogwarts#3](https://github.com/databayt/hogwarts/issues/3) · Aldar Epic 03 anchor.

## Status

**Two providers on one model:**

- **`external`** (paste a Google Meet / Zoom / Teams link) — **production-active
  now** on any tier incl. Vercel Hobby. No infra. This is the default path.
- **`livekit`** (built-in SFU room + recordings) — **code-complete, dev-ready**,
  gated on `LIVEKIT_*` env presence via `isLiveKitConfigured()`. Lights up in
  production once the SFU is provisioned + Vercel Pro is in place — **no code change**.

The Aldar P0 items below gate **only the `livekit` provider**; the feature is
usable today without any of them.

## P0 — LiveKit-provider infra (Aldar pre-signature gates)

> None of these block the `external` provider or the timetable Join button.

- [ ] **Provision G42 Cloud SFU** in UAE region (`livekit-server`; UDP 50000-60000, TCP 7881, TCP 443).
- [ ] **TURN-over-443-TCP** via coturn co-located with the SFU.
- [ ] **AWS S3 `me-central-1` bucket** + IAM for SFU egress writes.
- [ ] **Webhook URL registration** in LiveKit → `https://ed.databayt.org/api/webhooks/livekit`.
- [ ] **Set `LIVEKIT_*` env vars** (host, ws, key, secret, recording bucket/region, S3 creds — separate from app `AWS_*`).
- [ ] **Meeting-3 network test** from inside Aldar school WiFi (`/live-classes/network-test`). **Block on TURN/443 failure.**
- [ ] **Add the 5-min `live-class-reminders` cron to `vercel.json`** — intentionally omitted (sub-daily → needs **Vercel Pro**). Until then, reminders surface via the auto-appearing timetable Join button (60s client tick).

## P1 — Remaining product work

- [ ] **Default-link management surface** — today a recurring `LiveClassDefaultLink`
      is created via the schedule form's "reuse this link" checkbox. A dedicated
      list/edit UI (per subject+section) would let teachers manage links without
      scheduling a session.
- [ ] **Auto-start egress** on `room_started` if `recordingEnabled` (livekit only) —
      webhook upserts the recording row on `egress_started`, but nothing triggers
      egress yet. Either call `startCompositeEgress()` from the webhook or configure
      LiveKit auto-egress SFU-side.
- [ ] **Per-section / per-grade recording opt-out** (currently a per-session boolean).
- [ ] **Authenticated browser E2E walkthrough** — schedule (external) → timetable
      Join → dedicated page, as teacher + student. Blocked during this pass by the
      demo-tenant login not establishing a session (existing-system/data, not feature
      code). Note: the worktree `.env` points at **production** Neon, so run it on a
      Neon branch or accept prod test rows.

## P2 — Settings + ops

- [ ] **Settings UI** for `liveClassRecordingRetentionDays`, `liveClassMaxDurationMinutes`,
      `liveClassRecordingDefault`, `liveClassMaxConcurrentPerSchool` (ADMIN/DEV only).
- [ ] **Capacity dashboard** (concurrent rooms, egress queue, TCP-fallback rate) — livekit ops.
- [ ] **Kick-participant UI** in `room/room-client.tsx` for HOST (`removeParticipant` exists, not wired).

## P3 — Hardening (LiveKit scale)

- [ ] **3-node SFU + LB** for Wave-2 capacity (~5K → ~15K concurrent); sticky room routing.
- [ ] **MinIO on-prem fallback** for recordings (schema already carries per-row `s3Bucket`/`s3Region`).

## Done

- [x] **Dual-provider extension** — `LiveClassProvider` enum, `meetingUrl`/`meetingProvider`,
      nullable `roomName`, `LiveClassDefaultLink` (set-once-&-reuse per subject+section+term).
      Applied additively to prod Neon (`prisma/migrations/20260604000000_add_live_class_dual_provider`).
- [x] **External provider** create/start/end — skips the SFU, stores the meeting URL;
      per-session override → stable default link. Room route redirects external → URL.
- [x] **Provider gating** — `isLiveKitConfigured()` on the schedule form (built-in-video
      option) + room route; external path always on.
- [x] **Timetable "Join live class" button** (the deferred Phase 2) — `getTodaySchedule()`
      attaches a Join target per slot (`attachLiveClasses` in `timetable/live-class-join.ts`);
      `LiveJoinButton` renders on the Current/Next card in student + teacher views inside
      the live window (`isLiveJoinable`); STUDENT branch now also matches section-based slots.
- [x] **Public docs** — `content/docs-{en,ar}/live-classes.mdx` (dual-provider).
- [x] LiveKit lib + block scaffold + routes + webhook + 2 cron routes.
- [x] Sidebar + dictionaries (en+ar) + RBAC + 6-point notification type sync
      (incl. `dictionaries.ts` `liveClasses` registration) + 12 `LIVE_CLASS_*` codes.
- [x] **181 unit tests** across 13 files — live-classes block + `src/lib/livekit` (154)
      plus the net-new dual-provider coverage: `attachLiveClasses` resolver (8),
      `isLiveJoinable` + `LiveJoinButton` (10), dual-provider validation (+8),
      external-join guard (+1), external create/start/end (+3). + 103 Playwright rows.
- [x] Multi-tenant, webhook, state-machine, token-grant, eligibility integration tests.
- [x] Tenant-leak fix in `getLiveClass` fallback; `Dictionary.liveClasses` typed (casts dropped).
