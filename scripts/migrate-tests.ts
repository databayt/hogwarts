/**
 * One-shot test reorganization codemod.
 *
 *   pnpm tsx scripts/migrate-tests.ts --part=A [--dry] [--verbose]   # Vitest unit/integration
 *   pnpm tsx scripts/migrate-tests.ts --part=B [--dry] [--verbose]   # Playwright e2e
 *
 * Moves test files into a URL-mirrored `src/tests/<category>/<feature>/` tree and rewrites
 * every relative module specifier (import/export-from, vi.mock/doMock/importActual/importMock,
 * dynamic import(), require()) using LEXICAL path arithmetic:
 *   - target is also moving  -> keep relative, recomputed between the two NEW locations
 *   - target is source under src/ (Part A) -> rewrite to "@/..." alias
 *   - unresolved (pre-existing broken mock) -> "@/..." by lexical path (behavior preserved)
 *
 * Pure fs moves + content rewrites. No git calls — stage with `git add -A` afterwards
 * (git detects renames at diff time by content similarity).
 */
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

const ROOT = process.cwd()
const SRC = path.join(ROOT, "src")
const TESTS_ROOT = path.join(ROOT, "tests") // Playwright's current home
const TESTS_DEST = path.join(SRC, "tests")

const args = process.argv.slice(2)
const PART = (
  args.find((a) => a.startsWith("--part="))?.split("=")[1] || ""
).toUpperCase()
const DRY = args.includes("--dry")
const VERBOSE = args.includes("--verbose")
if (PART !== "A" && PART !== "B") {
  console.error("Usage: migrate-tests.ts --part=A|B [--dry] [--verbose]")
  process.exit(2)
}

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
])
const RESOLVE_EXT = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".d.ts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/")
}
function stripExt(p: string): string {
  const e = path.extname(p)
  return e ? p.slice(0, -e.length) : p
}

// ─────────────────────────────────────────────────────────────────────────────
// Part A — Vitest bucket mapping (old abs under src/ -> new abs under src/tests/)
// ─────────────────────────────────────────────────────────────────────────────
const COMPONENT_BUCKET: Record<string, string[]> = {
  "saas-marketing": ["saas-marketing"],
  "saas-dashboard": ["saas-dashboard"],
  "school-marketing": ["school-marketing"],
  "school-dashboard": ["school-dashboard"],
  stream: ["school-dashboard", "stream"],
  library: ["school-dashboard", "library"],
  catalog: ["saas-dashboard", "catalog"],
  auth: ["auth"],
  onboarding: ["onboarding"],
  "internal-onboarding": ["internal-onboarding"],
  internationalization: ["i18n"],
  translation: ["i18n", "translation"],
  atom: ["atom"],
}

function bucketVitest(absPath: string): string {
  const rel = toPosix(path.relative(SRC, absPath))
  const segs = rel.split("/").filter((s) => s !== "__tests__")
  const root = segs[0]
  if (root === "lib" || root === "app") {
    return path.join(TESTS_DEST, ...segs)
  }
  if (root === "components") {
    const feat = segs[1]
    const prefix = COMPONENT_BUCKET[feat]
    if (!prefix)
      throw new Error(`Unmapped component feature "${feat}" for ${rel}`)
    return path.join(TESTS_DEST, ...prefix, ...segs.slice(2))
  }
  throw new Error(`Unmapped root "${root}" for ${rel}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Part B — Playwright classification (old abs under tests/ -> new abs under src/tests/)
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_ADMISSION = new Set([
  "admission-flow.spec.ts",
  "admission-handover.spec.ts",
  "admission-production.spec.ts",
])

function classifySpec(epicRel: string): string[] {
  // epicRel like "epic-10-exams/auto-marking.spec.ts" or "messaging/messaging-flow.spec.ts"
  const [folder] = epicRel.split("/")
  const base = path.basename(epicRel)
  switch (folder) {
    case "epic-1-entry-points":
      return [base.replace(".spec.ts", ""), "entry-points.spec.ts"]
    case "epic-2-authentication":
      return ["auth", base]
    case "epic-3-multi-tenancy":
      return ["e2e", "multi-tenancy", base]
    case "epic-4-rbac":
      return ["e2e", "rbac", base]
    case "epic-5-onboarding":
      return ["onboarding", base]
    case "epic-6-sso":
      return ["auth", base]
    case "epic-7-user-flows":
      return ["auth", base]
    case "epic-8-admission":
      return ADMIN_ADMISSION.has(base)
        ? ["school-dashboard", "admission", base]
        : ["school-marketing", "application", base]
    case "epic-9-stream":
      return ["school-dashboard", "stream", base]
    case "epic-10-exams":
      return ["school-dashboard", "exams", base]
    case "epic-11-accessibility":
      return ["e2e", "accessibility", base]
    case "epic-12-students":
      return ["school-dashboard", "students", base]
    case "epic-13-teachers":
      return ["school-dashboard", "teachers", base]
    case "epic-14-guardians":
      return ["school-dashboard", "parents", base]
    case "internal-onboarding":
      return ["internal-onboarding", base]
    case "lifecycle":
      return ["e2e", "lifecycle", base]
    case "attendance":
      return ["school-dashboard", "attendance", base]
    case "conference":
      return ["school-dashboard", "conference", base]
    case "messaging":
      return ["school-dashboard", "messaging", base]
    case "onboarding":
      return ["onboarding", base]
    case "profile":
      return ["school-dashboard", "profile", base]
    case "wizard-forms":
      return ["onboarding", base]
    default:
      throw new Error(`Unmapped e2e spec folder "${folder}" for ${epicRel}`)
  }
}

function bucketE2E(absPath: string): string {
  const rel = toPosix(path.relative(TESTS_ROOT, absPath))
  const dest = (...segs: string[]) => path.join(TESTS_DEST, ...segs)
  if (rel === "auth.setup.ts") return dest("e2e", "_support", "auth.setup.ts")
  if (rel === "smoke/health-check.spec.ts")
    return dest("e2e", "smoke", "health-check.spec.ts")
  for (const sup of [
    "auth/",
    "fixtures/",
    "helpers/",
    "page-objects/",
    "test-data/",
  ]) {
    if (rel.startsWith(sup)) return dest("e2e", "_support", rel)
  }
  if (rel.startsWith("lifecycle/"))
    return dest("e2e", "lifecycle", "scripts", rel.slice("lifecycle/".length))
  if (rel === "e2e/epic-7-user-flows/README.md")
    return dest("auth", "user-flows.README.md")
  if (rel.startsWith("e2e/")) {
    if (rel === "e2e/epic-10-exams/helpers.ts")
      return dest("school-dashboard", "exams", "helpers.ts")
    return dest(...classifySpec(rel.slice("e2e/".length)))
  }
  throw new Error(`Unmapped tests/ file: ${rel}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the move map
// ─────────────────────────────────────────────────────────────────────────────
function collectFiles(): string[] {
  if (PART === "A") {
    const all = walk(SRC)
    const underTests = all.filter((p) => toPosix(p).includes("/__tests__/"))
    const looseTests = all.filter(
      (p) =>
        /\.test\.tsx?$/.test(p) &&
        !toPosix(p).includes("/__tests__/") &&
        !toPosix(p).startsWith(toPosix(TESTS_DEST) + "/")
    )
    return [...new Set([...underTests, ...looseTests])]
  }
  // Part B: everything under tests/ EXCEPT junk (stray dotfile logs).
  return walk(TESTS_ROOT).filter((p) => {
    const rel = toPosix(path.relative(TESTS_ROOT, p))
    return !rel.startsWith(".") && !rel.endsWith(".log")
  })
}

// Standardize the lone double-`t` straggler (audit-untranslated.tests.ts) to single-`t`.
const normalizeTestExt = (p: string): string =>
  p.replace(/\.tests\.(tsx?)$/, ".test.$1")

const bucket = PART === "A" ? bucketVitest : bucketE2E
const files = collectFiles()
const moveMap = new Map<string, string>()
for (const f of files)
  moveMap.set(path.resolve(f), normalizeTestExt(path.resolve(bucket(f))))

// Zero-collision guard
const dests = new Map<string, string>()
for (const [oldAbs, newAbs] of moveMap) {
  if (dests.has(newAbs))
    throw new Error(
      `COLLISION: ${oldAbs} and ${dests.get(newAbs)} both -> ${newAbs}`
    )
  dests.set(newAbs, oldAbs)
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve a relative specifier's target
// ─────────────────────────────────────────────────────────────────────────────
type Resolved =
  | { kind: "moving"; newAbs: string; viaIndex: boolean }
  | { kind: "source"; absNoExtOrFile: string; viaIndex: boolean }
  | { kind: "unresolved"; absNoExt: string }

function resolveTarget(absNoExt: string): Resolved {
  for (const e of RESOLVE_EXT) {
    const k = absNoExt + e
    if (moveMap.has(k))
      return { kind: "moving", newAbs: moveMap.get(k)!, viaIndex: false }
  }
  for (const e of RESOLVE_EXT) {
    const k = path.join(absNoExt, "index" + e)
    if (moveMap.has(k))
      return { kind: "moving", newAbs: moveMap.get(k)!, viaIndex: true }
  }
  for (const e of RESOLVE_EXT) {
    if (fs.existsSync(absNoExt + e))
      return { kind: "source", absNoExtOrFile: absNoExt + e, viaIndex: false }
  }
  for (const e of RESOLVE_EXT) {
    if (fs.existsSync(path.join(absNoExt, "index" + e)))
      return {
        kind: "source",
        absNoExtOrFile: path.join(absNoExt, "index" + e),
        viaIndex: true,
      }
  }
  return { kind: "unresolved", absNoExt }
}

function ensureDot(rel: string): string {
  const p = toPosix(rel)
  return p.startsWith(".") ? p : "./" + p
}

const stats = {
  moved: 0,
  rewritten: 0,
  specChanges: 0,
  unresolved: [] as string[],
}

function computeNewSpecifier(
  oldSpec: string,
  oldFileAbs: string,
  newFileAbs: string
): string | null {
  if (!oldSpec.startsWith(".")) return null
  const absNoExt = path.normalize(path.join(path.dirname(oldFileAbs), oldSpec))
  const r = resolveTarget(absNoExt)
  if (r.kind === "moving") {
    const target = r.viaIndex ? path.dirname(r.newAbs) : stripExt(r.newAbs)
    return ensureDot(path.relative(path.dirname(newFileAbs), target))
  }
  if (r.kind === "source") {
    const target = r.viaIndex
      ? path.dirname(r.absNoExtOrFile)
      : stripExt(r.absNoExtOrFile)
    if (toPosix(target).startsWith(toPosix(SRC) + "/"))
      return "@/" + toPosix(path.relative(SRC, target))
    // source outside src/ (e.g. root-level scripts/) — recompute relative from NEW location
    return ensureDot(path.relative(path.dirname(newFileAbs), target))
  }
  // unresolved: preserve as @/ lexical path if under src, else flag + leave
  if (toPosix(absNoExt).startsWith(toPosix(SRC) + "/")) {
    stats.unresolved.push(
      `${toPosix(path.relative(ROOT, oldFileAbs))}: "${oldSpec}" -> @/(lexical, target missing)`
    )
    return "@/" + toPosix(path.relative(SRC, absNoExt))
  }
  stats.unresolved.push(
    `${toPosix(path.relative(ROOT, oldFileAbs))}: "${oldSpec}" -> LEFT UNCHANGED (unresolved, not under src)`
  )
  return null
}

function specifierNodes(sf: ts.SourceFile): ts.StringLiteralLike[] {
  const out: ts.StringLiteralLike[] = []
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      out.push(node.moduleSpecifier)
    } else if (ts.isCallExpression(node)) {
      const exp = node.expression
      const isDynImport = exp.kind === ts.SyntaxKind.ImportKeyword
      const isRequire = ts.isIdentifier(exp) && exp.text === "require"
      const isViMock =
        ts.isPropertyAccessExpression(exp) &&
        ts.isIdentifier(exp.expression) &&
        exp.expression.text === "vi" &&
        [
          "mock",
          "doMock",
          "unmock",
          "doUnmock",
          "importActual",
          "importMock",
        ].includes(exp.name.text)
      if (
        (isDynImport || isRequire || isViMock) &&
        node.arguments[0] &&
        ts.isStringLiteralLike(node.arguments[0])
      ) {
        out.push(node.arguments[0] as ts.StringLiteralLike)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

function rewriteContent(
  content: string,
  oldFileAbs: string,
  newFileAbs: string
): { text: string; changes: number } {
  const ext = path.extname(oldFileAbs)
  const kind =
    ext === ".tsx" || ext === ".jsx"
      ? ts.ScriptKind.TSX
      : ext === ".ts" || ext === ".mts" || ext === ".cts"
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS
  const sf = ts.createSourceFile(
    oldFileAbs,
    content,
    ts.ScriptTarget.Latest,
    true,
    kind
  )
  const edits: { start: number; end: number; text: string }[] = []
  for (const node of specifierNodes(sf)) {
    const oldSpec = node.text
    const next = computeNewSpecifier(oldSpec, oldFileAbs, newFileAbs)
    if (next && next !== oldSpec) {
      edits.push({
        start: node.getStart(sf),
        end: node.getEnd(),
        text: JSON.stringify(next),
      })
      if (VERBOSE) console.log(`    ${oldSpec}  ->  ${next}`)
    }
  }
  edits.sort((a, b) => b.start - a.start)
  let text = content
  for (const e of edits)
    text = text.slice(0, e.start) + e.text + text.slice(e.end)
  return { text, changes: edits.length }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute
// ─────────────────────────────────────────────────────────────────────────────
console.log(
  `\n=== migrate-tests Part ${PART} ${DRY ? "(DRY RUN)" : ""} — ${moveMap.size} files ===\n`
)

const sorted = [...moveMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
for (const [oldAbs, newAbs] of sorted) {
  const isText = TEXT_EXT.has(path.extname(oldAbs))
  let newContent: string | null = null
  let changes = 0
  if (isText) {
    const content = fs.readFileSync(oldAbs, "utf8")
    const r = rewriteContent(content, oldAbs, newAbs)
    changes = r.changes
    if (changes > 0) newContent = r.text
  }
  stats.moved++
  if (changes > 0) {
    stats.rewritten++
    stats.specChanges += changes
  }
  if (VERBOSE || (DRY && changes > 0)) {
    console.log(
      `${toPosix(path.relative(ROOT, oldAbs))}\n  -> ${toPosix(path.relative(ROOT, newAbs))}${changes ? `  [${changes} import(s)]` : ""}`
    )
  }
  if (!DRY) {
    fs.mkdirSync(path.dirname(newAbs), { recursive: true })
    fs.renameSync(oldAbs, newAbs)
    if (newContent !== null) fs.writeFileSync(newAbs, newContent)
  }
}

// Clean up now-empty dirs left behind (e.g. __tests__)
if (!DRY) {
  const pruneEmpty = (dir: string) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) pruneEmpty(path.join(dir, e.name))
    }
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0)
      fs.rmdirSync(dir)
  }
  pruneEmpty(PART === "A" ? SRC : TESTS_ROOT)
}

console.log(`\n--- summary ---`)
console.log(`files moved:        ${stats.moved}`)
console.log(`files rewritten:    ${stats.rewritten}`)
console.log(`specifiers changed: ${stats.specChanges}`)
console.log(`unresolved (flagged ${stats.unresolved.length}):`)
for (const u of stats.unresolved) console.log(`  ${u}`)
console.log(
  DRY ? `\n(DRY RUN — no files changed)\n` : `\nDONE. Stage with: git add -A\n`
)
