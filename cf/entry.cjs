// Container entry. Layers the baked, non-secret config (env.json, written by
// scripts/deploy-cloudflare.sh) UNDER whatever the Worker passed in as real
// environment (Worker secrets via envVars). A plain `node` assignment, not a
// shell `source`, so values with `$` or backticks survive untouched.
const fs = require("node:fs")
const path = require("node:path")
const { spawn } = require("node:child_process")

const baked = path.join(__dirname, "env.json")
if (fs.existsSync(baked)) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(baked, "utf8")))) {
    if (process.env[k] === undefined) process.env[k] = v
  }
}
process.env.HOSTNAME = "0.0.0.0"          // Docker sets HOSTNAME to the container id; Next binds to it
process.env.PORT = process.env.PORT || "3000"
process.env.NODE_ENV = "production"

startEvolution()
require("./server.js")

// ---- Evolution API (the WhatsApp bridge) as a supervised child process ----
// Runs inside this container on 127.0.0.1:8080 and is never exposed: hogwarts
// reaches it over loopback (EVOLUTION_API_URL) and Evolution calls back on the
// public webhook URL. It gets its own heap cap so a bridge spike cannot take
// the school app down, is restarted with backoff when it exits, and is skipped
// in the smoke run (EVOLUTION_EMBEDDED=0) so a second live bridge never fights
// production for the same WhatsApp session. Its env is built from an allowlist
// plus the Evolution mapping — the bridge has no business holding the app's
// other secrets.
function startEvolution() {
  const log = (m) => console.log(`[evolution] ${m}`)
  const apiKey = process.env.EVOLUTION_API_KEY
  const dbUrl = process.env.EVOLUTION_DATABASE_URL
  if (process.env.EVOLUTION_EMBEDDED === "0") return log("disabled (EVOLUTION_EMBEDDED=0)")
  if (!apiKey || !dbUrl) return log("not started: EVOLUTION_API_KEY / EVOLUTION_DATABASE_URL missing")
  if (!fs.existsSync("/evolution/dist/main.js")) return log("not started: /evolution is not in this image")

  const env = {}
  for (const k of ["PATH", "HOME", "LANG", "TZ", "NODE_ENV"]) if (process.env[k] !== undefined) env[k] = process.env[k]
  Object.assign(env, {
    DOCKER_ENV: "true",
    NODE_OPTIONS: "--max-old-space-size=768",
    SERVER_PORT: "8080",
    SERVER_URL: process.env.EVOLUTION_SERVER_URL || "http://127.0.0.1:8080",
    AUTHENTICATION_API_KEY: apiKey,
    AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "false",
    DATABASE_PROVIDER: "postgresql",
    DATABASE_CONNECTION_URI: dbUrl,
    DATABASE_URL: dbUrl,
    DATABASE_CONNECTION_CLIENT_NAME: "balqalam",
    CACHE_REDIS_ENABLED: "false",
    CACHE_LOCAL_ENABLED: "true",
    WEBHOOK_GLOBAL_ENABLED: "false",
    S3_ENABLED: "false",
    CONFIG_SESSION_PHONE_CLIENT: "balqalam",
    CONFIG_SESSION_PHONE_NAME: "Chrome",
    LOG_LEVEL: "ERROR,WARN,INFO",
    LOG_COLOR: "false",
    LANGUAGE: "en",
    DEL_INSTANCE: "false",
    QRCODE_LIMIT: "30",
  })
  const opts = { cwd: "/evolution", env, stdio: ["ignore", "inherit", "inherit"] }

  let stopping = false
  let attempt = 0
  let child = null
  const retry = (why) => {
    if (stopping) return
    const wait = Math.min(60_000, 5_000 * 2 ** Math.min(attempt++, 4))
    log(`${why}; restart in ${wait / 1000}s`)
    setTimeout(run, wait)
  }
  const run = () => {
    // One-shot: apply pending migrations (prisma migrate deploy), then serve.
    const migrate = spawn("npm", ["run", "db:deploy", "--silent"], opts)
    migrate.on("error", (e) => retry(`migrate spawn failed: ${e.message}`))
    migrate.on("exit", (code) => {
      if (stopping) return
      if (code !== 0) return retry(`migrate deploy exited ${code}`)
      child = spawn("node", ["dist/main"], opts)
      log(`started (pid ${child.pid}) on 127.0.0.1:8080`)
      const stable = setTimeout(() => { attempt = 0 }, 60_000)
      child.on("error", (e) => { clearTimeout(stable); retry(`spawn failed: ${e.message}`) })
      child.on("exit", (c, sig) => { clearTimeout(stable); child = null; retry(`exited (${c ?? sig})`) })
    })
  }
  for (const sig of ["SIGTERM", "SIGINT"]) {
    process.on(sig, () => { stopping = true; if (child) child.kill(sig) })
  }
  run()
}
