// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Generate `prisma/seeds/catalog/sd-subject-dirs.json` — the committed bridge
 * from a DB `Subject.slug` to its curriculum FOLDER name.
 *
 * Why a committed file rather than a lookup:
 *
 * `curriculum/` is gitignored, 3.6 GB, and exists on exactly one Mac. The CDN
 * migration's flip has to run against the PROD database, where that tree is not
 * present. So the dir->slug resolution happens once, here, and every downstream
 * script reads the manifest instead of the tree.
 *
 * The map is NOT invertible in code. `DIR_TO_SLUG_OVERRIDES` in
 * `prisma/seeds/catalog/sd.ts` sends both `islamic` and `islamic-studies` to
 * `islamic-studies`, so a generic inverse would have to guess. This generator
 * therefore resolves forwards from real directories and keeps a small explicit
 * table for the rows that have CDN objects but no directory left on disk.
 *
 *   npx tsx scripts/catalog/build-subject-dir-manifest.ts [--check]
 *
 * --check  verify the committed manifest still matches the tree + DB, and exit
 *          non-zero on drift. Writes nothing. Intended for CI / pre-deploy.
 */

import fs from "node:fs"
import path from "node:path"

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { resolveSdDbSlug } from "../../prisma/seeds/catalog/sd"

const CURRICULUM_DIR = path.resolve(__dirname, "../../curriculum/sd")
const OUT_PATH = path.resolve(
  __dirname,
  "../../prisma/seeds/catalog/sd-subject-dirs.json"
)

const CHECK_ONLY = process.argv.includes("--check")

/**
 * Rows whose CDN objects exist under `catalog/textbooks/<slug>/` but whose
 * curriculum directory is gone from disk. All three fall out of inverting
 * `DIR_TO_SLUG_OVERRIDES` (sd.ts) by hand — `curriculum/sd/g10/` today holds
 * only `arabic`, not the three arabic sub-disciplines it once did.
 *
 * This table is deliberately literal. An unresolved row aborts the generator
 * rather than being guessed at.
 */
const CDN_ONLY_DIRS: Record<string, { grade: string; subjectDir: string }> = {
  "sd-g10-arabic-advanced": { grade: "g10", subjectDir: "arabic-specialized" },
  "sd-g10-literature": { grade: "g10", subjectDir: "arabic-literature" },
  "sd-g10-rhetoric": { grade: "g10", subjectDir: "arabic-rhetoric" },
}

export interface SubjectDirEntry {
  slug: string
  curriculum: string
  grade: string
  subjectDir: string
  /** "tree" = resolved from a real directory; "override" = CDN_ONLY_DIRS. */
  source: "tree" | "override"
}

function walkTree(): { entries: SubjectDirEntry[]; collisions: string[] } {
  const bySlug = new Map<string, SubjectDirEntry>()
  const collisions: string[] = []

  for (const grade of fs.readdirSync(CURRICULUM_DIR).sort()) {
    if (!/^g\d+$/.test(grade)) continue
    const gradePath = path.join(CURRICULUM_DIR, grade)
    if (!fs.statSync(gradePath).isDirectory()) continue

    for (const dirName of fs.readdirSync(gradePath).sort()) {
      if (dirName.startsWith("_") || dirName.startsWith(".")) continue
      if (!fs.statSync(path.join(gradePath, dirName)).isDirectory()) continue

      const slug = resolveSdDbSlug(grade, dirName)
      const existing = bySlug.get(slug)
      if (existing) {
        // Two directories claiming one slug: the key scheme would silently
        // pick whichever came last, and half the assets would land under the
        // wrong prefix. Never guess.
        collisions.push(
          `${slug}: ${existing.grade}/${existing.subjectDir} vs ${grade}/${dirName}`
        )
        continue
      }
      bySlug.set(slug, {
        slug,
        curriculum: "sd",
        grade,
        subjectDir: dirName,
        source: "tree",
      })
    }
  }
  return { entries: [...bySlug.values()], collisions }
}

async function main() {
  if (!fs.existsSync(CURRICULUM_DIR))
    throw new Error(
      `curriculum tree not found at ${CURRICULUM_DIR} — this generator only runs on a machine that has it`
    )

  const { entries, collisions } = walkTree()
  if (collisions.length) {
    console.error("\nFATAL: directory -> slug collisions:")
    collisions.forEach((c) => console.error(`  ${c}`))
    process.exit(1)
  }
  const bySlug = new Map(entries.map((e) => [e.slug, e]))

  const prisma = new PrismaClient()
  try {
    // The driving set is every row carrying the legacy prefix in ANY of the
    // four key columns — NOT `pdf IS NOT NULL`. sd-g8-art has art keys and no
    // pdf, and a pdf-driven run would strand it.
    const rows = await prisma.$queryRawUnsafe<{ slug: string }[]>(`
      SELECT slug FROM catalog_subjects
      WHERE pdf LIKE 'catalog/textbooks/%'
         OR cover LIKE 'catalog/textbooks/%'
         OR "thumbnailKey" LIKE 'catalog/textbooks/%'
         OR "bannerUrl" LIKE 'catalog/textbooks/%'
      ORDER BY slug
    `)

    const manifest: SubjectDirEntry[] = []
    const unresolved: string[] = []

    for (const { slug } of rows) {
      const fromTree = bySlug.get(slug)
      if (fromTree) {
        manifest.push(fromTree)
        continue
      }
      const override = CDN_ONLY_DIRS[slug]
      if (override) {
        manifest.push({
          slug,
          curriculum: "sd",
          grade: override.grade,
          subjectDir: override.subjectDir,
          source: "override",
        })
        continue
      }
      unresolved.push(slug)
    }

    if (unresolved.length) {
      console.error(
        `\nFATAL: ${unresolved.length} DB row(s) carry the legacy prefix but resolve to no directory:`
      )
      unresolved.forEach((s) => console.error(`  ${s}`))
      console.error("\nAdd them to CDN_ONLY_DIRS in this file, then re-run.")
      process.exit(1)
    }

    manifest.sort((a, b) => a.slug.localeCompare(b.slug))
    const json = `${JSON.stringify(manifest, null, 2)}\n`

    const fromTreeCount = manifest.filter((e) => e.source === "tree").length
    const overrideCount = manifest.length - fromTreeCount
    const treeOnly = entries.filter((e) => !rows.some((r) => r.slug === e.slug))

    console.log(`DB rows on the legacy prefix : ${rows.length}`)
    console.log(`directories walked           : ${entries.length}`)
    console.log(`manifest entries             : ${manifest.length}`)
    console.log(`  from tree                  : ${fromTreeCount}`)
    console.log(`  from CDN_ONLY_DIRS         : ${overrideCount}`)
    if (overrideCount)
      manifest
        .filter((e) => e.source === "override")
        .forEach((e) =>
          console.log(`      ${e.slug} -> ${e.grade}/${e.subjectDir}`)
        )
    if (treeOnly.length) {
      console.log(
        `directories with no legacy DB key (not in manifest, informational): ${treeOnly.length}`
      )
      treeOnly.forEach((e) => console.log(`      ${e.grade}/${e.subjectDir}`))
    }

    if (CHECK_ONLY) {
      const current = fs.existsSync(OUT_PATH)
        ? fs.readFileSync(OUT_PATH, "utf8")
        : ""
      if (current !== json) {
        console.error(
          "\nFATAL: committed manifest is stale — re-run without --check"
        )
        process.exit(1)
      }
      console.log("\n--check: manifest is current")
      return
    }

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, json)
    console.log(`\nwrote ${path.relative(process.cwd(), OUT_PATH)}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
