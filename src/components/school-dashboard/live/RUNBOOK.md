# Conference — LiveKit Provisioning Runbook

> **Scope:** turn the dormant LiveKit SFU path **on**. The application code is complete and ships
> gated; until an SFU is reachable, `getLiveKitReadiness().configured === false` and the feature
> serves only the **external pasted-link** path.
>
> **Readiness gate in code:** `getLiveKitReadiness()` in
> [`livekit/client.ts`](./livekit/client.ts) reports exactly which env vars are still missing; the
> admin **Network test** page (`/live/network-test`, DEV/ADMIN) renders that list.

---

## Two paths, and which one you want

The six gates below were written for the **Aldar UAE pilot**: a self-hosted SFU on G42 Cloud, in
region, because PDPL made data residency the binding constraint. That is a real requirement for that
customer and the sequence is preserved for them.

It is not the requirement for the schools live today, which are Sudanese and served from
`balqalam.com`. For those, a **managed SFU** collapses most of the sequence:

| Gate               | Self-host (Aldar / G42)                                     | LiveKit Cloud                     |
| ------------------ | ----------------------------------------------------------- | --------------------------------- |
| 1 — SFU            | provision a VM, install `livekit-server`, TLS               | project signup, ~10 min           |
| 2 — TURN/443       | install + configure coturn (**the biggest in-region risk**) | **included**                      |
| 3 — S3 recording   | bucket + split IAM                                          | optional; only needed to record   |
| 4 — webhook        | edit the server config                                      | paste the URL in project settings |
| 5 — env vars       | 8 vars                                                      | **4 vars** for rooms              |
| 6 — in-school test | required before signature                                   | still worth running               |

**Recording is no longer a prerequisite for holding a call.** `LIVEKIT_RECORDING_BUCKET` used to sit
in `REQUIRED_ENV`, so `isLiveKitConfigured()` stayed false — and the entire video feature stayed
dark — until someone provisioned S3. Rooms and recording now report separately
(`isLiveKitConfigured()` vs `isRecordingConfigured()`), and "rooms ready, recording off" is a normal
shipping state.

### Quick path — LiveKit Cloud

1. Create a project at livekit.io. The free tier is $0 with no card.
2. Set four vars in the central `.env` and in the Vercel project (Production):

   ```bash
   LIVEKIT_HOST=https://<project>.livekit.cloud
   LIVEKIT_WS_URL=wss://<project>.livekit.cloud
   LIVEKIT_API_KEY=...
   LIVEKIT_API_SECRET=...
   ```

   **Trim trailing newlines.** Vercel stores them, and eight production values already carried one
   (see `DEPLOYMENT.md`). Never create `.env.local` / `.env.*` — project rule.

3. Register the webhook URL in the project's settings: `https://ed.databayt.org/api/webhooks/livekit`.
4. Redeploy (`./scripts/deploy-hobby.sh` while on the free account — **not** `git push`).
5. Open `/live/network-test` as an ADMIN and confirm nothing is listed as missing.
6. Flip the school to LiveKit on `/live/settings` — `School.conferenceProviderDefault`
   defaults to `external`, so a configured SFU does nothing until a school opts in.

**Three traps, all hit for real on 2026-08-29 while provisioning this.**

1. **The signup's auto-created key has an unretrievable secret.** LiveKit shows a
   secret once, at creation; the existing key's menu offers only _Generate Token_
   and _Revoke key_. Create a **second, named** key and use that pair.
2. **The webhook form has a required "Signing API key" picker**, and every key in
   the project appears in it. Pick the key whose secret you put in
   `LIVEKIT_API_SECRET`. Choosing another produces a webhook that looks correctly
   configured and silently fails every HMAC check — a room opens, the session
   never leaves `scheduled`, and nothing logs an error worth reading.
3. **Two different Vercel accounts each have a project named `hogwarts`.** The
   blocked Pro team's is `prj_jI7ezom5AbJfMbeB8F9lquA94OMP`; the live free one is
   `prj_KEuI2aVzMHIeBkjVcpK7KQvWGIJe`. The names give no warning. **Confirm by
   project ID.**

**Vercel "Sensitive" env vars are write-only.** Setting `LIVEKIT_API_KEY` /
`LIVEKIT_API_SECRET` as Sensitive is right, but nothing can read them back
afterwards — not the dashboard, not `vercel env pull` (which returns an empty
value). So a typo there is invisible until a deploy fails to open a room. Set them
by piping a value you have already tested:

```bash
printf '%s' "$VALUE" | vercel env add LIVEKIT_API_SECRET production --sensitive --force --scope databayt
```

`vercel env ls` shows the **created** time, not the last-modified time — an
unchanged timestamp after an override is expected, not a failed write.

**Know what the free tier buys.** 5,000 WebRTC minutes/month, 100 concurrent connections, 1,000
recording minutes. One 25-student, 45-minute class costs ~1,125 participant-minutes — so this
verifies the feature and runs a demo or a small pilot, and it does **not** run a school. Real volume
means the paid tier or a self-hosted `livekit-server` on any VM. The code is identical either way;
only the values in those four vars change.

To add recording later: set `LIVEKIT_RECORDING_BUCKET` plus `LIVEKIT_S3_ACCESS_KEY` /
`LIVEKIT_S3_SECRET`. A managed SFU has **no instance IAM role**, so the empty-credential fallback
documented in Gate 3 does not apply to it — without those two vars, egress starts and then fails to
upload, leaving a `ConferenceRecording` row `pending` with nothing to sweep it. `isRecordingConfigured()`
gates the auto-egress branch on the bucket; supply the credentials with it.

---

## Self-hosted path (Aldar / G42, UAE) — the six gates

> **Who runs this:** an operator with G42 Cloud + AWS + Vercel access. It is written to be executable
> by a human or a computer-use agent. The agent driving this repo **cannot** perform these steps
> (no cloud credentials / no in-school network access).

---

## Gate 1 — Provision the SFU (G42 Cloud, UAE region)

A single `livekit-server` binary. Pin to UAE region for PDPL data-path.

1. Provision a VM (≥ 4 vCPU / 8 GB) in G42 Cloud, UAE.
2. Install LiveKit server (`curl -sSL https://get.livekit.io | bash`).
3. Open ports: **UDP 50000–60000** (media), **TCP 7881** (TCP media), **TCP 443** (TURN/TLS — Gate 2).
4. Generate an API key/secret pair (`livekit-server generate-keys`). Keep for Gate 5.
5. Front the HTTPS API + WS with a TLS cert (Let's Encrypt or Aldar-provisioned).

**Check:** `curl https://<sfu-host>/` returns the LiveKit health response over TLS.

## Gate 2 — TURN-over-443-TCP (coturn, co-located)

UAE networks throttle UDP VoIP; the fallback must look like HTTPS. **This is the single biggest
in-region risk** — do not skip.

1. Install coturn on the SFU host (or alongside).
2. Configure TLS listener on **TCP 443** with the same cert as Gate 1.
3. Point LiveKit's `turn` config at coturn; enable `turn.tls_port: 443`.
4. The `livekit-client` SDK auto-falls-back to TURN/443/TCP when UDP fails (no app change).

**Check:** from a UDP-blocked network, a test connection still establishes; the join writes
`ConferenceParticipant.hadTcpFallback = true` (telemetry captured by the webhook + room client).

## Gate 3 — AWS S3 `me-central-1` bucket + IAM

Egress recordings land here; retention is per-school (`School.conferenceRetentionDays`, PDPL).

1. Create an S3 bucket in **`me-central-1`** (e.g. `aldar-recordings-me-central-1`).
2. **SFU-side IAM** (egress writes): `s3:PutObject` scoped to the `schools/*` prefix **only**
   (matches the egress filepath `schools/{schoolId}/live-class/{sessionId}/{ts}.mp4` in
   [`livekit/egress.ts`](./livekit/egress.ts)).
3. **App-side IAM** (playback signing): `s3:GetObject` only. Keep it **separate** from the SFU creds
   so a compromised SFU can't read existing recordings.
4. Lifecycle: optional S3 lifecycle rule as a backstop; the `/api/cron/expire-live-recordings` cron
   is the primary retention enforcer.

**Check:** the SFU IAM principal can `PutObject` under `schools/`; the app principal can `GetObject`
and **cannot** `PutObject`.

## Gate 4 — Register the webhook URL

The SFU is the authoritative writer for `live`/`ended` + recording rows.

1. In the LiveKit server config, set the webhook URL to
   **`https://ed.databayt.org/api/webhooks/livekit`** (the route in
   `src/app/api/webhooks/livekit/route.ts`).
2. Use the same API key/secret as Gate 1 — the route's `verifyWebhook` checks the HMAC signature.

**Check:** start a room; `room_started` arrives and flips the `Conference` row to `live` (and, when
`recordingEnabled`, auto-starts egress — Wave 2). A `ConferenceEvent` audit row is written.

## Gate 5 — Set the environment variables (Vercel + dev)

`getLiveKitReadiness()` flips `configured: true` on the required **four**; the recording vars are
reported separately and do not gate a room.

```bash
LIVEKIT_HOST=https://<sfu-host>            # SFU HTTPS API        (required)
LIVEKIT_WS_URL=wss://<sfu-host>            # SFU WebSocket        (required)
LIVEKIT_API_KEY=...                        # from Gate 1          (required)
LIVEKIT_API_SECRET=...                     # from Gate 1          (required)
LIVEKIT_RECORDING_BUCKET=aldar-recordings-me-central-1  # recording only
LIVEKIT_RECORDING_REGION=me-central-1      # defaults to me-central-1 if unset
LIVEKIT_S3_ACCESS_KEY=...                  # SFU egress IAM (else host role)
LIVEKIT_S3_SECRET=...                      # SFU egress IAM (else host role)
```

Set in Vercel project env (Production + Preview) and the central `.env` for dev. **Never** create
`.env.local`/`.env.*` files (project rule). The app-side `AWS_*` creds (playback signing) are
separate and already configured.

**Check:** `/live/network-test` (as `admin@…`) no longer lists any missing var.

## Gate 6 — Meeting-3 in-school network test (BLOCKING)

The pre-signature gate. **Must be run from inside an Aldar school's WiFi**, not an office/VPN.

1. Open `/live/network-test` as `admin@kingfahad.databayt.org` on the school network.
2. Run the test. It establishes a calibration LiveKit connection and records setup time, connection
   quality, and **TCP-fallback usage** into `ConferenceParticipant.{avgRttMs, hadTcpFallback,
lastIceState}`.
3. **Block production cutover on any TURN/443 failure** — if media can't establish or TCP fallback
   fails, return to Gate 2.

**Check:** the test reports "Connected" with acceptable setup time from inside the school.

---

## Cutover checklist

- [ ] Gate 1 — SFU reachable over TLS (G42, UAE)
- [ ] Gate 2 — TURN/443/TCP fallback verified from a UDP-blocked network
- [ ] Gate 3 — S3 `me-central-1` bucket + split SFU/app IAM
- [ ] Gate 4 — webhook registered; `room_started` flips `live` + audit row
- [ ] Gate 5 — the 4 room vars set (+ recording vars if recording); network-test lists no missing var
- [ ] Gate 6 — Meeting-3 in-school test passes (no TURN/443 failure)

When all six are green, LiveKit serves live in-app rooms + recordings; schools without infra keep
the external pasted-link path automatically (the `provider` discriminator + `isLiveKitConfigured()`
gate need no further change).

## Disaster recovery

- **SFU down:** LiveKit Cloud is the DR fallback for the self-hosted deployment — repoint
  `LIVEKIT_HOST`/`LIVEKIT_WS_URL` + keys; note the data path leaves UAE (PDPL consideration for
  Aldar specifically, not for the balqalam.com schools that run on Cloud by default).
- **Recordings storage:** the schema carries `s3Bucket`/`s3Region` per `ConferenceRecording` row, so
  an on-prem **MinIO** swap is a per-school config change, not a migration.

## References

- Gate state: `getLiveKitReadiness()` / `isLiveKitConfigured()` — `livekit/client.ts`
- Egress path + S3 output — `livekit/egress.ts`
- Webhook ingestion — `src/app/api/webhooks/livekit/route.ts`
- Retention cron — `src/app/api/cron/expire-live-recordings/route.ts`
- Tracker: [databayt/hogwarts#3](https://github.com/databayt/hogwarts/issues/3) (Aldar Epic 03)
