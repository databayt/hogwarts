// Split a dotenv file (e.g. `vercel env pull`) into what the container lane needs.
//
//   node cf/env-split.mjs <dotenv> secrets   → JSON object of secret-classified vars (wrangler secret bulk)
//   node cf/env-split.mjs <dotenv> config    → JSON object of everything else (baked into the image as env.json)
//   node cf/env-split.mjs <dotenv> docker    → KEY=VALUE lines, all vars (docker run --env-file, local smoke only)
//   node cf/env-split.mjs <dotenv> names     → one name per line with its class, no values
//   node cf/env-split.mjs <dotenv> run -- <cmd…>  → run a command with the vars in its environment
//                                              (no shell sourcing: values with $ or backticks survive)
//
// Drops empty values (Vercel drops them at build time; z.string().min(1).optional()
// rejects "") and Vercel/Turbo/Nx build noise. Never prints values except in the
// modes that exist to carry them.
import fs from "node:fs"
import { spawnSync } from "node:child_process"

const [file, mode = "names"] = process.argv.slice(2)
if (!file) { console.error("usage: env-split.mjs <dotenv> secrets|config|docker|names"); process.exit(2) }

export const isSecret = (name) =>
  !name.startsWith("NEXT_PUBLIC_") &&
  /(SECRET|TOKEN|_KEY$|API_KEY|PASSWORD|PRIVATE|DATABASE_URL|DIRECT_URL|ACCESS_KEY|WEBHOOK)/.test(name)

export function parse(path) {
  const out = {}
  for (const raw of fs.readFileSync(path, "utf8").split("\n")) {
    const m = raw.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    v = v.replace(/\\n$/, "")            // Vercel stores a trailing newline in some values
    if (v === "") continue
    if (/^(VERCEL|TURBO_|NX_)/.test(m[1])) continue
    out[m[1]] = v
  }
  return out
}

const all = parse(file)
const secrets = Object.fromEntries(Object.entries(all).filter(([k]) => isSecret(k)))
const config = Object.fromEntries(Object.entries(all).filter(([k]) => !isSecret(k)))
if (mode === "secrets") process.stdout.write(JSON.stringify(secrets))
else if (mode === "config") process.stdout.write(JSON.stringify(config, null, 1))
else if (mode === "docker") process.stdout.write(Object.entries(all).map(([k, v]) => `${k}=${v}`).join("\n") + "\n")
else if (mode === "run") {
  const cmd = process.argv.slice(process.argv.indexOf("--") + 1)
  const r = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit", env: { ...process.env, ...all } })
  process.exit(r.status ?? 1)
}
else for (const k of Object.keys(all).sort()) console.log(`${isSecret(k) ? "secret" : "config"}  ${k}`)
