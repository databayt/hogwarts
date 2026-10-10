// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one origin for curated hogwarts media: cdn.databayt.org (CloudFront →
 * the `databayt-cdn` bucket). Pure string logic — safe in server and client
 * components; NEXT_PUBLIC_CDN_DOMAIN is inlined at build time.
 *
 * Layout under `hogwarts/` MIRRORS the app's routes (hogwarts is the internal
 * name; balqalam is only the public brand on screen):
 *   hogwarts/<route>/<flow>-<step>-<locale>-<w>.<hash>.avif   /shoot stills
 *   hogwarts/<route>/<flow>-<locale>.<hash>.mp4               /record + sim video
 *   hogwarts/<name>.<hash>.<ext>                              homepage (route /)
 *   hogwarts/<file>                                           app chrome, see asset()
 * e.g. hogwarts/students/add-student-created-ar-1600.….avif, hogwarts/school/bulk/….
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
