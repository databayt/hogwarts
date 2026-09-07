// The Worker in front of the hogwarts container. One always-on instance; every
// request is forwarded as-is (Host header included — src/proxy.ts and cookie
// scoping read it). No cron triggers here on purpose: the GitHub Actions jobs
// keep running and reach the container through the public hostname.
import { Container, getContainer } from "@cloudflare/containers"

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
}
