// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one origin for curated hogwarts media: cdn.databayt.org (CloudFront →
 * the `databayt-cdn` bucket). Pure string logic — safe in server and client
 * components; NEXT_PUBLIC_CDN_DOMAIN is inlined at build time.
 *
 * Layout under `hogwarts/` MIRRORS the app's URLs, language first — the same
 * shape as <school>.databayt.org/<lang>/<route> (hogwarts is the internal
 * name; balqalam is only the public brand on screen):
 *   hogwarts/<lang>/<route>[/<flow>]/video.mp4           tutorial (+ video.av1.mp4,
 *                                                        video.poster.webp, video.vtt)
 *   hogwarts/<lang>/<route>[/<flow>]/<step>.avif         still (+ @2x, .webp)
 *   hogwarts/<lang>/<route>/page.avif                    page still
 *   hogwarts/<file>                                      app chrome, see asset()
 * e.g. hogwarts/ar/school/bulk/student/video.mp4, hogwarts/en/students/add/list.avif.
 * No key carries a hash: the manifest appends ?v=<sha8> for cache busting.
 * Flow media is addressed by id through docs/media-manifest.json, never by URL.
 *
 * User uploads are a different lane (the `hogwarts-databayt` bucket, see
 * upload-url.ts and cloudfront-url.ts) — never build them from this origin.
 */
export const CDN_HOST =
  process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim() || "cdn.databayt.org"

export const CDN_ORIGIN = `https://${CDN_HOST}`

/** A full URL for a key in the curated bucket: cdn("hogwarts/animations/x.json"). */
export function cdn(key: string): string {
  return `${CDN_ORIGIN}/${key.replace(/^\/+/, "")}`
}
