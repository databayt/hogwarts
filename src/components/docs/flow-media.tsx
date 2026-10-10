// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ImageMedia, MediaLang, VideoMedia } from "./media"
import manifest from "./media-manifest.json"
import { Shot } from "./shot"
import { TutorialVideo } from "./tutorial-video"

interface FlowMediaProps {
  /** Flow slug — the manifest prefix, e.g. "add-student". */
  flow: string
  lang?: MediaLang
  /** Render only the tutorial video or only the stills — a guide puts the
   * video above its steps and the screenshots below them. */
  only?: "video" | "stills"
  /** Heading over the stills — rendered only when the flow has some, so an
   * unpublished flow leaves no empty section behind. */
  title?: string
}

const media = manifest as Record<string, VideoMedia | ImageMedia>

/**
 * Everything /shoot and /record published for one flow: `<FlowMedia flow="add-student" />`.
 *
 * The tutorial video first, then every still in shot order. Media in the
 * page's language wins; Arabic (every flow is shot in ar) fills in otherwise.
 * A support guide is written before its flow is published, so an unpublished
 * flow renders nothing rather than failing the build the way `<Shot id>` does
 * — the media appears on the next build after the manifest lands.
 */
export function FlowMedia({ flow, lang = "ar", only, title }: FlowMediaProps) {
  const langs: MediaLang[] = lang === "en" ? ["en", "ar"] : ["ar"]
  const prefix = `${flow}/`

  const videoLang =
    only === "stills"
      ? undefined
      : langs.find((l) => media[`${prefix}video-${l}`]?.kind === "video")
  const stillLang =
    only === "video"
      ? undefined
      : langs.find((l) =>
          Object.keys(media).some((id) => isStill(id, prefix, l))
        )
  const stills = stillLang
    ? Object.keys(media).filter((id) => isStill(id, prefix, stillLang))
    : []

  if (!videoLang && !stills.length) return null

  return (
    <div>
      {title && stills.length > 0 && (
        // Matches the docs h2 (mdx-components) so it reads as a section.
        <h2
          id="screenshots"
          className="font-heading mt-10 scroll-m-28 text-xl font-medium tracking-tight lg:mt-12"
        >
          {title}
        </h2>
      )}
      {videoLang && (
        <div id="video" className="scroll-mt-24">
          <TutorialVideo id={`${prefix}video-${videoLang}`} lang={lang} />
        </div>
      )}
      {stills.map((id) => (
        <Shot key={id} id={id} lang={lang} />
      ))}
    </div>
  )
}

/** A flat `<flow>/<step>-<lang>` still (not a device still, video or reel). */
function isStill(id: string, prefix: string, lang: MediaLang) {
  if (!id.startsWith(prefix) || !id.endsWith(`-${lang}`)) return false
  const step = id.slice(prefix.length, -(lang.length + 1))
  return !step.includes("/") && media[id]?.kind === "image"
}
