# Offline block — agent notes

- The worker is hand-rolled on purpose. Do not migrate to Serwist: a 30 MB app's whole-bundle precache is hostile to Sudan mobile data, and the outbox-wake `sync`/`message` handlers would be lost.
- `src/app/manifest.ts` is dynamic (reads `headers()`); the proxy never runs for it. Resolve the tenant from the Host, keep `start_url` relative.
- Adding an outbox kind: union `OutboxKind` in `src/lib/offline/db.ts`, add the payload schema and `case` in `api/offline/sync/route.ts`, put the logic in a plain (non-`"use server"`) `*-core.ts` the online action also calls, and label the kind in `outbox-view.tsx` (`lumos-{ar,en}.json` → `offline.kind*`).
- Every user-facing string goes through the dictionaries; `pnpm i18n:validate` gates the build.
- `next dev` never registers the worker. Verify with `next build && next start` and `NEXT_PUBLIC_SW_DEV=1`, or against the demo tenant.
- Rule that auto-loads on the worker file: kun `next-16/sw-no-authenticated-cache`.
