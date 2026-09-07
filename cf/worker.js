// The Worker in front of the hogwarts container. One always-on instance; every
// request is forwarded as-is (Host header included — src/proxy.ts and cookie
// scoping read it). Cron triggers (wrangler.jsonc) call the app's /api/cron/*
// routes inside the container with the CRON_SECRET bearer, on the schedules in
// cf/crons.json — the same table Vercel ran, minus the 7 jobs that stay on
// GitHub Actions so nothing runs twice.
import { Container, getContainer } from "@cloudflare/containers"
import crons from "./crons.json"

export class HogwartsContainer extends Container {
  defaultPort = 3000
  // A cold boot of this app is tens of seconds; keep the instance warm.
  sleepAfter = "24h"

  constructor(ctx, env) {
    super(ctx, env)
    // Every string binding (Worker secrets + vars) becomes container env.
    // Applied at container start only — rotating a secret needs a restart.
    this.envVars = Object.fromEntries(
      Object.entries(env).filter(([, v]) => typeof v === "string")
    )
  }
}

export default {
  async fetch(request, env) {
    return getContainer(env.HOGWARTS, "main").fetch(request)
  },

  async scheduled(controller, env, ctx) {
    const paths = crons.schedules[controller.cron] ?? []
    if (paths.length === 0) { console.log("cron: no routes for", controller.cron); return }
    const container = getContainer(env.HOGWARTS, "main")
    const run = async (path) => {
      const started = Date.now()
      try {
        const res = await container.fetch(new Request("https://balqalam.com" + path, {
          method: "GET",
          headers: { authorization: "Bearer " + env.CRON_SECRET, "user-agent": "cloudflare-cron/1", host: "balqalam.com" },
        }))
        console.log(JSON.stringify({ cron: controller.cron, path, status: res.status, ms: Date.now() - started }))
      } catch (e) {
        console.error(JSON.stringify({ cron: controller.cron, path, error: String(e), ms: Date.now() - started }))
      }
    }
    ctx.waitUntil(Promise.all(paths.map(run)))
  },
}
