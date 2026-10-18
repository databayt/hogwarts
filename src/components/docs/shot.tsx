// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getImage, type MediaLang } from "./media"
import { Picture } from "./media-view"

interface ShotProps {
  /** Key in media-manifest.json. */
  id: string
  lang?: MediaLang
  className?: string
}

/** A screenshot from media-manifest.json: `<Shot id="…" lang="en" />`. */
export function Shot({ id, lang = "ar", className }: ShotProps) {
  return (
    <div className="my-6">
      <Picture image={getImage(id)} lang={lang} className={className} />
    </div>
  )
}
