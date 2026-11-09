// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createElement } from "react"

import { cn } from "@/lib/utils"
import { BlurImage } from "@/components/atom/blur-image"

import { getCategoryIcon } from "./feature-icons"
import { COLOR_ICONS, FEATURE_IMAGES, SMALLER_ICONS } from "./feature-images"
import type { Feature } from "./types"

/**
 * A feature's card icon — its own image when it has one, else its category
 * icon. Shared by the /features grid and the related-features row on
 * /features/<id>, so the same module always wears the same mark.
 */
export function FeatureIcon({
  feature,
  alt,
}: {
  feature: Pick<Feature, "id" | "category">
  alt: string
}) {
  const src = FEATURE_IMAGES[feature.id]
  // createElement, not <Icon />: the category icon is looked up, not declared
  // in render (react-hooks/static-components) — same as the showcase deck
  if (!src) return createElement(getCategoryIcon(feature.category))
  const dim = SMALLER_ICONS.has(feature.id) ? 28 : 32
  return (
    <BlurImage
      src={src}
      alt={alt}
      width={dim}
      height={dim}
      plain
      className={cn(
        !COLOR_ICONS.has(feature.id) &&
          "dark:brightness-90 dark:contrast-125 dark:invert"
      )}
    />
  )
}
