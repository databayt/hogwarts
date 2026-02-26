// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Batch convert physical CSS properties to logical equivalents for RTL support.
 *
 * Converts:
 * - ml-* → ms-*, mr-* → me-*
 * - pl-* → ps-*, pr-* → pe-*
 * - left-* → start-*, right-* → end-*
 * - rounded-l-* → rounded-s-*, rounded-r-* → rounded-e-*
 * - text-left → text-start, text-right → text-end
 * - border-l → border-s, border-r → border-e (with variants)
 *
 * Run: npx tsx scripts/fix-rtl-properties.ts [--dry-run]
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { extname, join } from "path"

const DRY_RUN = process.argv.includes("--dry-run")

interface Replacement {
  pattern: RegExp
  replacement: string
}

// Files/directories to SKIP (intentionally physical)
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /\.git\//,
  /dist\//,
  /\.bak$/,
  /clock\.css/, // Clock animation - intentionally physical
  /border-animation\.css/, // Border animation - intentionally physical
  /fix-rtl-properties/, // Don't modify this script
]

const VALID_EXTENSIONS = new Set([".ts", ".tsx", ".css"])

// The replacements to make. Order matters - more specific patterns first.
const REPLACEMENTS: Replacement[] = [
  // Margin
  { pattern: /\bml-(\[?[\w./%-]+\]?)/g, replacement: "ms-$1" },
  { pattern: /\bmr-(\[?[\w./%-]+\]?)/g, replacement: "me-$1" },
  // Padding
  { pattern: /\bpl-(\[?[\w./%-]+\]?)/g, replacement: "ps-$1" },
  { pattern: /\bpr-(\[?[\w./%-]+\]?)/g, replacement: "pe-$1" },
  // Rounded (must come before position to avoid false matches)
  { pattern: /\brounded-l-(\[?[\w./%-]+\]?)/g, replacement: "rounded-s-$1" },
  { pattern: /\brounded-r-(\[?[\w./%-]+\]?)/g, replacement: "rounded-e-$1" },
  { pattern: /\brounded-tl-(\[?[\w./%-]+\]?)/g, replacement: "rounded-ss-$1" },
  { pattern: /\brounded-tr-(\[?[\w./%-]+\]?)/g, replacement: "rounded-se-$1" },
  { pattern: /\brounded-bl-(\[?[\w./%-]+\]?)/g, replacement: "rounded-es-$1" },
  { pattern: /\brounded-br-(\[?[\w./%-]+\]?)/g, replacement: "rounded-ee-$1" },
  // Text alignment
  { pattern: /\btext-left\b/g, replacement: "text-start" },
  { pattern: /\btext-right\b/g, replacement: "text-end" },
  // Border (with size variants - more specific first)
  { pattern: /\bborder-l-(\[?[\w./%-]+\]?)/g, replacement: "border-s-$1" },
  { pattern: /\bborder-r-(\[?[\w./%-]+\]?)/g, replacement: "border-e-$1" },
  { pattern: /\bborder-l\b/g, replacement: "border-s" },
  { pattern: /\bborder-r\b(?!ounded)/g, replacement: "border-e" },
  // Position: left-* → start-*, right-* → end-*
  { pattern: /\bleft-(\[?[\w./%-]+\]?)/g, replacement: "start-$1" },
  { pattern: /\bright-(\[?[\w./%-]+\]?)/g, replacement: "end-$1" },
]

function walkDir(dir: string): string[] {
  const results: string[] = []

  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      if (
        entry.startsWith(".") ||
        entry === "node_modules" ||
        entry === ".next" ||
        entry === "dist"
      )
        continue
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath))
      } else if (VALID_EXTENSIONS.has(extname(entry))) {
        results.push(fullPath)
      }
    }
  } catch {
    // Skip inaccessible directories
  }

  return results
}

function shouldSkipFile(filePath: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(filePath))
}

function isInTailwindContext(line: string, matchStart: number): boolean {
  // Check if the match is inside a className, @apply, or similar Tailwind context
  const before = line.substring(0, matchStart)

  // Inside className="..." or className={cn("...")} or @apply ...
  if (/className[={\s]/.test(before) || /@apply\s/.test(before)) return true
  // Inside a cn() call or clsx() call
  if (/cn\(|clsx\(|twMerge\(/.test(before)) return true
  // Inside a string that looks like Tailwind classes (quoted string with multiple space-separated words)
  if (/["'`][^"'`]*$/.test(before)) {
    // Check if we're inside a string that contains Tailwind-like patterns
    const stringStart = before.lastIndexOf('"')
    const singleStart = before.lastIndexOf("'")
    const backtickStart = before.lastIndexOf("`")
    const lastQuote = Math.max(stringStart, singleStart, backtickStart)
    if (lastQuote >= 0) {
      const inString = before.substring(lastQuote + 1)
      // If the string contains multiple space-separated class-like tokens
      if (/[\w-]+\s+[\w-]+/.test(inString)) return true
    }
  }

  return false
}

function processLine(line: string): string {
  let result = line

  for (const { pattern, replacement } of REPLACEMENTS) {
    pattern.lastIndex = 0

    result = result.replace(pattern, (match, capture, offset) => {
      // Skip if inside rtl: or ltr: variant
      const before = result.substring(Math.max(0, offset - 20), offset)
      if (/rtl:|ltr:/.test(before)) return match

      // Skip animation utility classes (slide-in-from-left/right are physical animations)
      if (/slide-in-from-$/.test(before)) return match

      // Skip Radix data-[side=...] selectors (physical positioning, not text direction)
      if (/data-\[side=\w+\]:/.test(before)) return match
      if (/group-data-\[side=\w+\]:/.test(before)) return match

      // Only convert in Tailwind contexts (className, @apply, string with classes)
      if (!isInTailwindContext(result, offset)) return match

      return replacement.replace(/\$1/g, capture || "")
    })
  }

  return result
}

function processFile(filePath: string): { changes: number; details: string[] } {
  const content = readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  let changes = 0
  const details: string[] = []

  const newLines = lines.map((line, i) => {
    const newLine = processLine(line)
    if (newLine !== line) {
      changes++
      details.push(`  L${i + 1}: ${line.trim()} → ${newLine.trim()}`)
    }
    return newLine
  })

  if (changes > 0 && !DRY_RUN) {
    writeFileSync(filePath, newLines.join("\n"))
  }

  return { changes, details }
}

// Main
console.log(
  DRY_RUN
    ? "DRY RUN - No files will be modified\n"
    : "Converting physical CSS properties to logical equivalents...\n"
)

const srcDir = join(process.cwd(), "src")
const files = walkDir(srcDir).filter((f) => !shouldSkipFile(f))
console.log(`Found ${files.length} files to check\n`)

let totalChanges = 0
let filesModified = 0

for (const file of files) {
  const { changes, details } = processFile(file)
  if (changes > 0) {
    filesModified++
    totalChanges += changes
    const relativePath = file.replace(process.cwd() + "/", "")
    console.log(`${relativePath} (${changes} changes)`)
    if (DRY_RUN) {
      details.forEach((d) => console.log(d))
    }
  }
}

console.log(`\nTotal: ${totalChanges} changes in ${filesModified} files`)
if (DRY_RUN) {
  console.log("Run without --dry-run to apply changes")
}
