# whatsapp — working notes

- **Where Evolution runs**: inside the balqalam container, loopback only. Do
  not add a Worker route, DNS record or second container for it — the whole
  point is $0 and no public surface. Read `cf/entry.cjs` before changing env.
- **Never run a second live bridge against the `evolution` database** (smoke,
  local docker, a second deploy): WhatsApp drops the older device and the
  school has to re-scan. `EVOLUTION_EMBEDDED=0` is the guard.
- **The webhook secret is ours**: `WHATSAPP_WEBHOOK_SECRET` rides as `?secret=`
  on the URL hogwarts registers with Evolution; rotating it needs a re-Connect
  per school so the instance learns the new URL.
- **Every deploy restarts the bridge**; it reconnects from Neon. A deploy
  during a school's send burst delays messages by the reconnect time (tens of
  seconds), it does not lose them.
- Block protocol: update this file, `README.md`, `ISSUE.md` and
  `content/docs-*/messaging.mdx` after work here.
