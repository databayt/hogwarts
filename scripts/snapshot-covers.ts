// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-time: snapshot the US lesson/chapter cover SOURCES onto our own S3, so
 * re-seeding the catalog never touches an external CDN again. After this runs,
 * `lesson-covers.ts` reads sources from `catalog/source-covers/{coverId}` and
 * the external fetch is removed.
 *
 * Idempotent — skips covers already in our bucket.
 *
 * Usage: pnpm tsx scripts/snapshot-covers.ts        (full ~891)
 *        pnpm tsx scripts/snapshot-covers.ts 3      (first N, for a smoke test)
 */

import "dotenv/config"

import fs from "fs"
import path from "path"

import { getRawObject, putRawObject } from "../src/components/catalog/image"

const INVENTORY = path.resolve(
  __dirname,
  "../scripts/us-curriculum/us-inventory.json"
)
const SOURCE_PREFIX = "catalog/source-covers"
const DELAY_MS = 120

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function uniqueCoverIds(): string[] {
  const raw = fs.readFileSync(INVENTORY, "utf-8")
  const ids = new Set<string>()
  for (const m of raw.matchAll(/covers\/([a-zA-Z0-9]+)/g)) ids.add(m[1])
  return [...ids].sort()
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity
  const all = uniqueCoverIds()
  const ids = Number.isFinite(limit) ? all.slice(0, limit) : all
  console.log(
    `Snapshotting ${ids.length}/${all.length} cover sources → s3://${SOURCE_PREFIX}/`
  )

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const [i, coverId] of ids.entries()) {
    const key = `${SOURCE_PREFIX}/${coverId}`

    if (await getRawObject(key)) {
      skipped++
      continue
    }

    try {
      const res = await fetch(
        `https://img.clickviewapp.com/v2/covers/${coverId}?width=2048`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get("content-type") || "image/jpeg"
      await putRawObject(key, buf, contentType)
      uploaded++
      await sleep(DELAY_MS)
    } catch (e) {
      failed++
      console.warn(`  ✗ ${coverId}: ${(e as Error).message}`)
    }

    if ((i + 1) % 50 === 0) {
      console.log(
        `  ${i + 1}/${ids.length} (uploaded ${uploaded}, skipped ${skipped}, failed ${failed})`
      )
    }
  }

  console.log(
    `Done: uploaded ${uploaded}, skipped ${skipped}, failed ${failed} of ${ids.length}.`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
