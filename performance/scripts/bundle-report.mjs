// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Static bundle inventory of a Next (Turbopack) production build.
 *
 * Reads a `.next` directory — no server, no browser — and answers:
 *   - what every route makes a phone download before it can hydrate
 *     (root runtime + the layout/page entry chunks on that route's path)
 *   - which heavy libraries sit inside those initial chunks
 *   - the largest chunks and stylesheets in the build, and what is in them
 *
 * Deterministic, so it is the regression gate: same source → same numbers.
 *
 *   node performance/scripts/bundle-report.mjs                       # ./.next
 *   node performance/scripts/bundle-report.mjs --next-dir <dir> --out <dir>
 *   PERF_NEXT_DIR=~/.cache/hogwarts-cf-build/.next pnpm perf:build   # the deployed build
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import zlib from "node:zlib"

import { arg, ensureDir, fmtKB, labRoot, readJson, table } from "./lib.mjs"

const nextDir = path.resolve(
  (arg("next-dir") || process.env.PERF_NEXT_DIR || ".next").replace(
    /^~/,
    os.homedir()
  )
)
const outDir = path.resolve(arg("out") || path.join(labRoot, "reports/latest"))

if (!fs.existsSync(path.join(nextDir, "build-manifest.json"))) {
  console.error(
    `No production build at ${nextDir}. Run \`pnpm build\` first, or point --next-dir at one.`
  )
  process.exit(2)
}

const lab = readJson(path.join(labRoot, "config/lab.json"))
const { libraries } = readJson(path.join(labRoot, "config/libraries.json"))
const signatures = Object.entries(libraries).map(([name, sigs]) => [
  name,
  sigs.map((s) => Buffer.from(s)),
])

// ---- per-file facts, computed once --------------------------------------
const fileFacts = new Map()
function facts(rel) {
  const hit = fileFacts.get(rel)
  if (hit) return hit
  const abs = path.join(nextDir, rel)
  let out = { file: rel, raw: 0, gzip: 0, libs: [], missing: true }
  if (fs.existsSync(abs)) {
    const buf = fs.readFileSync(abs)
    out = {
      file: rel,
      raw: buf.length,
      gzip: zlib.gzipSync(buf, { level: 6 }).length,
      libs: rel.endsWith(".js")
        ? signatures
            .filter(([, sigs]) => sigs.some((s) => buf.includes(s)))
            .map(([name]) => name)
        : [],
    }
  }
  fileFacts.set(rel, out)
  return out
}
const sum = (files, key) => files.reduce((n, f) => n + facts(f)[key], 0)

// ---- root runtime ---------------------------------------------------------
const buildManifest = readJson(path.join(nextDir, "build-manifest.json"))
const rootMain = buildManifest.rootMainFiles ?? []
const polyfills = buildManifest.polyfillFiles ?? []

// ---- every route's entry chunks -----------------------------------------
const appDir = path.join(nextDir, "server/app")
const manifests = []
;(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(abs)
    else if (entry.name === "page_client-reference-manifest.js")
      manifests.push(abs)
  }
})(appDir)

/** `[lang]/s/[subdomain]/(school-dashboard)/(listings)/students` → `/students` */
function publicPath(route) {
  const clean = route
    .split("/")
    .filter((seg) => !/^\(.*\)$/.test(seg))
    .join("/")
  return (
    "/" +
    clean
      .replace(/^\[lang\]\/s\/\[subdomain\]\/?/, "")
      .replace(/^\[lang\]\/?/, "")
  ).replace(/\/$/, "") || "/"
}

const routes = []
for (const file of manifests) {
  const route = path.relative(appDir, path.dirname(file))
  const src = fs.readFileSync(file, "utf8")
  // `globalThis.__RSC_MANIFEST["/route"] = {…}` — the object after `] =`,
  // not the `|| {}` of the guard that precedes it.
  const assign = /\]\s*=\s*\{/.exec(src)
  const end = src.lastIndexOf("}")
  let manifest
  try {
    manifest = JSON.parse(src.slice(assign.index + assign[0].length - 1, end + 1))
  } catch {
    console.warn(`unreadable manifest: ${route}`)
    continue
  }
  const js = new Set(rootMain)
  for (const list of Object.values(manifest.entryJSFiles ?? {}))
    for (const f of list) js.add(f)
  const css = new Set()
  for (const list of Object.values(manifest.entryCSSFiles ?? {}))
    for (const f of list) css.add(typeof f === "string" ? f : f.path)
  const jsFiles = [...js]
  const cssFiles = [...css]
  const heavy = new Map()
  for (const f of jsFiles)
    for (const lib of facts(f).libs)
      heavy.set(lib, (heavy.get(lib) ?? 0) + facts(f).gzip)
  routes.push({
    route,
    path: publicPath(route),
    tenant: route.startsWith("[lang]/s/[subdomain]"),
    js: {
      files: jsFiles.length,
      raw: sum(jsFiles, "raw"),
      gzip: sum(jsFiles, "gzip"),
    },
    css: {
      files: cssFiles.length,
      raw: sum(cssFiles, "raw"),
      gzip: sum(cssFiles, "gzip"),
    },
    libs: [...heavy.keys()].sort(),
    jsFiles,
    cssFiles,
  })
}
routes.sort((a, b) => b.js.gzip - a.js.gzip)

// ---- whole-build inventory ----------------------------------------------
const chunkDir = path.join(nextDir, "static/chunks")
const allChunks = fs
  .readdirSync(chunkDir)
  .filter((f) => f.endsWith(".js") || f.endsWith(".css"))
  .map((f) => facts(`static/chunks/${f}`))
const jsChunks = allChunks.filter((c) => c.file.endsWith(".js"))
const cssChunks = allChunks.filter((c) => c.file.endsWith(".css"))
const mediaDir = path.join(nextDir, "static/media")
const fonts = fs.existsSync(mediaDir)
  ? fs
      .readdirSync(mediaDir)
      .filter((f) => /\.(woff2?|ttf|otf)$/.test(f))
      .map((f) => ({
        file: `static/media/${f}`,
        raw: fs.statSync(path.join(mediaDir, f)).size,
      }))
      .sort((a, b) => b.raw - a.raw)
  : []

const initialUse = new Map()
for (const r of routes)
  for (const f of r.jsFiles) initialUse.set(f, (initialUse.get(f) ?? 0) + 1)

const libraryReport = Object.keys(libraries)
  .map((lib) => {
    const inChunks = jsChunks.filter((c) => c.libs.includes(lib))
    const initialRoutes = routes.filter((r) => r.libs.includes(lib))
    return {
      library: lib,
      chunks: inChunks.length,
      gzip: inChunks.reduce((n, c) => n + c.gzip, 0),
      routesPayingOnInitialLoad: initialRoutes.length,
      examples: initialRoutes.slice(0, 5).map((r) => r.path),
    }
  })
  .filter((l) => l.chunks > 0)
  .sort((a, b) => b.routesPayingOnInitialLoad - a.routesPayingOnInitialLoad)

// The routes the lab tracks (lab.json) — the ones budgets apply to.
const tracked = new Set([
  ...Object.values(lab.routes).flat(),
  ...lab.publicRoutes.map((r) => r.path),
])
const trackedRoutes = [...tracked]
  .map((p) => {
    const candidates = routes.filter((r) => r.path === p)
    // `/` and `/login` exist once per host tree; the tenant tree wins for
    // dashboard paths, the root tree for marketing.
    return candidates.sort((a, b) => Number(b.tenant) - Number(a.tenant))[0]
  })
  .filter(Boolean)

const report = {
  generatedAt: new Date().toISOString(),
  nextDir,
  buildId: fs.readFileSync(path.join(nextDir, "BUILD_ID"), "utf8").trim(),
  totals: {
    routes: routes.length,
    jsChunks: jsChunks.length,
    jsRaw: jsChunks.reduce((n, c) => n + c.raw, 0),
    jsGzip: jsChunks.reduce((n, c) => n + c.gzip, 0),
    cssChunks: cssChunks.length,
    cssRaw: cssChunks.reduce((n, c) => n + c.raw, 0),
    cssGzip: cssChunks.reduce((n, c) => n + c.gzip, 0),
    fontFiles: fonts.length,
    fontRaw: fonts.reduce((n, f) => n + f.raw, 0),
  },
  rootRuntime: {
    files: rootMain.map(facts),
    raw: sum(rootMain, "raw"),
    gzip: sum(rootMain, "gzip"),
    polyfills: polyfills.map(facts),
  },
  trackedRoutes: trackedRoutes.map(({ jsFiles, cssFiles, ...r }) => ({
    ...r,
    heaviestInitialChunks: jsFiles
      .map(facts)
      .sort((a, b) => b.gzip - a.gzip)
      .slice(0, 6)
      .map(({ file, raw, gzip, libs }) => ({ file, raw, gzip, libs })),
  })),
  heaviestRoutes: routes.slice(0, 25).map(({ jsFiles, cssFiles, ...r }) => r),
  largestChunks: [...jsChunks]
    .sort((a, b) => b.gzip - a.gzip)
    .slice(0, 40)
    .map((c) => ({ ...c, initialOnRoutes: initialUse.get(c.file) ?? 0 })),
  stylesheets: [...cssChunks].sort((a, b) => b.gzip - a.gzip).slice(0, 12),
  fonts: fonts.slice(0, 20),
  libraries: libraryReport,
  allRoutes: routes.map(({ jsFiles, cssFiles, ...r }) => r),
}

ensureDir(outDir)
fs.writeFileSync(
  path.join(outDir, "bundle.json"),
  JSON.stringify(report, null, 2)
)

// ---- console ---------------------------------------------------------------
console.log(`\nBundle inventory — build ${report.buildId}\n${nextDir}\n`)
console.log(
  `${report.totals.routes} routes · ${report.totals.jsChunks} JS chunks ` +
    `(${fmtKB(report.totals.jsGzip)} gzip) · ${report.totals.cssChunks} stylesheets ` +
    `(${fmtKB(report.totals.cssGzip)} gzip) · root runtime ${fmtKB(report.rootRuntime.gzip)} gzip\n`
)
console.log("Tracked routes — initial download before hydration")
console.log(
  table(
    ["route", "JS files", "JS gzip", "CSS gzip", "heavy libraries in initial JS"],
    report.trackedRoutes
      .sort((a, b) => b.js.gzip - a.js.gzip)
      .map((r) => [
        r.path,
        r.js.files,
        fmtKB(r.js.gzip),
        fmtKB(r.css.gzip),
        r.libs.join(", ") || "—",
      ])
  )
)
console.log("\nHeavy libraries — how many routes pay for them up front")
console.log(
  table(
    ["library", "chunks", "gzip", "routes (initial)", "e.g."],
    report.libraries
      .slice(0, 20)
      .map((l) => [
        l.library,
        l.chunks,
        fmtKB(l.gzip),
        l.routesPayingOnInitialLoad,
        l.examples.slice(0, 3).join(" "),
      ])
  )
)
console.log(`\n→ ${path.relative(process.cwd(), path.join(outDir, "bundle.json"))}`)
