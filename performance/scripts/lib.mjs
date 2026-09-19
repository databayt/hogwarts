// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/** Shared helpers for the performance lab scripts. No dependencies. */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const labRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
)

/** `--name value` or `--name=value`; bare `--flag` → "true". */
export function arg(name, fallback) {
  const argv = process.argv.slice(2)
  const eq = argv.find((a) => a.startsWith(`--${name}=`))
  if (eq) return eq.slice(name.length + 3)
  const i = argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = argv[i + 1]
  return next && !next.startsWith("--") ? next : "true"
}

export const list = (value) =>
  value
    ? String(value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null

export const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"))

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export const fmtKB = (bytes) =>
  bytes == null ? "—" : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`

export const fmtMs = (ms) =>
  ms == null || Number.isNaN(ms) ? "—" : `${Math.round(ms)} ms`

/** Nearest-rank percentile of an unsorted numeric array. */
export function percentile(values, q) {
  const v = values.filter((n) => typeof n === "number" && !Number.isNaN(n))
  if (v.length === 0) return null
  const sorted = [...v].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]
}

export const median = (values) => percentile(values, 0.5)

/** Plain-text table, columns padded to their widest cell. */
export function table(head, rows) {
  const all = [head, ...rows].map((r) => r.map((c) => String(c ?? "—")))
  const widths = head.map((_, i) => Math.max(...all.map((r) => r[i].length)))
  const line = (r) => r.map((c, i) => c.padEnd(widths[i])).join("  ")
  return [line(all[0]), widths.map((w) => "─".repeat(w)).join("  ")]
    .concat(all.slice(1).map(line))
    .join("\n")
}

/** GitHub-flavoured markdown table. */
export function mdTable(head, rows) {
  const esc = (c) => String(c ?? "—").replace(/\|/g, "\\|")
  return [
    `| ${head.map(esc).join(" | ")} |`,
    `| ${head.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
  ].join("\n")
}

/** `2026-09-19T07-45` — sortable, filesystem-safe. */
export const runStamp = () =>
  new Date().toISOString().slice(0, 16).replace(":", "-")
