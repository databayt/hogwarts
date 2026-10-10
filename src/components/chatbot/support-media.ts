// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Turns a support topic into the cards shown under the chatbot's answer: the
 * guide page, the flow's tutorial video and a few of its screenshots.
 *
 * Media comes from media-manifest.json by flow prefix (`add-student/…`), so a
 * flow appears in the chat the moment /shoot publishes it — no code change.
 * Unlike `getVideo`/`getImage` (docs/media.ts) nothing here throws: a flow
 * that isn't published yet simply contributes no media cards.
 *
 * Server-only: importing the manifest client-side would ship all of it.
 */
import {
  flowStills,
  type ImageMedia,
  type MediaLang,
  type VideoMedia,
} from "@/components/docs/media"
import manifest from "@/components/docs/media-manifest.json"

import type { SupportTopic } from "./support"
import type { ChatResource } from "./type"

type Manifest = Record<string, VideoMedia | ImageMedia>

// Steps that only make sense inside the full walkthrough — the landing list
// and the macOS file picker — are never picked as one of the few chat stills.
const SKIP_STEP = /^(list|bulk|finder)(-|$)/

/** Three evenly spaced stills — the first real step, the middle, the result. */
function pickStills(ids: string[], flow: string, lang: MediaLang): string[] {
  const steps = ids.filter(
    (id) => !SKIP_STEP.test(id.slice(flow.length + 1, -(lang.length + 1)))
  )
  if (steps.length <= 3) return steps
  const last = steps.length - 1
  return [0, Math.round(last / 2), last].map((i) => steps[i]!)
}

/** Language with media first, Arabic as the fallback (every flow is shot in ar). */
function langsFor(locale: string): MediaLang[] {
  return locale === "en" ? ["en", "ar"] : ["ar"]
}

export function resourcesFor(
  topic: SupportTopic,
  locale: string,
  labels: { video: string; guide: string },
  media: Manifest = manifest as Manifest
): ChatResource[] {
  const lang: MediaLang = locale === "en" ? "en" : "ar"
  const guideHref = `/${locale}${topic.guide}`
  const out: ChatResource[] = []

  if (topic.flow) {
    for (const l of langsFor(locale)) {
      const video = media[`${topic.flow}/video-${l}`]
      if (video?.kind === "video") {
        out.push({
          kind: "video",
          title: video.title[lang] || labels.video,
          href: `${guideHref}#video`,
          thumb: video.poster,
          duration: video.duration,
        })
        break
      }
    }

    for (const l of langsFor(locale)) {
      const ids = pickStills(flowStills(topic.flow, l, media), topic.flow, l)
      if (!ids.length) continue
      for (const id of ids) {
        const image = media[id] as ImageMedia
        const full = image.webp["2400"] ?? image.webp["1600"]
        const thumb = image.webp["1600"] ?? full
        if (!full || !thumb) continue
        out.push({ kind: "image", title: image.alt[lang], href: full, thumb })
      }
      break
    }
  }

  out.push({ kind: "guide", title: topic.title[lang], href: guideHref })
  return out
}
