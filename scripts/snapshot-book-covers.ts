// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One-time: snapshot catalog Book covers (covers.openlibrary.org) onto our
 * own S3, then repoint Book.coverUrl — and every provisioned SchoolBook copy
 * — to the CDN. After this runs, book covers no longer depend on an external
 * service's uptime or rate limits.
 *
 * Idempotent — skips covers already in our bucket; re-running only repoints
 * any rows still on external URLs.
 *
 * Usage: pnpm tsx scripts/snapshot-book-covers.ts        (all external covers)
 *        pnpm tsx scripts/snapshot-book-covers.ts 3      (first N, smoke test)
 */

import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { getRawObject, putRawObject } from "../src/components/catalog/image"

const SOURCE_PREFIX = "catalog/book-covers"
const DELAY_MS = 250 // OpenLibrary asks for gentle crawling

const prisma = new PrismaClient()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN
  if (!cloudfrontDomain) throw new Error("CLOUDFRONT_DOMAIN not configured")

  const limit = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity

  const external = await prisma.book.findMany({
    where: { coverUrl: { startsWith: "http" } },
    select: { id: true, title: true, coverUrl: true },
    orderBy: { id: "asc" },
  })
  const books = Number.isFinite(limit) ? external.slice(0, limit) : external
  console.log(
    `Snapshotting ${books.length}/${external.length} external book covers → s3://${SOURCE_PREFIX}/`
  )

  let uploaded = 0
  let skipped = 0
  let repointed = 0
  let failed = 0

  for (const [i, book] of books.entries()) {
    const key = `${SOURCE_PREFIX}/${book.id}`
    const cdnUrl = `https://${cloudfrontDomain}/${key}`

    try {
      const exists = await getRawObject(key)
      if (!exists) {
        const res = await fetch(book.coverUrl!)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = Buffer.from(await res.arrayBuffer())
        // OpenLibrary serves a 1x1 GIF for unknown ISBNs — treat as missing
        if (buf.length < 1000) throw new Error("placeholder/empty cover")
        const contentType = res.headers.get("content-type") || "image/jpeg"
        await putRawObject(key, buf, contentType)
        uploaded++
        await sleep(DELAY_MS)
      } else {
        skipped++
      }

      const oldUrl = book.coverUrl!
      await prisma.book.update({
        where: { id: book.id },
        data: { coverUrl: cdnUrl },
      })
      // Provisioned schools carry a frozen copy of the cover URL
      const { count } = await prisma.schoolBook.updateMany({
        where: { catalogBookId: book.id, coverUrl: oldUrl },
        data: { coverUrl: cdnUrl },
      })
      repointed += 1 + count
    } catch (e) {
      failed++
      console.warn(`  ✗ ${book.title} (${book.id}): ${(e as Error).message}`)
    }

    if ((i + 1) % 10 === 0) {
      console.log(
        `  ${i + 1}/${books.length} (uploaded ${uploaded}, cached ${skipped}, repointed ${repointed}, failed ${failed})`
      )
    }
  }

  console.log(
    `Done: uploaded ${uploaded}, cached ${skipped}, repointed ${repointed} rows, failed ${failed} of ${books.length}.`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
