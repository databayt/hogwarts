// Container entry. Layers the baked, non-secret config (env.json, written by
// scripts/deploy-cloudflare.sh) UNDER whatever the Worker passed in as real
// environment (Worker secrets via envVars). A plain `node` assignment, not a
// shell `source`, so values with `$` or backticks survive untouched.
const fs = require("node:fs")
const path = require("node:path")
const baked = path.join(__dirname, "env.json")
if (fs.existsSync(baked)) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(baked, "utf8")))) {
    if (process.env[k] === undefined) process.env[k] = v
  }
}
process.env.HOSTNAME = "0.0.0.0"          // Docker sets HOSTNAME to the container id; Next binds to it
process.env.PORT = process.env.PORT || "3000"
process.env.NODE_ENV = "production"
require("./server.js")
