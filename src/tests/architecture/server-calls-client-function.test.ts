// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// A server file must not CALL a function exported from a "use client" file.
//
// React lets a server component render a client component, but calling a plain
// function that lives in a client file throws at render time: "Attempted to
// call x() from the server but x is on the client". The typecheck passes, the
// unit tests pass, `next build` passes — the page dies when someone opens it.
// On 2026-11-22 the class details page was one deploy away from that
// (`resolveClassLinkLabels` sat beside its form in a client file); it was caught
// only by opening the page. The fix is always the same: move the function to a
// file without "use client" (see `live/class-link-labels.ts`,
// `notifications/class-alerts-labels.ts`).
//
// This is a ratchet. The scan is textual, so a file that never says
// "use client" but is only ever imported by client code shows up as "server":
// those are listed in KNOWN and are not faults. A NEW entry is either a real
// fault (move the function) or another such file (add it here, with the reason).
import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, normalize } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = join(process.cwd(), "src")

/** file → function, for callers that are client code in practice. */
const KNOWN = new Set([
  // rendered inside client sections of the marketing features page
  "components/saas-marketing/features/sections/feature-showcase.tsx → getIconComponent",
  // the receipts table's content is mounted by a client table shell
  "components/saas-dashboard/billing/receipts/content.tsx → getReceiptColumns",
  // a toast helper, imported by client components only
  "lib/toast-utils.ts → confirmDeleteDialog",
])

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "tests" || name.startsWith(".")) {
      continue
    }
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (
      /\.tsx?$/.test(name) &&
      !/\.(test|spec)\.tsx?$/.test(name) &&
      !name.endsWith(".d.ts")
    ) {
      out.push(full)
    }
  }
  return out
}

const clientCache = new Map<string, boolean>()
function isClient(file: string): boolean {
  let v = clientCache.get(file)
  if (v === undefined) {
    let head = ""
    try {
      head = readFileSync(file, "utf8").slice(0, 400)
    } catch {
      head = ""
    }
    v = /^\s*["']use client["']/m.test(head)
    clientCache.set(file, v)
  }
  return v
}

function resolve(spec: string, from: string): string | null {
  const base = spec.startsWith("@/")
    ? join(ROOT, spec.slice(2))
    : spec.startsWith(".")
      ? normalize(join(dirname(from), spec))
      : null
  if (!base) return null
  for (const c of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts"),
  ]) {
    try {
      if (statSync(c).isFile()) return c
    } catch {
      // not this candidate
    }
  }
  return null
}

function scan(): string[] {
  const hits: string[] = []
  for (const file of walk(ROOT)) {
    if (isClient(file)) continue
    const src = readFileSync(file, "utf8")
    const imports = src.matchAll(
      /import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']([^"']+)["']/g
    )
    for (const m of imports) {
      if (m[1]) continue
      const target = resolve(m[3], file)
      if (!target || !isClient(target)) continue
      for (const raw of m[2].split(",")) {
        const part = raw.trim()
        if (!part || part.startsWith("type ")) continue
        const name = part.split(" as ").pop()!.trim()
        // Components (Capitalised) are rendered, hooks cannot run on the
        // server at all and fail loudly elsewhere.
        if (!/^[a-z]/.test(name) || name.startsWith("use")) continue
        const called = new RegExp(`(?<![.\\w])${name}\\s*\\(`).test(src)
        if (called) hits.push(`${file.slice(ROOT.length + 1)} → ${name}`)
      }
    }
  }
  return hits
}

describe("server files do not call functions that live in client files", () => {
  it("adds no new call from a server file into a \"use client\" file", () => {
    const fresh = scan().filter((h) => !KNOWN.has(h))
    expect(
      fresh,
      "Move the function to a file without \"use client\" (or, if the caller is client code in practice, add it to KNOWN with the reason)"
    ).toEqual([])
  })

  it("the scan sees the pattern it guards (its own fixture)", () => {
    expect(isClient(join(ROOT, "components/school-dashboard/live/class-link-form.tsx"))).toBe(true)
    expect(isClient(join(ROOT, "components/school-dashboard/live/class-link-labels.ts"))).toBe(false)
  })
})
