// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CDN asset URL resolver.
 *
 * Maps asset paths to CloudFront CDN URLs.
 * Uses NEXT_PUBLIC_CDN_DOMAIN so it works in both server and client components.
 *
 * S3 directory structure (all flat, no nesting):
 *   /icons/          - Small, simple, functional (SVG or PNG)
 *   /illustrations/  - Art, decorative, complex
 *   /animations/     - Lottie JSON files
 *   /media/          - Video and audio
 *   /photos/         - Real photographs
 */

const CDN = process.env.NEXT_PUBLIC_CDN_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}`
  : ""

/**
 * Resolve an asset path to its CDN URL.
 *
 * @example
 * asset("/icons/logo.png")
 * asset("/illustrations/hands-build.svg")
 * asset("/photos/abdout.jpg")
 * asset("/animations/confetti.json")
 * asset("/media/story.mp4")
 */
export function asset(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${CDN}${clean}`
}
