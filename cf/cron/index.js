// hogwarts-cron — the scheduler, deliberately a SEPARATE Worker.
//
// The main `hogwarts` Worker is container-backed, and Cloudflare never invoked
// its `scheduled()` handler: 16 triggers were registered and visible in the
// dashboard with next-run times, yet observability recorded zero events with
// `eventType: scheduled` against hundreds of `fetch` ones (2026-09-07, verified
// with a deliberate every-minute probe). This Worker has no container and no
// Durable Object, and calls the app's cron routes over plain HTTPS instead.
//
// It targets the workers.dev hostname on purpose: hitting balqalam.com would
// re-enter the zone route, and that hostname's regional addresses are blocked
// on some networks. Auth is the same CRON_SECRET bearer the routes already
// expect, so nothing in the app changes.
import crons from "./crons.json"

const ORIGIN = "https://hogwarts.osmanabdout.workers.dev"

export default {
  // GET /?probe=<cron expression> reports what a schedule would run — no calls made.
  async fetch(request, env) {
    const cron = new URL(request.url).searchParams.get("probe")
    const body = cron
      ? { cron, routes: crons.schedules[cron] ?? [] }
      : { worker: "hogwarts-cron", schedules: Object.keys(crons.schedules).length, routes: Object.values(crons.schedules).flat().length }
    return Response.json(body)
  },

  async scheduled(controller, env, ctx) {
    const paths = crons.schedules[controller.cron] ?? []
    if (paths.length === 0) {
      console.log(JSON.stringify({ cron: controller.cron, note: "no routes mapped" }))
      return
    }
    const run = async (path) => {
      const started = Date.now()
      try {
        const res = await fetch(ORIGIN + path, {
          method: "GET",
          headers: { authorization: `Bearer ${env.CRON_SECRET}`, "user-agent": "hogwarts-cron/1" },
          signal: AbortSignal.timeout(120_000),
        })
        console.log(JSON.stringify({ cron: controller.cron, path, status: res.status, ms: Date.now() - started }))
      } catch (e) {
        console.error(JSON.stringify({ cron: controller.cron, path, error: String(e), ms: Date.now() - started }))
      }
    }
    // Sequential: the container is a single instance, and a 15-minute tick can
    // fan out to five jobs that each hit the same database.
    ctx.waitUntil((async () => { for (const p of paths) await run(p) })())
  },
}
