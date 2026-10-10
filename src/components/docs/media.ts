// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Typed access to media-manifest.json: the CDN-hosted videos and screenshots
 * the docs and marketing pages render. Media tooling writes entries in exactly
 * this shape; every URL is content-hashed and served immutable, so a re-encode
 * is a new URL rather than an invalidation.
 *
 * Import this from server components only. A client component that imports it
 * ships the whole manifest in its bundle, so pass it the one entry it needs as
 * a prop instead (see saas-marketing/story-section.tsx).
 */
import manifest from "./media-manifest.json"

export type MediaLang = "ar" | "en"

export interface VideoSource {
  src: string
  /** Full MIME type with codecs, so a browser skips what it cannot decode. */
  type: string
}

export interface CaptionTrack {
  src: string
  srclang: string
  label: string
  default?: boolean
}

export interface VideoMedia {
  kind: "video"
  title: Record<MediaLang, string>
  /** Absent on a 9:16 reel — the 16:9 poster would not fit it. */
  poster?: string
  width: number
  height: number
  duration: number
  /** Best first: AV1, then the H.264 every browser can play. */
  sources: VideoSource[]
  tracks: CaptionTrack[]
}

export interface ImageMedia {
  kind: "image"
  width: number
  height: number
  alt: Record<MediaLang, string>
  /** The still's NN in its flow (01-list → 1) — the docs list steps by it. */
  order?: number
  /** Keyed by pixel width, e.g. { "1600": url, "2400": url } — a phone
   * still ships at its native width (e.g. { "1179": url }). */
  avif: Record<string, string>
  webp: Record<string, string>
}

const media = manifest as Record<string, VideoMedia | ImageMedia>

// An unknown id fails loudly: docs are prerendered, so a typo stops the build
// instead of shipping an empty player (the same stance as fumadocs remarkImage).
export function getVideo(id: string): VideoMedia {
  const entry = media[id]
  if (entry?.kind !== "video") {
    throw new Error(`media-manifest.json has no video "${id}"`)
  }
  return entry
}

export function getImage(id: string): ImageMedia {
  const entry = media[id]
  if (entry?.kind !== "image") {
    throw new Error(`media-manifest.json has no image "${id}"`)
  }
  return entry
}

/**
 * Still ids for one flow + language, in shot order (`order`, else manifest order). Only
 * flat `<flow>/<step>-<lang>` ids: device stills (`<flow>/iphone-16/…`) and
 * the video/reel/clip entries are excluded. Never throws — an unpublished
 * flow simply has no stills.
 */
export function flowStills(
  flow: string,
  lang: MediaLang,
  entries: Record<string, VideoMedia | ImageMedia> = media
): string[] {
  const prefix = `${flow}/`
  const suffix = `-${lang}`
  const order = (id: string) => {
    const e = entries[id]
    return e?.kind === "image" ? (e.order ?? Infinity) : Infinity
  }
  return (
    Object.keys(entries)
      .filter((id) => {
        if (!id.startsWith(prefix) || !id.endsWith(suffix)) return false
        const step = id.slice(prefix.length, -suffix.length)
        return !step.includes("/") && entries[id]?.kind === "image"
      })
      // stable: stills without an order keep their manifest order
      .sort((a, b) => (order(a) === order(b) ? 0 : order(a) - order(b)))
  )
}
