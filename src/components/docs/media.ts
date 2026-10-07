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
  poster: string
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
  /** Keyed by pixel width, e.g. { "1600": url, "2400": url }. */
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
