// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useCallback, useSyncExternalStore } from "react"

/**
 * Reader preferences — theme, face, size, leading and the original-pages
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
} as const

export const SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75]
export const THEMES = ["original", "paper", "quiet", "night"] as const
export type Theme = (typeof THEMES)[number]
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
