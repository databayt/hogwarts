# Offline block — agent notes

- The worker is hand-rolled on purpose. Do not migrate to Serwist: a 30 MB app's whole-bundle precache is hostile to Sudan mobile data, and the outbox-wake `sync`/`message` handlers would be lost.
- `src/app/manifest.ts` is dynamic (reads `headers()`); the proxy never runs for it. Resolve the tenant from the Host, keep `start_url` relative.
- Adding an outbox kind: union `OutboxKind` in `src/lib/offline/db.ts`, add the payload schema and `case` in `api/offline/sync/route.ts`, put the logic in a plain (non-`"use server"`) `*-core.ts` the online action also calls, and label the kind in `outbox-view.tsx` (`lumos-{ar,en}.json` → `offline.kind*`).
- Every user-facing string goes through the dictionaries; `pnpm i18n:validate` gates the build.
- `next dev` never registers the worker. Verify with `next build && next start` and `NEXT_PUBLIC_SW_DEV=1`, or against the demo tenant.
- Rule that auto-loads on the worker file: kun `next-16/sw-no-authenticated-cache` — pages may be cached ONLY inside the `x-session-key` namespace; a response with another key or none drops the rest first. Do not "fix" the page cache back to network-only; do not key anything on the URL alone.
- Never set a cookie on every proxy response. Next merges proxy-set cookies into the request store's mutable cookies, so every Server Action re-renders and re-sends the whole page (1.1 MB on the dashboard). `setLocaleCookie` in `src/proxy.ts` writes only on change.
- Adding a sidebar route: give it a `loading.tsx`, or its link is never prefetched and the tap shows nothing until the server answers.
- Static assets are edge-cached by `cf/worker.js` (paths in `EDGE_CACHEABLE`, only when the origin says `public` with a max-age). A file that must stay fresh keeps `max-age=0`.
