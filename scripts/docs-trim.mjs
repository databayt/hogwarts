#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Mechanical trim:
//  • Strip ASCII flow diagrams (untagged code fences with > 6 lines of box-drawing).
//  • Strip status-style sections (Production Readiness, Known Issues, Gaps & Roadmap, etc.).
//  • Strip inline JSX <div className="grid grid-cols-…"> wrappers and their <span/<a> badge soup.
//
// Usage: node scripts/docs-trim.mjs <file> [--dry]
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const args = process.argv.slice(2)
const DRY = args.includes("--dry")
const target = args.find((a) => !a.startsWith("--"))
if (!target) {
  console.error("Usage: docs-trim <file> [--dry]")
  process.exit(2)
}

const file = resolve(target)
const original = readFileSync(file, "utf8")

const STATUS_HEADINGS = [
  /^##+\s+production readiness/i,
  /^##+\s+implementation status/i,
  /^##+\s+known issues/i,
  /^##+\s+gaps?\s*(?:&|and)\s*roadmap/i,
  /^##+\s+gaps?\s*(?:&|and)\s*(?:future|todo|next)/i,
  /^##+\s+roadmap/i,
  /^##+\s+future\s+(?:work|enhancements?|improvements?)/i,
  /^##+\s+todo/i,
  /^##+\s+resolved/i,
  /^##+\s+recommended\s+implementation\s+order/i,
  /^##+\s+best\s+practices/i,
  /^##+\s+for\s+(?:developers|administrators|integrating)/i,
]

function stripStatusSections(text) {
  const lines = text.split("\n")
  const out = []
  let skipUntilLevel = null
  for (const line of lines) {
    if (skipUntilLevel !== null) {
      // detect a heading at the same or higher level to stop skipping
      const m = line.match(/^(#+)\s/)
      if (m && m[1].length <= skipUntilLevel) {
        skipUntilLevel = null
        out.push(line)
      }
      continue
    }
    let isStatusHeading = false
    for (const re of STATUS_HEADINGS) {
      if (re.test(line.trim())) {
        const m = line.match(/^(#+)/)
        skipUntilLevel = m ? m[1].length : 2
        isStatusHeading = true
        break
      }
    }
    if (!isStatusHeading) out.push(line)
  }
  return out.join("\n")
}

function stripAsciiCodeFences(text) {
  // Remove untagged code fences that look like ASCII box diagrams.
  const lines = text.split("\n")
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const m = line.match(/^(\s*)```\s*$/)
    if (m) {
      // unfenced or no language tag — collect until closing fence
      const fenceIndent = m[1]
      const collected = []
      let j = i + 1
      while (j < lines.length) {
        if (lines[j].match(new RegExp(`^${fenceIndent}\`\`\`\\s*$`))) break
        collected.push(lines[j])
        j++
      }
      // detect ASCII art: contains box chars or lots of pipes/dashes per line
      const boxRe = /[┌┐└┘├┤┬┴┼─│]/
      const hasBox = collected.some((l) => boxRe.test(l))
      const heuristic =
        hasBox ||
        (collected.length > 6 &&
          collected.filter((l) => /[│|┃]/.test(l) || /^\s*[+\-=]+/.test(l))
            .length /
            collected.length >
            0.4)
      if (heuristic) {
        // skip the entire fence (drop it)
        i = j + 1
        continue
      }
    }
    out.push(line)
    i++
  }
  return out.join("\n")
}

function stripInlineJsxGrids(text) {
  // Remove blocks of: <div className="...grid..."> ... </div>
  // Greedy match across lines, conservative — only when className contains grid
  const re = /<div\s+className="[^"]*\bgrid\b[^"]*"[^>]*>[\s\S]*?<\/div>\s*\n?/g
  let next = text.replace(re, "")
  // Also flatten any leftover <span className="ml-2 ...">label</span> badges
  next = next.replace(
    /\s*<span\s+className="ml-[12]\s+px-[^"]*"[^>]*>[^<]*<\/span>/g,
    ""
  )
  // And drop any <a className="bg-muted ..."> shortcut buttons (readme/issue/docs badges)
  next = next.replace(
    /<a\s+href="[^"]*"\s+(?:target="_blank"\s+)?className="bg-muted[^"]*"[^>]*>[\s\S]*?<\/a>\s*/g,
    ""
  )
  // Collapse 3+ blank lines to 2
  next = next.replace(/\n{3,}/g, "\n\n")
  return next
}

let next = original
next = stripStatusSections(next)
next = stripAsciiCodeFences(next)
next = stripInlineJsxGrids(next)

const before = original.split("\n").length
const after = next.split("\n").length

console.log(`${target}: ${before} → ${after} lines (${before - after} removed)`)

if (!DRY) writeFileSync(file, next)
