// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// i18n route audit: classify every page.tsx by static-dictionary (System A) and
// dynamic-translation (System B) coverage. Read-only. Emits JSON to stdout.
//
//   npx tsx scripts/i18n-audit.ts > /tmp/i18n-audit.json
//
// Per page it resolves the page's local import closure (depth 2: page -> content
// -> children) and records whether any file in that closure references a
// dictionary (System A) or getDisplayText/getDisplayFields (System B). Pure
// heuristic — agents verify the ambiguous rows.

import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, dirname, resolve, relative } from "path"

const ROOT = process.cwd()
const SRC = join(ROOT, "src")
const APP = join(SRC, "app")

const EXTS = [".tsx", ".ts", ".jsx", ".js"]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

// Resolve an import specifier to an on-disk file path, or null for externals.
function resolveImport(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2))
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec)
  else return null // node_modules / external
  for (const ext of EXTS) {
    if (existsSync(base + ext)) return base + ext
  }
  for (const ext of EXTS) {
    const idx = join(base, "index" + ext)
    if (existsSync(idx)) return idx
  }
  if (existsSync(base) && statSync(base).isFile()) return base
  return null
}

function importsOf(content: string): string[] {
  const specs: string[] = []
  const re = /(?:import|export)[^"'`]*?from\s*["'`]([^"'`]+)["'`]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) specs.push(m[1])
  // bare side-effect import
  const re2 = /import\s*["'`]([^"'`]+)["'`]/g
  while ((m = re2.exec(content))) specs.push(m[1])
  return specs
}

const DICT_RE = /\b(getDictionary|get[A-Z]\w*Dictionary|useDictionary|DictionaryProvider|useDictionaryContext)\b/
const DICT_PROP_RE = /\bdictionary\b/
const DISPLAY_RE = /\b(getDisplayText|getDisplayFields)\b/
const REDIRECT_RE = /\b(redirect|notFound|permanentRedirect)\s*\(/
const LANG_PARAM_RE = /params|\blang\b|\blocale\b/

function signals(content: string) {
  return {
    dict: DICT_RE.test(content) || DICT_PROP_RE.test(content),
    dictLoader: DICT_RE.test(content),
    display: DISPLAY_RE.test(content),
  }
}

// derive a clean route string from a page.tsx path
function routeOf(pagePath: string): string {
  let r = "/" + relative(APP, dirname(pagePath)).split("\\").join("/")
  r = r
    .replace(/\(([^)]+)\)\/?/g, "") // strip route groups (school-dashboard)
    .replace(/\/{2,}/g, "/")
  return r === "" ? "/" : r
}

function groupOf(route: string): string {
  if (route.startsWith("/[lang]/parent")) return "parent-portal"
  if (route.includes("internal-onboarding")) return "internal-onboarding"
  if (route.includes("/onboarding")) return "onboarding"
  if (route.includes("/application")) return "application"
  if (route.includes("/s/[subdomain]")) {
    // sub-split school-dashboard by first feature segment
    const after = route.split("/s/[subdomain]/")[1] || ""
    const feat = after.split("/")[0] || "(root)"
    return "school:" + feat
  }
  if (route.includes("(saas-dashboard)") || route.includes("/operator")) return "operator"
  if (route.includes("(saas-marketing)")) return "marketing"
  if (route.includes("(auth)") || /\/(login|register|reset|verify|error)/.test(route)) return "auth"
  if (route.includes("/docs")) return "docs"
  return "misc"
}

type Row = {
  route: string
  page: string
  group: string
  pageDict: boolean
  closureDict: boolean
  closureDisplay: boolean
  redirectOnly: boolean
  devOnly: boolean
  closureFiles: number
  tagHint: string
}

const allFiles = walk(APP)
const pages = allFiles.filter((f) => /\/page\.(tsx|jsx)$/.test(f))

const rows: Row[] = []

for (const page of pages) {
  const route = routeOf(page)
  const group = groupOf(page.includes("(") ? "/" + relative(APP, page) : route)
  const pageContent = readFileSync(page, "utf-8")
  const pageSig = signals(pageContent)

  // BFS closure depth 2 over LOCAL imports only
  const visited = new Set<string>()
  let closureDict = false
  let closureDisplay = false
  let frontier = importsOf(pageContent)
    .map((s) => resolveImport(s, page))
    .filter((f): f is string => !!f && f.includes(`${SRC}/`))
  for (let depth = 0; depth < 2 && frontier.length; depth++) {
    const next: string[] = []
    for (const file of frontier) {
      if (visited.has(file)) continue
      visited.add(file)
      let c: string
      try {
        c = readFileSync(file, "utf-8")
      } catch {
        continue
      }
      const s = signals(c)
      if (s.dict) closureDict = true
      if (s.display) closureDisplay = true
      // only recurse into component-ish local files
      for (const spec of importsOf(c)) {
        const r = resolveImport(spec, file)
        if (r && r.includes(`${SRC}/`) && !visited.has(r)) next.push(r)
      }
    }
    frontier = next
  }

  const redirectOnly =
    REDIRECT_RE.test(pageContent) &&
    !pageSig.dict &&
    !closureDict &&
    pageContent.length < 1500
  const devOnly = /\/(test|lab|wa-preview|offline|kiosk)\b/.test(route)

  const hasA = pageSig.dictLoader || closureDict
  let tagHint: string
  if (devOnly) tagHint = "DEV-ONLY"
  else if (redirectOnly) tagHint = "NO-UI"
  else if (pageSig.dictLoader && (closureDict || true)) tagHint = "FULLY-I18N"
  else if (!pageSig.dictLoader && closureDict) tagHint = "DELEGATES-OK"
  else if (!hasA) tagHint = "STATIC-GAP?"
  else tagHint = "FULLY-I18N"

  rows.push({
    route,
    page: relative(ROOT, page),
    group,
    pageDict: pageSig.dictLoader,
    closureDict,
    closureDisplay,
    redirectOnly,
    devOnly,
    closureFiles: visited.size,
    tagHint,
  })
}

// summary
const byTag: Record<string, number> = {}
const byGroup: Record<string, number> = {}
for (const r of rows) {
  byTag[r.tagHint] = (byTag[r.tagHint] || 0) + 1
  byGroup[r.group] = (byGroup[r.group] || 0) + 1
}

console.log(
  JSON.stringify(
    {
      total: rows.length,
      byTag,
      byGroup,
      gaps: rows.filter((r) => r.tagHint === "STATIC-GAP?"),
      rows,
    },
    null,
    2
  )
)
