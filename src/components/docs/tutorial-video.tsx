// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import { getVideo, type MediaLang } from "./media"
import { VideoPlayer } from "./media-view"

interface TutorialVideoProps {
  /** Key in media-manifest.json. */
  id: string
  lang?: MediaLang
  className?: string
}

/** A tutorial clip from media-manifest.json: `<TutorialVideo id="…" lang="en" />`. */
export function TutorialVideo({
  id,
  lang = "ar",
  className,
}: TutorialVideoProps) {
  return (
    <VideoPlayer
      video={getVideo(id)}
      lang={lang}
      className={cn("my-6", className)}
    />
  )
}
