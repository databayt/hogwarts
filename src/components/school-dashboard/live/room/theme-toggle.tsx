"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback } from "react"
import { useTheme } from "next-themes"

import {
  circleLefthalfFilled,
  SfSymbol,
} from "@/components/lumos/shared/video-player/sf-symbols"

export type Appearance = "system" | "light" | "dark"

/**
 * The app's own theme model (next-themes: `system` · `light` · `dark`, the
 * `.dark` class on <html>), so a choice made in the room is the choice the
 * dashboard opens with, and the reverse.
 */
export function useAppearance() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const appearance: Appearance =
    theme === "light" || theme === "dark" ? theme : "system"
  const toggle = useCallback(
    () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setTheme]
  )
  return { appearance, setAppearance: setTheme, toggle }
}

/**
 * One tap flips light ↔ dark — the header's ModeSwitcher, drawn as the room's
 * SF glyph so it sits in the pre-join card's top bar beside Share.
 */
export function ThemeToggleButton({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const { toggle } = useAppearance()
  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      title={label}
      aria-label={label}
    >
      <SfSymbol glyph={circleLefthalfFilled} pt={19} />
    </button>
  )
}
