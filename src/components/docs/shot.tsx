// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import { getImage, type MediaLang } from "./media"

interface ShotProps {
  /** Key in media-manifest.json. */
  id: string
  lang?: MediaLang
  className?: string
}

// The docs column tops out near 896px on desktop and runs full width below.
const SIZES = "(min-width: 1024px) 896px, 100vw"

/** "<1600url> 1600w, <2400url> 2400w", narrowest first. */
function srcSet(byWidth: Record<string, string>) {
  return Object.entries(byWidth)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([width, url]) => `${url} ${width}w`)
    .join(", ")
}

/**
 * A screenshot from media-manifest.json: `<Shot id="…" lang="en" />`.
 *
 * Pre-encoded on the CDN, so it bypasses the image optimiser: AVIF where the
 * browser takes it, WebP otherwise, each at two widths for 1x and 2x screens.
 * The <img> fallback carries the real width/height so the frame is reserved
 * before the bytes arrive.
 */
export function Shot({ id, lang = "ar", className }: ShotProps) {
  const image = getImage(id)
  const fallback = image.webp["1600"] ?? Object.values(image.webp)[0]

  return (
    <picture className="my-6 block">
      <source type="image/avif" srcSet={srcSet(image.avif)} sizes={SIZES} />
      <source type="image/webp" srcSet={srcSet(image.webp)} sizes={SIZES} />
      <img
        src={fallback}
        width={image.width}
        height={image.height}
        alt={image.alt[lang]}
        loading="lazy"
        decoding="async"
        className={cn("h-auto w-full rounded-md", className)}
      />
    </picture>
  )
}
