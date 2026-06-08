# Conference — LiveKit Provisioning Runbook

> **Scope:** turn the dormant LiveKit SFU path **on**. The application code is complete and ships
> gated; until the six gates below are met, `getLiveKitReadiness().configured === false` and the
> feature serves only the **external pasted-link** path. None of these steps are code — they are
> cloud/ops tasks. Run them in order; each ends with a check.
>
> **Who runs this:** an operator with G42 Cloud + AWS + Vercel access. It is written to be executable
> by a human or a computer-use agent. The agent driving this repo **cannot** perform these steps
> (no cloud credentials / no in-school network access).
>
> **Readiness gate in code:** `getLiveKitReadiness()` in
> [`livekit/client.ts`](./livekit/client.ts) reports exactly which env vars are still missing; the
> admin **Network test** page (`/conference/network-test`, DEV/ADMIN) renders that list.

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

All **eight**. `getLiveKitReadiness()` flips `configured: true` only when the required five are set.

```bash
LIVEKIT_HOST=https://<sfu-host>            # SFU HTTPS API        (required)
LIVEKIT_WS_URL=wss://<sfu-host>            # SFU WebSocket        (required)
LIVEKIT_API_KEY=...                        # from Gate 1          (required)
LIVEKIT_API_SECRET=...                     # from Gate 1          (required)
LIVEKIT_RECORDING_BUCKET=aldar-recordings-me-central-1  #         (required)
LIVEKIT_RECORDING_REGION=me-central-1      # defaults to me-central-1 if unset
LIVEKIT_S3_ACCESS_KEY=...                  # SFU egress IAM (else host role)
LIVEKIT_S3_SECRET=...                      # SFU egress IAM (else host role)
```

Set in Vercel project env (Production + Preview) and the central `.env` for dev. **Never** create
`.env.local`/`.env.*` files (project rule). The app-side `AWS_*` creds (playback signing) are
separate and already configured.

**Check:** `/conference/network-test` (as `admin@…`) no longer lists any missing var.

## Gate 6 — Meeting-3 in-school network test (BLOCKING)

The pre-signature gate. **Must be run from inside an Aldar school's WiFi**, not an office/VPN.

1. Open `/conference/network-test` as `admin@kingfahad.databayt.org` on the school network.
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
- [ ] Gate 5 — all 8 env vars set; network-test lists no missing var
- [ ] Gate 6 — Meeting-3 in-school test passes (no TURN/443 failure)

When all six are green, LiveKit serves live in-app rooms + recordings; schools without infra keep
the external pasted-link path automatically (the `provider` discriminator + `isLiveKitConfigured()`
gate need no further change).

## Disaster recovery

- **SFU down:** LiveKit Cloud (Bahrain) is the documented DR fallback — repoint `LIVEKIT_HOST`/
  `LIVEKIT_WS_URL` + keys; note the data path leaves UAE (PDPL consideration).
- **Recordings storage:** the schema carries `s3Bucket`/`s3Region` per `ConferenceRecording` row, so
  an on-prem **MinIO** swap is a per-school config change, not a migration.

## References

- Gate state: `getLiveKitReadiness()` / `isLiveKitConfigured()` — `livekit/client.ts`
- Egress path + S3 output — `livekit/egress.ts`
- Webhook ingestion — `src/app/api/webhooks/livekit/route.ts`
- Retention cron — `src/app/api/cron/expire-live-recordings/route.ts`
- Tracker: [databayt/hogwarts#3](https://github.com/databayt/hogwarts/issues/3) (Aldar Epic 03)
