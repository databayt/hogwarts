#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// One-shot: strip duplicate body H1 from MDX files where the first body H1
// (outside code fences, after any leading `import { ... }` blocks) matches
// the frontmatter title fuzzily. Also strip a trailing `---` horizontal rule
// if it immediately follows the H1.
//
// Skips files slated for Phase 2 deletion (no point editing files about to die).
//
// Usage: node scripts/docs-strip-h1.mjs [--dry]
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = join(__dirname, "..", "content", "docs-en")
const DRY = process.argv.includes("--dry")

const PHASE_2_DELETIONS = new Set([
  "installation",
  "setup",
  "mvp-undone",
  "business",
  "typography",
  "team-workflow",
  "atoms-factory",
  "templates-factory",
  "pilot",
  "accordion",
  "awesome-shadcn",
  "claude-code",
  "eslint",
  "prettier",
  "newcomers",
  "upwork",
  "credit",
  "domain",
  "resume",
  "vibe-coding",
  "community",
  "issues",
  "safe-seeds",
  "multi-tenancy-tests",
  "ai-document-processing",
])

function normalizeTitle(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return null
  const end = text.indexOf("\n---", 3)
  if (end === -1) return null
  const raw = text.slice(3, end).trim()
  const fm = {}
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/)
    if (!m) continue
    fm[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
  }
  return { fm, bodyStart: end + 4 }
}

function stripH1(text, slug) {
  const parsed = parseFrontmatter(text)
  if (!parsed) return { text, changed: false, reason: "no-frontmatter" }
  const { fm, bodyStart } = parsed
  if (!fm.title) return { text, changed: false, reason: "no-title" }

  const head = text.slice(0, bodyStart)
  const body = text.slice(bodyStart)
  const lines = body.split("\n")

  let inFence = false
  let h1Idx = -1
  let h1Text = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.trim()
    if (stripped.startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^#\s+(\S.+?)\s*$/)
    if (m) {
      h1Idx = i
      h1Text = m[1]
      break
    }
  }

  if (h1Idx === -1) return { text, changed: false, reason: "no-body-h1" }
  if (normalizeTitle(h1Text) !== normalizeTitle(fm.title)) {
    // Allow descriptive variants where one is contained in the other (e.g.
    // title="Sales" body="Sales Strategy"). Still a duplicate from the user's
    // POV — the renderer prints the title as <h1>, then the body H1 renders
    // a second <h1>. Strip these too.
    const a = normalizeTitle(h1Text)
    const b = normalizeTitle(fm.title)
    if (!(a.includes(b) || b.includes(a))) {
      return {
        text,
        changed: false,
        reason: `h1-mismatch: "${h1Text}" vs "${fm.title}"`,
      }
    }
  }

  // Strip the H1 line, plus any blank lines + trailing `---` separator.
  let cutEnd = h1Idx + 1
  // Eat blank lines after H1
  while (cutEnd < lines.length && lines[cutEnd].trim() === "") cutEnd++
  // Eat a single `---` horizontal rule if present
  if (cutEnd < lines.length && lines[cutEnd].trim() === "---") {
    cutEnd++
    while (cutEnd < lines.length && lines[cutEnd].trim() === "") cutEnd++
  }

  const newLines = [...lines.slice(0, h1Idx), ...lines.slice(cutEnd)]
  // Collapse leading blank lines from body
  while (newLines.length && newLines[0].trim() === "") newLines.shift()
  const newBody = newLines.join("\n")

  return {
    text: head.replace(/\n+$/, "\n") + "\n" + newBody,
    changed: true,
    reason: `stripped: "${h1Text}"`,
  }
}

function main() {
  const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".mdx"))
  let changed = 0
  let skipped = 0
  let unchanged = 0
  const log = []

  for (const f of files) {
    const slug = basename(f, ".mdx")
    if (PHASE_2_DELETIONS.has(slug)) {
      skipped++
      continue
    }
    const path = join(DOCS_DIR, f)
    const text = readFileSync(path, "utf8")
    const { text: newText, changed: didChange, reason } = stripH1(text, slug)
    if (didChange) {
      changed++
      log.push(`${slug}: ${reason}`)
      if (!DRY) writeFileSync(path, newText)
    } else {
      unchanged++
    }
  }

  console.log(`\nStrip H1 summary:`)
  console.log(`  Files scanned: ${files.length}`)
  console.log(`  Skipped (Phase 2 deletion): ${skipped}`)
  console.log(`  Unchanged: ${unchanged}`)
  console.log(`  Changed: ${changed}${DRY ? " (DRY RUN)" : ""}`)
  if (log.length) {
    console.log(`\nChanged files:`)
    for (const l of log) console.log(`  ${l}`)
  }
}

main()
