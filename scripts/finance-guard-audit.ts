// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Static audit of the finance block's two load-bearing invariants, so neither
 * can silently regress:
 *
 *  1. GUARD COVERAGE — every finance route `page.tsx` whose import closure
 *     touches the database must also reach a finance permission gate somewhere
 *     in that closure (the page itself, or the content.tsx it delegates to).
 *     A fat page that queries `db` inline without a gate is exactly the P0 that
 *     let any authenticated student read the payroll (fixed 2026-07-17).
 *
 *  2. DEAD LINKS — every internal `/${lang}/finance/...` <Link> target must
 *     resolve to a real route on disk (Next route groups add no path segment).
 *
 * Closure analysis (not flat grep) is deliberate: the gate is allowed to live
 * in content.tsx under the mirror pattern, so a page that delegates correctly
 * would false-positive under a per-file grep.
 *
 *   npx tsx scripts/finance-guard-audit.ts        # human-readable report
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs"
import { dirname, join, resolve } from "path"

const SRC = resolve(__dirname, "..", "src")
const APP = join(SRC, "app")
const FINANCE_COMPONENTS = join(
  SRC,
  "components",
  "school-dashboard",
  "finance"
)
const EXTS = [".tsx", ".ts", ".jsx", ".js"]

const DB_ACCESS_RE =
  /\bdb\.[a-zA-Z]+\.(findMany|findFirst|findUnique|count|aggregate|groupBy|create|createMany|update|updateMany|upsert|delete|deleteMany)\b/
const GATE_RE =
  /\b(resolveFinanceAccess|requireFinanceActor|checkCurrentUserPermission|checkFinancePermission|checkFinancePermissions)\b/
const IMPORT_RE = /from\s+["']([^"']+)["']/g
const LINK_RE = /`\/\$\{(?:lang|locale)\}(\/finance\/[a-zA-Z0-9/\-[\]${}._]*)`/g

function walk(dir: string, match: (f: string) => boolean, out: string[] = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, match, out)
    else if (match(full)) out.push(full)
  }
  return out
}

/** Resolve an import spec to a local source file, or null for externals. */
function resolveImport(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2))
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec)
  else return null
  for (const ext of EXTS) if (existsSync(base + ext)) return base + ext
  for (const ext of EXTS) {
    const idx = join(base, "index" + ext)
    if (existsSync(idx)) return idx
  }
  if (existsSync(base) && statSync(base).isFile()) return base
  return null
}

/**
 * Files reachable from `entry` via local imports, staying inside the finance
 * block (component dir or the finance route subtree) so the closure is bounded
 * and meaningful rather than the whole app.
 */
function financeClosure(entry: string): string[] {
  const seen = new Set<string>()
  const stack = [entry]
  while (stack.length) {
    const file = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    let src: string
    try {
      src = readFileSync(file, "utf8")
    } catch {
      continue
    }
    for (const m of src.matchAll(IMPORT_RE)) {
      const resolved = resolveImport(m[1], file)
      if (!resolved || seen.has(resolved)) continue
      if (
        resolved.startsWith(FINANCE_COMPONENTS) ||
        (resolved.includes(`${join("finance")}`) && resolved.startsWith(APP))
      ) {
        stack.push(resolved)
      }
    }
  }
  return [...seen]
}

/** Every finance route page.tsx under src/app. */
function financePages(): string[] {
  return walk(
    APP,
    (f) => f.endsWith("page.tsx") && f.includes(`${join("finance")}`)
  )
}

/** Does a real route (page.tsx/route.ts) exist for `/finance/...`, allowing for
 *  Next route groups `(x)` which add no URL segment? */
function routeExists(financePath: string): boolean {
  // financePath like /finance/payroll/runs ; dynamic seg already normalised
  const financeRouteRoots = walk(
    APP,
    (f) => f.endsWith("page.tsx") && f.includes(`${join("finance")}`)
  ).map((p) => dirname(p))
  const segments = financePath.split("/").filter(Boolean) // ["finance","payroll","runs"]
  for (const dir of financeRouteRoots) {
    // Build the URL path this page.tsx dir represents: drop [lang]/s/[subdomain]
    // and (route-group) segments, keep from "finance" onward.
    const rel = dir.slice(APP.length).split(/[/\\]/).filter(Boolean)
    const fi = rel.indexOf("finance")
    if (fi === -1) continue
    const urlSegs = rel
      .slice(fi)
      .filter((s) => !(s.startsWith("(") && s.endsWith(")")))
      .map((s) => (s.startsWith("[") ? "[id]" : s))
    const want = segments.map((s) => (s.startsWith("[") ? "[id]" : s))
    if (urlSegs.join("/") === want.join("/")) return true
  }
  return false
}

export interface FinanceGuardAudit {
  ungatedPages: string[]
  deadLinks: { file: string; target: string }[]
}

export function auditFinanceGuards(): FinanceGuardAudit {
  const ungatedPages: string[] = []
  for (const page of financePages()) {
    const closure = financeClosure(page)
    let touchesDb = false
    let hasGate = false
    for (const file of closure) {
      const src = readFileSync(file, "utf8")
      if (DB_ACCESS_RE.test(src)) touchesDb = true
      if (GATE_RE.test(src)) hasGate = true
    }
    if (touchesDb && !hasGate) {
      ungatedPages.push(page.slice(SRC.length + 1))
    }
  }

  // Dead internal finance links across the block's components + routes.
  const deadLinks: { file: string; target: string }[] = []
  const linkFiles = [
    ...walk(FINANCE_COMPONENTS, (f) => EXTS.some((e) => f.endsWith(e))),
    ...walk(
      APP,
      (f) => f.includes(`${join("finance")}`) && EXTS.some((e) => f.endsWith(e))
    ),
  ]
  const seen = new Set<string>()
  for (const file of linkFiles) {
    const src = readFileSync(file, "utf8")
    for (const m of src.matchAll(LINK_RE)) {
      const target = m[1].replace(/\$\{[^}]+\}/g, "[id]").replace(/\/$/, "")
      // `/finance/[id]` is the buildFinanceSubTabs base template (`/finance/${module}`),
      // not a literal route — module names resolve at call time. Skip it.
      if (target === "/finance/[id]") continue
      const key = `${file}::${target}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!routeExists(target)) {
        deadLinks.push({ file: file.slice(SRC.length + 1), target })
      }
    }
  }

  return { ungatedPages, deadLinks }
}

if (process.argv[1]?.endsWith("finance-guard-audit.ts")) {
  const { ungatedPages, deadLinks } = auditFinanceGuards()
  console.log(`Ungated db-querying finance pages: ${ungatedPages.length}`)
  for (const p of ungatedPages) console.log(`  ✗ ${p}`)
  console.log(`\nDead internal finance links: ${deadLinks.length}`)
  const byTarget = new Map<string, number>()
  for (const d of deadLinks)
    byTarget.set(d.target, (byTarget.get(d.target) ?? 0) + 1)
  for (const [t, n] of [...byTarget.entries()].sort())
    console.log(`  ✗ ${t}  (${n} ref${n > 1 ? "s" : ""})`)
}
