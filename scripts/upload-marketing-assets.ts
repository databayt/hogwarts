#!/usr/bin/env tsx
/**
 * SaaS-marketing homepage asset publisher.
 *
 * Encodes the homepage's imagery to AVIF + WebP at the size it actually
 * renders, uploads it to the `databayt-cdn` bucket under `balqalam/home/`,
 * and writes the manifest the blocks import.
 *
 * Why this exists rather than serving from `public/`:
 *
 *   1. The tiles were shipping as raw PNG behind `<Image unoptimized>` — a
 *      2756x3068, 3.8MB source downloaded to fill a 433px tile. Measured
 *      against the live optimizer that is a 97.6% overpay.
 *   2. Everything under `public/` is served `cache-control: max-age=0,
 *      must-revalidate` (Next's default for non-hashed files), so repeat
 *      visitors re-fetch every asset. CloudFront serves the same objects
 *      `public, max-age=31536000, immutable`.
 *   3. 14MB of imagery rides in every deployment archive, which is uploaded
 *      whole on each deploy (see scripts/deploy-hobby.sh).
 *
 * DEVIATION from scripts/upload-anthropic-assets.ts, deliberately: keys carry
 * an 8-char content hash. That script publishes third-party logos that never
 * change, so a bare name under `immutable` is safe. These tiles DO get
 * replaced in place — the 2026-08-31 imagery re-authoring rewrote 11 of them —
 * and a bare name under a year of `immutable` would hide the new art from
 * every repeat visitor. A hashed key makes new art a new URL, so `immutable`
 * is correct and no CloudFront invalidation is ever needed.
 *
 * Usage:
 *   pnpm tsx scripts/upload-marketing-assets.ts             # dry run (encodes, reports, uploads nothing)
 *   pnpm tsx scripts/upload-marketing-assets.ts --upload    # encode + upload + verify + write manifest
 *   pnpm tsx scripts/upload-marketing-assets.ts --only=modern-05
 *
 * Re-authoring a tile: drop the new art at assets/marketing/home/<name>.png, re-run
 * with --upload, and commit the regenerated manifest. The hash changes, so the
 * URL changes, so the CDN serves the new file immediately.
 */
import "dotenv/config"

import { createHash } from "crypto"
import { readFileSync, statSync, writeFileSync } from "fs"
import { join } from "path"
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import sharp from "sharp"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// GOTCHA: cdn.databayt.org's CloudFront distribution has `databayt-cdn` as its
// origin. AWS_S3_BUCKET in .env names `hogwarts-databayt`, the app's OWN upload
// bucket. Publishing there "succeeds" and then every CDN URL 403s, because the
// distribution never sees the object. This is a CDN publisher by definition, so
// the bucket is hardcoded rather than inherited from the environment.
const BUCKET = "databayt-cdn"
const REGION = process.env.AWS_REGION || "us-east-1"
const CDN = process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim() || "cdn.databayt.org"
const PREFIX = "balqalam/home"
const CACHE_CONTROL = "public, max-age=31536000, immutable"

// Sources live OUTSIDE public/ on purpose. They are encoder input, not served
// files — leaving them in public/ shipped 14MB of unreferenced PNG in every
// deployment archive (which deploy-hobby.sh uploads whole, every time).
const SRC_DIR = join(process.cwd(), "assets/marketing/home")

// The precedent script's MIME_MAP has neither avif nor webm — the two formats
// this one publishes most. An object with the wrong Content-Type is served but
// not rendered, and PutObject reports success either way.
const MIME: Record<string, string> = {
  avif: "image/avif",
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  webm: "video/webm",
  mp4: "video/mp4",
}

// ---------------------------------------------------------------------------
// Manifest: source in public/ → how it is published
//
// `display` is the widest CSS width the asset is ever rendered at, read off
// ModernShowcaseBlock's TILES/PHONE_TILES arrays. Encoding happens at 2x that
// for retina; anything larger is paying for pixels no screen resolves.
// ---------------------------------------------------------------------------

type Entry =
  | { kind: "image"; src: string; display: number }
  | { kind: "poster"; src: string; display: number }
  | { kind: "passthrough"; src: string }

const ASSETS: Record<string, Entry> = {
  // Ticker tiles — AVIF + WebP, resized to 2x their display width.
  "modern-02": { kind: "image", src: "modern-02.png", display: 572 },
  "modern-03": { kind: "image", src: "modern-03.png", display: 433 },
  "modern-04": { kind: "image", src: "modern-04.png", display: 905 },
  "modern-05": { kind: "image", src: "modern-05.png", display: 433 },
  "modern-06": { kind: "image", src: "modern-06.png", display: 433 },
  "modern-07": { kind: "image", src: "modern-07.png", display: 316 },
  "modern-08": { kind: "image", src: "modern-08.png", display: 572 },
  "modern-09": { kind: "image", src: "modern-09.png", display: 316 },
  "modern-10": { kind: "image", src: "modern-10.png", display: 904 },
  "modern-08-phone": { kind: "image", src: "modern-08-phone.png", display: 314 },
  "modern-10-phone": { kind: "image", src: "modern-10-phone.png", display: 415 },

  // StoryNarrativeBlock's letter comparison — also `unoptimized` until now,
  // and 3.1MB of raw PNG between the two. Displayed 50vw >=1200 and 100vw
  // below, so 1200 is the widest CSS width either reaches.
  "ha-compare-1": { kind: "image", src: "ha-compare-1.png", display: 1200 },
  "ha-compare-2": { kind: "image", src: "ha-compare-2.png", display: 1200 },

  // Posters: a single WebP each. <video poster> takes one URL and cannot
  // format-negotiate, so there is no AVIF fallback path to hand it.
  "modern-01-poster": { kind: "poster", src: "modern-01-poster.png", display: 462 },
  "balqalam-wordmarks-poster": {
    kind: "poster",
    src: "balqalam-wordmarks-poster.png",
    display: 433,
  },

  // Video ships as-authored. The webm/mp4 split is the reference's own codec
  // choice, re-encoding risks visible artefacts on typeface footage, and the
  // whole set is ~2.9MB — the win is the cache headers, not the bytes.
  "modern-01-webm": { kind: "passthrough", src: "modern-01.webm" },
  "modern-01-phone-mp4": { kind: "passthrough", src: "modern-01-phone.mp4" },
  "balqalam-wordmarks-mp4": { kind: "passthrough", src: "balqalam-wordmarks.mp4" },
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const DO_UPLOAD = args.includes("--upload")
const ONLY = args.find((a) => a.startsWith("--only="))?.slice("--only=".length)

const s3 = new S3Client({ region: REGION })

const hash8 = (b: Buffer) => createHash("sha256").update(b).digest("hex").slice(0, 8)
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`

/** Encode one source into the formats its kind calls for. */
async function render(e: Entry): Promise<Array<{ ext: string; buf: Buffer }>> {
  const abs = join(SRC_DIR, e.src)
  if (e.kind === "passthrough") {
    return [{ ext: e.src.split(".").pop()!, buf: readFileSync(abs) }]
  }
  const width = e.display * 2
  const pipe = () => sharp(abs).resize({ width, withoutEnlargement: true })
  if (e.kind === "poster") {
    return [{ ext: "webp", buf: await pipe().webp({ quality: 78 }).toBuffer() }]
  }
  return [
    { ext: "avif", buf: await pipe().avif({ quality: 62, effort: 6 }).toBuffer() },
    { ext: "webp", buf: await pipe().webp({ quality: 76 }).toBuffer() },
  ]
}

async function exists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function main() {
  const manifest: Record<string, { kind: Entry["kind"]; urls: Record<string, string> }> = {}
  let srcTotal = 0
  let outTotal = 0

  for (const [name, e] of Object.entries(ASSETS)) {
    if (ONLY && !name.includes(ONLY)) continue

    const abs = join(SRC_DIR, e.src)
    const srcSize = statSync(abs).size
    srcTotal += srcSize

    const outs = await render(e)
    manifest[name] = { kind: e.kind, urls: {} }

    for (const { ext, buf } of outs) {
      const key = `${PREFIX}/${name}.${hash8(buf)}.${ext}`
      const url = `https://${CDN}/${key}`
      manifest[name].urls[ext] = url
      outTotal += buf.length

      const pct = ((buf.length / srcSize) * 100).toFixed(1)
      if (!DO_UPLOAD) {
        console.log(`  [dry] ${name}.${ext.padEnd(4)} ${kb(srcSize)} -> ${kb(buf.length)} (${pct}%)  ${key}`)
        continue
      }
      if (await exists(key)) {
        console.log(`  [skip] ${key} (already published)`)
        continue
      }
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buf,
          ContentType: MIME[ext],
          CacheControl: CACHE_CONTROL,
        })
      )
      console.log(`  [put ] ${name}.${ext.padEnd(4)} ${kb(srcSize)} -> ${kb(buf.length)} (${pct}%)  ${key}`)
    }
  }

  console.log(
    `\n  sources ${(srcTotal / 1048576).toFixed(1)} MB  ->  published ${(outTotal / 1048576).toFixed(2)} MB` +
      `  (${((outTotal / srcTotal) * 100).toFixed(1)}%)`
  )

  if (!DO_UPLOAD) {
    console.log("\n  dry run — nothing uploaded, no manifest written. Re-run with --upload.")
    return
  }

  // Verify over HTTPS, not via the S3 API. PutObject reports success even when
  // the object lands somewhere the distribution cannot see it, so fetching the
  // public URL is the only check that catches a wrong-bucket publish.
  console.log("\n  verifying published URLs through CloudFront:")
  let bad = 0
  for (const [name, entry] of Object.entries(manifest)) {
    for (const [ext, url] of Object.entries(entry.urls)) {
      const res = await fetch(url, { method: "HEAD" })
      const ct = res.headers.get("content-type")
      const ok = res.ok && ct === MIME[ext]
      if (!ok) bad++
      console.log(`  ${ok ? "  ok  " : " FAIL "} ${name}.${ext} -> ${res.status} ${ct}`)
    }
  }
  if (bad) {
    console.error(`\n  ABORT: ${bad} URL(s) did not verify — manifest NOT written.`)
    process.exit(1)
  }

  const out = join(process.cwd(), "src/components/saas-marketing/thmanyah/lib/cdn-assets.ts")
  const pick = (k: Entry["kind"]) =>
    Object.fromEntries(Object.entries(manifest).filter(([, v]) => v.kind === k))
  const images = Object.fromEntries(
    Object.entries(pick("image")).map(([n, v]) => [n, v.urls])
  )
  const posters = Object.fromEntries(
    Object.entries(pick("poster")).map(([n, v]) => [n, v.urls.webp])
  )
  const videos = Object.fromEntries(
    Object.entries(pick("passthrough")).map(([n, v]) => [n, Object.values(v.urls)[0]])
  )

  writeFileSync(
    out,
    `// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * GENERATED by scripts/upload-marketing-assets.ts — do not edit by hand.
 *
 * CDN URLs for the marketing homepage's imagery, served from
 * ${CDN}/${PREFIX}/ with \`${CACHE_CONTROL}\`.
 *
 * Keys carry a content hash, so re-authoring a tile changes its URL and the
 * new art is served immediately with no invalidation. Replace the source under
 * assets/marketing/home/, re-run the script with --upload, and commit this file.
 *
 * Split by kind so call sites are precisely typed: an image has both formats
 * for <picture>, a poster is the single URL <video poster> can take, and a
 * video is whichever one format it was authored in.
 */

/** Ticker tiles: AVIF with a WebP fallback, encoded at 2x display width. */
export const CDN_IMAGES = ${JSON.stringify(images, null, 2)} as const

/** <video poster> URLs — WebP only; a poster cannot format-negotiate. */
export const CDN_POSTERS = ${JSON.stringify(posters, null, 2)} as const

/** Video, published in its authored codec. */
export const CDN_VIDEOS = ${JSON.stringify(videos, null, 2)} as const

export type CdnImage = keyof typeof CDN_IMAGES
export type CdnPoster = keyof typeof CDN_POSTERS
export type CdnVideo = keyof typeof CDN_VIDEOS
`
  )
  console.log(`\n  manifest written: ${out}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
