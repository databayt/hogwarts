// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { readdirSync, readFileSync, statSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

/**
 * Repo-wide RTL ratchet.
 *
 * Generalizes the per-block pattern in
 * src/tests/school-dashboard/messaging/rtl-verification.test.ts: it greps
 * component .tsx files for PHYSICAL CSS classes (ml-/mr-/pl-/pr-/text-left/
 * text-right/border-l-/border-r-/rounded-l-/rounded-r-/left-/right- …) that
 * break RTL layouts, and asserts the total count never exceeds a committed
 * baseline. Logical properties (ms-/me-/ps-/pe-/text-start/text-end) are the
 * RTL-safe replacements.
 *
 * The baseline only ever goes DOWN: fix a physical class, drop the baseline.
 * It must never be raised to admit new violations.
 *
 * Physical classes inside `rtl:`/`ltr:` variants (e.g. `rtl:ml-2`) are
 * deliberate direction overrides and are excluded — matching the messaging
 * test's ALLOWED_EXCEPTIONS approach.
 */

const ROOT = process.cwd()

// Top-level component directories scanned by this ratchet. parent-portal has no
// top-level dir (it lives under school-dashboard/parent-portal, already
// covered), so it is intentionally absent.
const SCAN_DIRS = [
  "src/components/template",
  "src/components/atom",
  "src/components/school-dashboard",
  "src/components/onboarding",
  "src/components/auth",
]

// Physical CSS classes that should NOT appear (use logical equivalents).
// Mirrors FORBIDDEN_PHYSICAL_CLASSES in the messaging RTL test.
const FORBIDDEN_PHYSICAL_CLASSES = [
  /\bml-\d/,
  /\bmr-\d/,
  /\bpl-\d/,
  /\bpr-\d/,
  /\bleft-\d/,
  /\bright-\d/,
  /\btext-left\b/,
  /\btext-right\b/,
  /\bfloat-left\b/,
  /\bfloat-right\b/,
  /\bborder-l-/,
  /\bborder-r-/,
  /\brounded-l-/,
  /\brounded-r-/,
  /\brounded-tl-/,
  /\brounded-tr-/,
  /\brounded-bl-/,
  /\brounded-br-/,
]

// Their logical replacements (for the failure-message suggestion).
const LOGICAL_EQUIVALENTS: Record<string, string> = {
  "ml-": "ms-",
  "mr-": "me-",
  "pl-": "ps-",
  "pr-": "pe-",
  "left-": "start-",
  "right-": "end-",
  "text-left": "text-start",
  "text-right": "text-end",
  "float-left": "float-start",
  "float-right": "float-end",
  "border-l-": "border-s-",
  "border-r-": "border-e-",
  "rounded-l-": "rounded-s-",
  "rounded-r-": "rounded-e-",
  "rounded-tl-": "rounded-ss-",
  "rounded-tr-": "rounded-se-",
  "rounded-bl-": "rounded-es-",
  "rounded-br-": "rounded-ee-",
}

// Lines that explicitly handle direction are valid: a `rtl:`/`ltr:` variant
// makes the physical class deliberate.
const ALLOWED_EXCEPTIONS = ["rtl:", "ltr:"]

/**
 * Committed baseline — measured 2026-06-10 across SCAN_DIRS.
 * Counts are tiny (all in school-dashboard), so a single total is used rather
 * than per-dir sub-baselines. This number must only ever decrease.
 *
 * Snapshot (2026-06-10): ZERO — the last 4 offenders (admission
 * campaign-form text-left, conference form text-left, subjects
 * catalog-content-sections right-3, config-title-form mr-2) were converted
 * to logical properties the same day this ratchet landed. Keep it at zero.
 */
const BASELINE = 0

interface Offender {
  file: string
  line: number
  physical: string
  suggestion: string
}

function walk(dir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    return []
  }
  const results: string[] = []
  for (const entry of entries) {
    if (entry === "__tests__" || entry === "node_modules") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walk(full))
    } else if (
      entry.endsWith(".tsx") &&
      !entry.includes(".test.") &&
      !entry.includes(".spec.")
    ) {
      results.push(full)
    }
  }
  return results
}

function collectFiles(): string[] {
  const files: string[] = []
  for (const dir of SCAN_DIRS) {
    files.push(...walk(join(ROOT, dir)))
  }
  // Deterministic order regardless of FS traversal.
  return files.sort()
}

function scan(): Offender[] {
  const offenders: Offender[] = []
  for (const filePath of collectFiles()) {
    const lines = readFileSync(filePath, "utf-8").split("\n")
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      // Skip comments and imports.
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue
      if (line.includes("import ")) continue
      // Skip lines with RTL-aware direction variants.
      if (ALLOWED_EXCEPTIONS.some((exc) => line.includes(exc))) continue

      for (const pattern of FORBIDDEN_PHYSICAL_CLASSES) {
        const match = line.match(pattern)
        if (match) {
          const physical = match[0]
          const logicalKey = Object.keys(LOGICAL_EQUIVALENTS).find(
            (k) => physical.startsWith(k) || physical === k
          )
          offenders.push({
            file: filePath.replace(ROOT + "/", ""),
            line: i + 1,
            physical,
            suggestion: logicalKey
              ? LOGICAL_EQUIVALENTS[logicalKey]
              : "a logical equivalent",
          })
        }
      }
    }
  }
  return offenders
}

describe("RTL physical-class ratchet (repo-wide)", () => {
  const offenders = scan()

  it("scans at least one component directory", () => {
    expect(collectFiles().length).toBeGreaterThan(0)
  })

  it(`has no more than ${BASELINE} physical-class occurrences (logical-only)`, () => {
    const top = offenders
      .slice(0, 15)
      .map(
        (o) => `  ${o.file}:${o.line} — "${o.physical}" → use "${o.suggestion}"`
      )
      .join("\n")

    const message = [
      `RTL ratchet: found ${offenders.length} physical-class occurrence(s); baseline is ${BASELINE}.`,
      offenders.length > BASELINE
        ? `New RTL violations were introduced. Use logical properties: ms-/me- (margin), ps-/pe- (padding), text-start/text-end, start-/end- (inset), border-s-/border-e-, rounded-s-/rounded-e-.`
        : `If you removed violations, lower BASELINE to ${offenders.length} (it must only ever decrease).`,
      offenders.length > 0 ? `Top offenders (max 15):\n${top}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    expect(offenders.length, message).toBeLessThanOrEqual(BASELINE)
  })
})
