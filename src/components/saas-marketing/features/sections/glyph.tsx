// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { createElement } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

import { getIconComponent } from "../icon-map"
import { artForTitle } from "./card-art"
import { iconNameForTitle } from "./card-icons"

interface Props {
  /** Card title; resolved to a real glyph, else a bare Lucide icon. */
  title: string
  /** Rendered px size (square). */
  size?: number
  className?: string
}

/**
 * The bare glyph used across detail-page cards — a real `public/feature/*.png`
 * when the title maps to one (inverted in dark mode, matching the landing
 * grid), otherwise a stroke Lucide icon. No tinted tile: the app renders these
 * glyphs bare, so we do too.
 */
export function Glyph({ title, size = 36, className }: Props) {
  const art = artForTitle(title)

  if (art) {
    return (
      <Image
        src={art}
        alt=""
        width={size}
        height={size}
        aria-hidden="true"
        className={cn("object-contain dark:invert", className)}
      />
    )
  }

  return createElement(getIconComponent(iconNameForTitle(title)), {
    width: size,
    height: size,
    strokeWidth: 1.5,
    "aria-hidden": "true",
    className: cn("text-foreground", className),
  })
}
