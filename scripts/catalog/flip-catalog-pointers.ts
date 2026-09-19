// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Repoint `catalog_subjects` from the legacy flat prefix to the hierarchical
 * scheme, one subject at a time, only after its objects are verified present.
 *
 *   pdf/cover/thumbnailKey/bannerUrl
 *     catalog/textbooks/sd-g12-biology/...  ->  catalog/sd/g12/biology/...
 *
 * ORDER IS THE WHOLE HAZARD. The textbook reader derives `textbook.md`,
 * `pages/` and `structure.json` from `Subject.pdf` alone — those three have no
 * DB pointer of their own. A row flipped before its objects land renders the
 * "open PDF" fallback and looks merely disappointing rather than broken. So
 * every subject is gated on a set-inclusion check against S3 before its UPDATE.
 *
 * The driving set is every row carrying the legacy prefix in ANY of the four
 * columns — 138, not the 137 with a `pdf`. sd-g8-art has art keys and no pdf; a
 * pdf-driven run would strand it.
 *
 * `catalog/concepts/...` is untouched BY CONSTRUCTION: only values that start
 * with the legacy prefix are rewritten, so the 242 shared concept covers and
 * 255 concept thumbnails/banners cannot match. There is no allowlist to keep in
 * sync.
 *
 * Usage (dry run is the DEFAULT):
 *
 *   npx tsx scripts/catalog/flip-catalog-pointers.ts --only=sd-g12-biology
 *   npx tsx scripts/catalog/flip-catalog-pointers.ts --only=sd-g12-biology --apply
 *   npx tsx scripts/catalog/flip-catalog-pointers.ts --apply --rollback
 *
 * Flags:
 *   --apply       perform the UPDATE. Without it nothing is written.
 *   --only=<...>  restrict to these slugs (comma separated).
 *   --rollback    reverse direction: new prefix -> legacy prefix.
 *   --bucket=     bucket to gate against (default databayt-cdn, the CDN origin
 *                 CloudFront actually serves).
 *   --skip-gate   flip without the S3 check. For rollback only, where the
 *                 target objects are the legacy ones and are known present.
 */

import "dotenv/config"

import { paginateListObjectsV2, S3Client } from "@aws-sdk/client-s3"
import { PrismaClient } from "@prisma/client"

import manifest from "../../prisma/seeds/catalog/sd-subject-dirs.json"
import {
  catalogBase,
  catalogLegacyPrefix,
} from "../../src/components/catalog/catalog-key"

interface SubjectDirEntry {
  slug: string
  curriculum: string
  grade: string
  subjectDir: string
  source: string
}

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`))
  return hit?.slice(flag.length + 1)
}

const APPLY = process.argv.includes("--apply")
const ROLLBACK = process.argv.includes("--rollback")
const SKIP_GATE = process.argv.includes("--skip-gate")
const BUCKET = argValue("--bucket") ?? "databayt-cdn"
const ONLY = argValue("--only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const prisma = new PrismaClient()
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
})

const COLUMNS = ["pdf", "cover", "thumbnailKey", "bannerUrl"] as const
type Column = (typeof COLUMNS)[number]

interface Row {
  id: string
  slug: string
  pdf: string | null
  cover: string | null
  thumbnailKey: string | null
  bannerUrl: string | null
}

async function listPrefix(prefix: string): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  for await (const page of paginateListObjectsV2(
    { client: s3 },
    { Bucket: BUCKET, Prefix: prefix }
  )) {
    for (const obj of page.Contents ?? [])
      if (obj.Key) out.set(obj.Key, obj.Size ?? -1)
  }
  return out
}

async function main() {
  const all = manifest as SubjectDirEntry[]
  const entries = ONLY ? all.filter((e) => ONLY.includes(e.slug)) : all
  if (ONLY) {
    const unknown = ONLY.filter((s) => !all.some((e) => e.slug === s))
    if (unknown.length) {
      console.error(`unknown slug(s): ${unknown.join(", ")}`)
      process.exit(1)
    }
  }

  const mode = `${APPLY ? "APPLY" : "DRY RUN"}${ROLLBACK ? " (ROLLBACK)" : ""}`
  console.log(
    `\n${mode} — gate bucket=${BUCKET} subjects=${entries.length}${SKIP_GATE ? " GATE SKIPPED" : ""}\n`
  )

  const stats = { flipped: 0, alreadyDone: 0, gated: 0, noChange: 0, raced: 0 }

  for (const entry of entries) {
    const legacy = catalogLegacyPrefix(entry.slug)
    const modern = `${catalogBase(entry)}/`
    const from = ROLLBACK ? modern : legacy
    const to = ROLLBACK ? legacy : modern

    const row = (await prisma.subject.findUnique({
      where: { slug: entry.slug },
      select: {
        id: true,
        slug: true,
        pdf: true,
        cover: true,
        thumbnail: true,
        banner: true,
      },
    })) as unknown as {
      id: string
      slug: string
      pdf: string | null
      cover: string | null
      thumbnail: string | null
      banner: string | null
    } | null

    if (!row) {
      console.log(`  SKIP     ${entry.slug.padEnd(30)} no DB row`)
      continue
    }

    const current: Row = {
      id: row.id,
      slug: row.slug,
      pdf: row.pdf,
      cover: row.cover,
      thumbnailKey: row.thumbnail,
      bannerUrl: row.banner,
    }

    // Only values on the source prefix move. Everything else — notably the
    // shared catalog/concepts/ art — is left exactly as it is.
    const next: Record<Column, string | null> = {
      pdf: current.pdf,
      cover: current.cover,
      thumbnailKey: current.thumbnailKey,
      bannerUrl: current.bannerUrl,
    }
    let changes = 0
    for (const col of COLUMNS) {
      const value = current[col]
      if (value?.startsWith(from)) {
        next[col] = to + value.slice(from.length)
        changes++
      }
    }

    if (changes === 0) {
      const done = COLUMNS.some((c) => current[c]?.startsWith(to))
      if (done) stats.alreadyDone++
      else stats.noChange++
      console.log(
        `  ${done ? "done    " : "nothing "} ${entry.slug.padEnd(30)} ${done ? "already on target prefix" : "no key on the source prefix"}`
      )
      continue
    }

    // The gate: every object under the source prefix must exist under the
    // target prefix, and each of the (up to 4) values this row actually stores
    // must resolve. Cheaper and stricter than HEADing blind.
    if (!SKIP_GATE) {
      const [src, dst] = await Promise.all([listPrefix(from), listPrefix(to)])
      const missing: string[] = []
      for (const [k, size] of src) {
        const target = to + k.slice(from.length)
        if (dst.get(target) !== size) missing.push(target)
      }
      for (const col of COLUMNS) {
        const v = next[col]
        if (v?.startsWith(to) && !dst.has(v)) missing.push(`${col}: ${v}`)
      }
      if (missing.length) {
        stats.gated++
        console.log(
          `  GATED    ${entry.slug.padEnd(30)} ${missing.length} object(s) not present on the target prefix`
        )
        missing.slice(0, 3).forEach((m) => console.log(`             ${m}`))
        continue
      }
    }

    if (!APPLY) {
      stats.flipped++
      console.log(
        `  would   ${entry.slug.padEnd(30)} ${changes} column(s) -> ${to}`
      )
      continue
    }

    // Single-row UPDATE = its own transaction, so a row is never half-flipped.
    // The IS NOT DISTINCT FROM guards make it optimistic-concurrency safe: if
    // another writer (a seed) changed the row since the read, 0 rows match and
    // we report instead of clobbering.
    const affected = await prisma.$executeRaw`
      UPDATE catalog_subjects
         SET pdf = ${next.pdf},
             cover = ${next.cover},
             "thumbnailKey" = ${next.thumbnailKey},
             "bannerUrl" = ${next.bannerUrl}
       WHERE id = ${current.id}
         AND pdf IS NOT DISTINCT FROM ${current.pdf}
         AND cover IS NOT DISTINCT FROM ${current.cover}
         AND "thumbnailKey" IS NOT DISTINCT FROM ${current.thumbnailKey}
         AND "bannerUrl" IS NOT DISTINCT FROM ${current.bannerUrl}
    `

    if (affected === 0) {
      stats.raced++
      console.log(
        `  RACED    ${entry.slug.padEnd(30)} row changed under us — re-run`
      )
      continue
    }
    stats.flipped++
    console.log(
      `  flipped  ${entry.slug.padEnd(30)} ${changes} column(s) -> ${to}`
    )
  }

  console.log(
    `\n${mode} summary: ${stats.flipped} ${APPLY ? "flipped" : "to flip"} · ` +
      `${stats.alreadyDone} already done · ${stats.gated} gated · ` +
      `${stats.noChange} nothing to do${stats.raced ? ` · ${stats.raced} RACED` : ""}`
  )
  if (stats.gated)
    console.log(
      `\n${stats.gated} subject(s) were held back because their objects are not on the target prefix.\n` +
        `That is the gate doing its job — copy them first, then re-run.`
    )
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
