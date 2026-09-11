// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useSyncExternalStore } from "react"

/**
 * Reader preferences — theme, mode, face, size, leading, brightness and the
 * original-pages
 * view — live in localStorage (best effort, never required) and hydrate
 * through useSyncExternalStore so the server snapshot is always the default
 * and no setState ever runs inside an effect.
 */
export const PREF = {
  theme: "hogwarts:textbook:theme",
  font: "hogwarts:textbook:font",
  scale: "hogwarts:textbook:scale",
  leading: "hogwarts:textbook:leading",
  facsimile: "hogwarts:textbook:facsimile",
  mode: "hogwarts:textbook:mode",
  brightness: "hogwarts:textbook:brightness",
  rotation: "hogwarts:textbook:rotation",
  guide: "hogwarts:textbook:guide",
} as const

export const SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75]
/** The six reading palettes, in the order the reference lays its cards out. */
export const THEMES = [
  "original",
  "quiet",
  "paper",
  "bold",
  "calm",
  "focus",
] as const
export type Theme = (typeof THEMES)[number]
/** Light or dark is chosen apart from the palette, as the reference does. */
export const MODES = ["light", "dark"] as const
export type Mode = (typeof MODES)[number]
/**
 * Screen brightness, as a percentage. The floor is well clear of zero: the
 * slider dims the page, it never turns it off.
 */
export const BRIGHTNESS_MIN = 30
export const BRIGHTNESS_MAX = 100
export const FONTS = ["serif", "sans"] as const
export type Font = (typeof FONTS)[number]
export const LEADINGS = ["tight", "normal", "loose"] as const
export type Leading = (typeof LEADINGS)[number]

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode / blocked storage — the setting just does not persist */
  }
}

const PREF_EVENT = "hogwarts:textbook:pref"

function subscribePrefs(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(PREF_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(PREF_EVENT, callback)
  }
}

export function usePreference(
  key: string,
  fallback: string
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribePrefs,
    () => readStorage(key) ?? fallback,
    () => fallback
  )
  const set = useCallback(
    (next: string) => {
      writeStorage(key, next)
      window.dispatchEvent(new Event(PREF_EVENT))
    },
    [key]
  )
  return [value, set]
}

export function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T
): T {
  return (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}
