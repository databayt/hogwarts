# whatsapp — the school's WhatsApp line (Evolution API bridge)

Connects one WhatsApp number per school to the app: pairing by QR from the
dashboard, outbound sends (notifications, opening messages, media, groups) and
inbound messages into the messaging block via a webhook.

## How it runs (production, since 2026-09-13)

- **Evolution API is embedded in the balqalam Cloudflare container** — a second
  process supervised by `cf/entry.cjs`, built in the `evolution` stage of the
  root `Dockerfile` from the pinned release (`ARG EVOLUTION_VERSION`). It
  listens on `127.0.0.1:8080` and is never exposed. Cost: $0 on top of the
  container already paid for (a second container is billed on provisioned
  memory). Heap capped at 768 MiB; Next at 2 GiB; both inside the 4 GiB
  `standard-1` instance.
- **State** lives in the Neon database `evolution` (same project as the app,
  `EVOLUTION_DATABASE_URL`, direct host — `prisma migrate deploy` runs at every
  boot). The paired session survives restarts and deploys; every hogwarts
  deploy restarts the bridge, which reconnects from the saved credentials.
- **Wiring**: `EVOLUTION_API_URL=http://127.0.0.1:8080` (config, baked),
  `EVOLUTION_API_KEY` (secret), `WHATSAPP_WEBHOOK_BASE_URL=https://balqalam.com`
  + `WHATSAPP_WEBHOOK_SECRET` (the `?secret=` on the webhook URL registered at
  `instance/create` — hogwarts-internal, not a Meta value). All in the Keychain
  overlay `cf-hogwarts-<VAR>`.
- **Smoke runs never start the bridge** (`EVOLUTION_EMBEDDED=0`): a second live
  Evolution on the same database would fight production for the session.

## Files

- `actions.ts` — connect (create instance + QR), status, disconnect; builds the
  webhook URL from `WHATSAPP_WEBHOOK_BASE_URL`.
- `src/lib/whatsapp/evolution-client.ts` — the REST client (`apikey` header,
  retries, `/instance/*`, `/message/*`, `/group/*`).
- `src/app/api/webhooks/whatsapp/route.ts` — inbound: verifies `?secret=`,
  maps `body.instance` → `WhatsAppSession.schoolId`, writes messages.
- `cf/entry.cjs` — the supervisor; `Dockerfile` — the build stage.

## Operating

- Pair: school dashboard → WhatsApp → Connect → scan the QR with the school's
  phone (a human step; the session is per phone).
- Health: `/api/health` → `checks.whatsappBridge` (`pass` when the loopback
  root answers; `warn` otherwise — never fails the app).
- Logs: the bridge logs with a `[evolution]` prefix in the container output.
- Rotate `EVOLUTION_API_KEY` / `WHATSAPP_WEBHOOK_SECRET`: Keychain → "push
  rotated hogwarts secrets" (both are read at bridge start; re-Connect once so
  the new webhook secret is registered on the instance).
