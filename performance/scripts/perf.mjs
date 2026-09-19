// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `pnpm perf` — probe, browser flows under the phone profile, report: one
 * target for every step, so a report never blends two systems.
 *
 *   pnpm perf                                  # production (read-only, the demo tenant)
 *   pnpm perf -- --target local --roles admin  # a local production build on :3000
 *
 * Every other argument is passed to the browser flows.
 */
import { spawnSync } from "node:child_process"
import path from "node:path"

import { arg, labRoot, runStamp } from "./lib.mjs"

const target = arg("target", "prod")
const out = path.resolve(arg("out") || path.join(labRoot, "reports", `${runStamp()}-${target}`))
const passthrough = process.argv.slice(2).filter((a, i, all) => !["--target", "--out"].includes(a) && !["--target", "--out"].includes(all[i - 1]) && !/^--(target|out)=/.test(a))
const step = (script, args) => {
  const r = spawnSync(process.execPath, [path.join(labRoot, script), "--target", target, "--out", out, ...args], { stdio: "inherit" })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

step("scripts/probe.mjs", [])
step("playwright/run.mjs", ["--profile", "mobile", ...passthrough])
const report = spawnSync(process.execPath, [path.join(labRoot, "scripts/report.mjs"), "--run", out], { stdio: "inherit" })
process.exit(report.status ?? 0)
