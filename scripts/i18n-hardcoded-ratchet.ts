// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hardcoded-English-string ratchet.
 *
 * Deterministic scan of src/app + src/components for the 8 anti-patterns
 * from .claude/rules/translation.md (mirrors .claude/hooks/check-i18n.sh).
 * Consumed by src/tests/i18n/hardcoded-ratchet.test.ts, which fails when a
 * pattern count EXCEEDS its committed baseline — new hardcoded strings
 * can't ship, and every sweep ratchets the baseline down.
 *
 * CLI:  npx tsx scripts/i18n-hardcoded-ratchet.ts            # summary
 *       npx tsx scripts/i18n-hardcoded-ratchet.ts --by-dir   # densest dirs
 *       npx tsx scripts/i18n-hardcoded-ratchet.ts --list     # every offender
 */
import { readdirSync, readFileSync, statSync } from "fs"
import { join, relative } from "path"

const ROOT = process.cwd()
const SCAN_DIRS = [join(ROOT, "src", "app"), join(ROOT, "src", "components")]

/**
 * Mirrors check-i18n.sh skip list; tests + dictionary JSON are not UI.
 *
 * `src/app/api/**` is excluded too: API routes return machine-facing JSON
 * (`NextResponse.json({ error: "..." })`) to the mobile app / external clients
 * — an API contract, not user-facing UI text. The mobile client localizes on
 * its side (see `/api/mobile/translate`), so hardcoded English in API error
 * responses is out of scope for the UI-translation ratchet. Server actions in
 * `src/components/**` (the UI data path) remain fully scanned.
 */
const EXCLUDE_RE =
  /(\/src\/app\/api\/|\/dictionaries\/|\/src\/tests\/|\.test\.|\.spec\.|\.d\.ts$)/

export const PATTERNS = {
  formLabel: /<FormLabel>[A-Za-z][^{<]+<\/FormLabel>/,
  toast: /toast\.(success|error|warning|info)\(["'][A-Za-z]/,
  button: /<Button[^>]*>[A-Za-z][^{<]+<\/Button>/,
  errorReturn: /error:\s*["'][A-Z][^"']+["']/,
  selectLabel: /label:\s*["'][A-Z][^"']+["']/,
  zodMessage: /\.(min|max|email|url|regex|refine)\([^)]*["'][A-Z][^"']+["']/,
  bilingualField: /(title|name|description|label|body)(Ar|En|Arabic|English)\b/,
  placeholder: /placeholder=["'][A-Z][^"'{]+["']/,
} as const

export type PatternName = keyof typeof PATTERNS

export interface Offender {
  file: string
  line: number
  pattern: PatternName
  text: string
}

export interface RatchetReport {
  total: number
  byPattern: Record<PatternName, number>
  byDir: Record<string, number>
  offenders: Offender[]
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    if (entry === "node_modules" || entry.startsWith(".")) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full)
  }
  return out
}

export function scanHardcodedStrings(
  dirs: string[] = SCAN_DIRS
): RatchetReport {
  const offenders: Offender[] = []
  const byPattern = Object.fromEntries(
    Object.keys(PATTERNS).map((p) => [p, 0])
  ) as Record<PatternName, number>
  const byDir: Record<string, number> = {}

  const files = dirs.flatMap((d) => walk(d)).sort()

  for (const file of files) {
    const rel = relative(ROOT, file)
    if (EXCLUDE_RE.test("/" + rel)) continue

    const lines = readFileSync(file, "utf-8").split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const [name, re] of Object.entries(PATTERNS) as [
        PatternName,
        RegExp,
      ][]) {
        if (re.test(line)) {
          offenders.push({
            file: rel,
            line: i + 1,
            pattern: name,
            text: line.trim().slice(0, 120),
          })
          byPattern[name]++
          // bucket by feature dir (3 path segments, e.g. src/components/lab)
          const dir = rel.split("/").slice(0, 3).join("/")
          byDir[dir] = (byDir[dir] || 0) + 1
        }
      }
    }
  }

  return { total: offenders.length, byPattern, byDir, offenders }
}

// CLI (skipped when imported by vitest)
if (process.argv[1]?.endsWith("i18n-hardcoded-ratchet.ts")) {
  const report = scanHardcodedStrings()
  if (process.argv.includes("--list")) {
    for (const o of report.offenders) {
      console.log(`${o.file}:${o.line} [${o.pattern}] ${o.text}`)
    }
  }
  if (process.argv.includes("--by-dir")) {
    const sorted = Object.entries(report.byDir).sort((a, b) => b[1] - a[1])
    for (const [dir, n] of sorted)
      console.log(`${String(n).padStart(5)}  ${dir}`)
  }
  console.log(
    JSON.stringify(
      { total: report.total, byPattern: report.byPattern },
      null,
      2
    )
  )
}
