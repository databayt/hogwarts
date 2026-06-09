// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Generate `curriculum/<dir>/g{N}/<subject>/structure.json` files from a compact
 * spec — the fast way to author the tree the `tree-engine.ts` seeds.
 *
 * Spec shape (JSON):
 *   {
 *     "dir": "caie-igcse",
 *     "source": "https://www.cambridgeinternational.org/...",
 *     "grades": {
 *       "g10": {
 *         "math":   { "name": "Mathematics", "chapters": ["Number", "Algebra", ...] },
 *         "physics":{ "name": "Physics",     "chapters": ["Motion", "Forces", ...] }
 *       }
 *     }
 *   }
 *
 * Each chapter title becomes a chapter (`unit-NN-<kebab>`) with one lesson.
 * Run: npx tsx scripts/gen-curriculum-structure.ts <spec.json>
 */

import fs from "fs"
import path from "path"

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface SubjectSpec {
  name: string
  source?: string
  chapters: string[]
}
interface Spec {
  dir: string
  source?: string
  grades: Record<string, Record<string, SubjectSpec>>
}

const specPath = process.argv[2]
if (!specPath) {
  console.error("usage: tsx scripts/gen-curriculum-structure.ts <spec.json>")
  process.exit(1)
}

const spec: Spec = JSON.parse(fs.readFileSync(specPath, "utf-8"))
const root = path.resolve(__dirname, "..", "curriculum", spec.dir)

let files = 0
let chapters = 0
for (const [grade, subjects] of Object.entries(spec.grades)) {
  for (const [subjectSlug, s] of Object.entries(subjects)) {
    const chs = s.chapters.map((title, i) => ({
      slug: `unit-${String(i + 1).padStart(2, "0")}-${kebab(title)}`,
      title,
      lessons: [{ slug: `01-${kebab(title)}`, title }],
    }))
    const out = {
      subject: subjectSlug,
      grade,
      subject_name: s.name,
      source: s.source ?? spec.source ?? null,
      content_status: "authored",
      chapters: chs,
    }
    const dir = path.join(root, grade, subjectSlug)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, "structure.json"),
      JSON.stringify(out, null, 2) + "\n"
    )
    files++
    chapters += chs.length
  }
}
console.log(
  `curriculum/${spec.dir}: wrote ${files} structure.json (${chapters} chapters)`
)
