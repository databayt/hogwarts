// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  findVideo,
  getVideo,
  type MediaLang,
  type VideoMedia,
} from "@/components/docs/media"

/**
 * The looping 16:9 clip beside a feature page's heading. Server-only (it
 * reads the media manifest); pass the entry to the client player as a prop.
 *
 * One predictable name per feature and language, published by kun's shoot
 * lane (`hero.mjs --feature <id>`):
 *   manifest id  feature-<id>/video-<lang>
 *   CDN key      hogwarts/<lang>/features/<id>/video.mp4  (+ .av1.mp4, .poster.webp)
 * A feature without its own clip yet plays the brand story.
 */
export function featureVideo(id: string, lang: MediaLang): VideoMedia {
  return findVideo(`feature-${id}/video-${lang}`) ?? getVideo("story")
}
