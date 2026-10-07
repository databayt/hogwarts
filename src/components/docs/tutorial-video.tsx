// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import { getVideo, type MediaLang } from "./media"

interface TutorialVideoProps {
  /** Key in media-manifest.json. */
  id: string
  lang?: MediaLang
  className?: string
}

/**
 * A tutorial clip from media-manifest.json: `<TutorialVideo id="…" lang="en" />`.
 *
 * Sources stay in manifest order (AV1 first, H.264 second) and carry their
 * codecs, so each browser takes the first it can decode. `preload="metadata"`
 * fetches only the header until play; the poster stands in meanwhile, and the
 * width/height attributes reserve the frame so nothing shifts. `crossOrigin`
 * is required for the caption tracks: they come from the CDN, which answers
 * `Access-Control-Allow-Origin: *`.
 */
export function TutorialVideo({
  id,
  lang = "ar",
  className,
}: TutorialVideoProps) {
  const video = getVideo(id)
  // Captions in the page's language win; otherwise the manifest's default.
  const shown =
    video.tracks.find((t) => t.srclang === lang) ??
    video.tracks.find((t) => t.default)

  return (
    <video
      controls
      preload="metadata"
      playsInline
      crossOrigin="anonymous"
      poster={video.poster}
      width={video.width}
      height={video.height}
      aria-label={video.title[lang]}
      className={cn("my-6 h-auto w-full rounded-md bg-black", className)}
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
