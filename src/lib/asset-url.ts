// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * CDN asset URL resolver.
 *
 * Maps hogwarts asset paths to the unified asset CDN
 * (cdn.databayt.org). Uses NEXT_PUBLIC_CDN_DOMAIN so it works in both server and
 * client components.
 *
 * Layout: ungrouped hogwarts assets live under the `hogwarts/` namespace
 * (cdn.databayt.org/hogwarts/…), mirroring this app's `public/` tree:
 *   /icons/          - Small, simple, functional (SVG or PNG)
 *   /illustrations/  - Art, decorative, complex
 *   /animations/     - Lottie JSON files
 *   /media/          - Video and audio
 *   /photos/         - Real photographs
 * As assets get fine-grouped into their own namespaces (anthropic/, fill/, …),
 * their call sites move to a full CDN URL; everything else defaults here.
 */

const CDN = process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim()
  ? `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN.trim()}`
  : ""

/** The default namespace for not-yet-grouped hogwarts assets. */
const NS = "/hogwarts"

/**
 * Resolve an asset path to its CDN URL, FLAT under the hogwarts/ namespace.
 * Only the file name is used — any source subdir (/icons, /illustrations, …) is
 * dropped, since ungrouped assets live flat at cdn.databayt.org/hogwarts/<file>
 * until they're fine-grouped into a dedicated namespace.
 *
 * @example
 * asset("/icons/logo.png")      // → https://cdn.databayt.org/hogwarts/logo.png
 * asset("/illustrations/x.svg") // → https://cdn.databayt.org/hogwarts/x.svg
 *
 * An absolute URL is returned untouched (already-grouped, full CDN URL).
 */
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  const file = path.split("/").filter(Boolean).pop() ?? ""
  return `${CDN}${NS}/${file}`
}
