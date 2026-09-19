// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Copy catalog assets from the flat legacy prefix onto the hierarchical scheme.
 *
 *   catalog/textbooks/sd-g12-biology/textbook.pdf
 *     -> catalog/sd/g12/biology/textbook.pdf
 *   catalog/textbooks/sd-g12-biology/pages/12.webp
 *     -> catalog/sd/g12/biology/pages/12.webp
 *
 * COPIES. Nothing is deleted — the legacy prefix stays live and is the
 * rollback. It also keeps serving every row whose DB pointer has not been
 * flipped yet, which is what lets the flip happen per-subject instead of as one
 * big-bang.
 *
 * This script is S3-ONLY. It never touches the database: the slug -> folder
 * mapping comes from the committed manifest, so it runs identically against a
 * machine with the curriculum tree and one without. The DB pointer flip is a
 * separate script, run only after this one verifies.
 *
 * Usage (dry run is the DEFAULT — writes require --apply):
 *
 *   npx tsx scripts/catalog/migrate-catalog-keys.ts --bucket=databayt-cdn --only=sd-g12-biology
 *   npx tsx scripts/catalog/migrate-catalog-keys.ts --bucket=databayt-cdn --only=sd-g12-biology --apply
 *   npx tsx scripts/catalog/migrate-catalog-keys.ts --bucket=databayt-cdn --verify-only
 *
 * Flags:
 *   --bucket=<name>     REQUIRED. No default: AWS_S3_BUCKET is the uploads
 *                       bucket (hogwarts-databayt), NOT the CDN origin
 *                       (databayt-cdn), and defaulting to it would silently
 *                       copy into a bucket CloudFront does not serve.
 *   --apply             actually copy. Without it nothing is written.
 *   --only=<slug>       one subject (repeatable via comma).
 *   --verify-only       re-list both prefixes and print the set difference.
 *   --concurrency=<n>   in-flight CopyObject per subject (default 16).
 *
 * Run it once PER BUCKET. The two buckets hold identical object counts but
 * differ by ~16 MB, so they are not mirrors; each bucket's new prefix is built
 * from its own legacy prefix. A cross-bucket copy would silently converge them.
 */

import "dotenv/config"

import {
  CopyObjectCommand,
  HeadObjectCommand,
  paginateListObjectsV2,
  S3Client,
} from "@aws-sdk/client-s3"

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

const BUCKET = argValue("--bucket")
const APPLY = process.argv.includes("--apply")
const VERIFY_ONLY = process.argv.includes("--verify-only")
const ONLY = argValue("--only")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const CONCURRENCY = Number(argValue("--concurrency") ?? 16)

const AWS_REGION = process.env.AWS_REGION || "us-east-1"

if (!BUCKET) {
  console.error(
    "--bucket=<name> is required (databayt-cdn for the CDN origin, hogwarts-databayt for uploads)"
  )
  process.exit(1)
}

function s3Client(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  return new S3Client({
    region: AWS_REGION,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  })
}

/** Every key under a prefix, paginated. Returns key -> size. */
async function listPrefix(
  s3: S3Client,
  prefix: string
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  for await (const page of paginateListObjectsV2(
    { client: s3 },
    { Bucket: BUCKET, Prefix: prefix }
  )) {
    for (const obj of page.Contents ?? []) {
      if (obj.Key) out.set(obj.Key, obj.Size ?? -1)
    }
  }
  return out
}

async function headSize(s3: S3Client, key: string): Promise<number | null> {
  try {
    const res = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    )
    return res.ContentLength ?? -1
  } catch {
    return null
  }
}

/** Run tasks with a bounded number in flight. */
async function pooled<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const item = items[cursor++]
        await fn(item)
      }
    })()
  )
  await Promise.all(workers)
}

const NON_ASCII = /[^ -~]/

interface SubjectReport {
  slug: string
  base: string
  sourceCount: number
  copied: number
  skipped: number
  failed: number
  status: "ok" | "source-missing" | "failed"
  nonAscii: number
}

async function migrateSubject(
  s3: S3Client,
  entry: SubjectDirEntry
): Promise<SubjectReport> {
  const oldPrefix = catalogLegacyPrefix(entry.slug)
  const base = catalogBase(entry)
  const report: SubjectReport = {
    slug: entry.slug,
    base,
    sourceCount: 0,
    copied: 0,
    skipped: 0,
    failed: 0,
    status: "ok",
    nonAscii: 0,
  }

  const source = await listPrefix(s3, oldPrefix)
  report.sourceCount = source.size
  if (source.size === 0) {
    report.status = "source-missing"
    return report
  }

  // The target list is fetched once so the common re-run costs one LIST per
  // subject instead of one HEAD per object.
  const existing = await listPrefix(s3, `${base}/`)

  const work = [...source.entries()].map(([srcKey, size]) => {
    const suffix = srcKey.slice(oldPrefix.length)
    return { srcKey, dstKey: `${base}/${suffix}`, size }
  })

  report.nonAscii = work.filter((w) => NON_ASCII.test(w.dstKey)).length

  await pooled(work, CONCURRENCY, async ({ srcKey, dstKey, size }) => {
    // Idempotency compares ContentLength, NOT ETag. A copy of a multipart
    // upload gets a fresh multipart ETag, so an ETag comparison would never
    // converge on the large PDFs (the biggest here is 138 MB) and would
    // re-copy them on every run.
    const existingSize = existing.has(dstKey)
      ? existing.get(dstKey)!
      : await headSize(s3, dstKey)
    if (existingSize !== null && existingSize === size) {
      report.skipped++
      return
    }

    if (!APPLY) {
      report.copied++
      return
    }

    try {
      await s3.send(
        new CopyObjectCommand({
          Bucket: BUCKET,
          // encodeURI, not encodeURIComponent: the "/" separators must
          // survive, but the raw-Arabic lesson slugs under sd-g5 must not.
          CopySource: encodeURI(`${BUCKET}/${srcKey}`),
          Key: dstKey,
          // COPY, not REPLACE. These objects span six content types including
          // `text/markdown; charset=utf-8`; REPLACE with one hardcoded type
          // (as scripts/migrate-video-paths.ts:171 does for mp4) would stamp
          // the wrong type on everything. COPY carries Content-Type AND the
          // existing `public, max-age=31536000, immutable`.
          MetadataDirective: "COPY",
          // No ACL — the bucket is bucket-owner-enforced and rejects them.
        })
      )
      report.copied++
    } catch (err) {
      report.failed++
      report.status = "failed"
      console.error(
        `    FAIL ${srcKey}\n         -> ${dstKey}\n         ${err}`
      )
    }
  })

  return report
}

async function verifySubject(
  s3: S3Client,
  entry: SubjectDirEntry
): Promise<void> {
  const oldPrefix = catalogLegacyPrefix(entry.slug)
  const base = catalogBase(entry)
  const [source, target] = await Promise.all([
    listPrefix(s3, oldPrefix),
    listPrefix(s3, `${base}/`),
  ])
  const missing: string[] = []
  for (const [srcKey, size] of source) {
    const dstKey = `${base}/${srcKey.slice(oldPrefix.length)}`
    const got = target.get(dstKey)
    if (got === undefined) missing.push(`${dstKey} (absent)`)
    else if (got !== size) missing.push(`${dstKey} (${got} != ${size})`)
  }
  const flag = missing.length ? "MISSING" : "ok"
  console.log(
    `  ${flag.padEnd(8)} ${entry.slug.padEnd(30)} ${source.size} old / ${target.size} new`
  )
  missing.slice(0, 5).forEach((m) => console.log(`             ${m}`))
  if (missing.length > 5)
    console.log(`             ...and ${missing.length - 5} more`)
}

async function main() {
  const all = manifest as SubjectDirEntry[]
  const entries = ONLY ? all.filter((e) => ONLY.includes(e.slug)) : all

  if (ONLY) {
    const unknown = ONLY.filter((s) => !all.some((e) => e.slug === s))
    if (unknown.length) {
      console.error(`unknown slug(s) in --only: ${unknown.join(", ")}`)
      process.exit(1)
    }
  }

  const s3 = s3Client()
  const mode = VERIFY_ONLY ? "VERIFY" : APPLY ? "APPLY" : "DRY RUN"
  console.log(
    `\n${mode} — bucket=${BUCKET} subjects=${entries.length} concurrency=${CONCURRENCY}\n`
  )

  if (VERIFY_ONLY) {
    for (const entry of entries) await verifySubject(s3, entry)
    return
  }

  const reports: SubjectReport[] = []
  for (const entry of entries) {
    const r = await migrateSubject(s3, entry)
    reports.push(r)
    const verb = APPLY ? "copied" : "would copy"
    console.log(
      `  ${r.status === "ok" ? "ok      " : r.status === "source-missing" ? "NO SOURCE" : "FAILED  "} ` +
        `${r.slug.padEnd(30)} ${r.base.padEnd(34)} ${r.sourceCount} src / ${r.copied} ${verb} / ${r.skipped} present` +
        (r.failed ? ` / ${r.failed} FAILED` : "") +
        (r.nonAscii ? ` / ${r.nonAscii} non-ascii` : "")
    )
  }

  const sum = (f: (r: SubjectReport) => number) =>
    reports.reduce((a, r) => a + f(r), 0)
  const missing = reports.filter((r) => r.status === "source-missing")
  const failed = reports.filter((r) => r.status === "failed")

  console.log(
    `\n${mode} summary: ${reports.length} subjects · ${sum((r) => r.sourceCount)} source objects · ` +
      `${sum((r) => r.copied)} ${APPLY ? "copied" : "to copy"} · ${sum((r) => r.skipped)} already present` +
      (sum((r) => r.failed) ? ` · ${sum((r) => r.failed)} FAILED` : "")
  )
  if (missing.length) {
    console.log(
      `\n${missing.length} subject(s) have NO objects on the legacy prefix — they stay as they are (status quo, not a regression):`
    )
    missing.forEach((r) => console.log(`  ${r.slug}`))
  }
  if (failed.length) {
    console.log(`\n${failed.length} subject(s) had copy failures — see above.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
