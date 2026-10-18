// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The markup behind <TutorialVideo> and <Shot>, taking the manifest entry
 * itself instead of its id — so a client component (the chatbot's resource
 * cards) renders the same player and picture without importing the manifest.
 * Only types come from ./media, and they are erased at build time.
 */
import { cn } from "@/lib/utils"

import type { ImageMedia, MediaLang, VideoMedia } from "./media"

interface VideoPlayerProps {
  video: VideoMedia
  lang?: MediaLang
  autoPlay?: boolean
  className?: string
}

/**
 * Sources stay in manifest order (AV1 first, H.264 second) and carry their
 * codecs, so each browser takes the first it can decode. `preload="metadata"`
 * fetches only the header until play; the poster stands in meanwhile, and the
 * width/height attributes reserve the frame so nothing shifts. `crossOrigin`
 * is required for the caption tracks: they come from the CDN, which answers
 * `Access-Control-Allow-Origin: *`.
 */
export function VideoPlayer({
  video,
  lang = "ar",
  autoPlay,
  className,
}: VideoPlayerProps) {
  // Captions in the page's language win; otherwise the manifest's default.
  const shown =
    video.tracks.find((t) => t.srclang === lang) ??
    video.tracks.find((t) => t.default)

  return (
    <video
      controls
      autoPlay={autoPlay}
      preload="metadata"
      playsInline
      crossOrigin="anonymous"
      poster={video.poster}
      width={video.width}
      height={video.height}
      aria-label={video.title[lang]}
      className={cn("h-auto w-full rounded-md bg-black", className)}
    >
      {video.sources.map((source) => (
        <source key={source.src} src={source.src} type={source.type} />
      ))}
      {video.tracks.map((track) => (
        <track
          key={track.src}
          kind="captions"
          src={track.src}
          srcLang={track.srclang}
          label={track.label}
          default={track === shown}
        />
      ))}
    </video>
  )
}

/** "<1600url> 1600w, <2400url> 2400w", narrowest first. */
function srcSet(byWidth: Record<string, string>) {
  return Object.entries(byWidth)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([width, url]) => `${url} ${width}w`)
    .join(", ")
}

interface PictureProps {
  image: ImageMedia
  lang?: MediaLang
  /** Rendered width hint for the srcset — the docs column by default. */
  sizes?: string
  className?: string
}

/**
 * Pre-encoded on the CDN, so it bypasses the image optimiser: AVIF where the
 * browser takes it, WebP otherwise, each at two widths for 1x and 2x screens.
 * The <img> fallback carries the real width/height so the frame is reserved
 * before the bytes arrive.
 */
export function Picture({
  image,
  lang = "ar",
  sizes = "(min-width: 1024px) 896px, 100vw",
  className,
}: PictureProps) {
  const fallback = image.webp["1600"] ?? Object.values(image.webp)[0]

  return (
    <picture className="block">
      <source type="image/avif" srcSet={srcSet(image.avif)} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(image.webp)} sizes={sizes} />
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
