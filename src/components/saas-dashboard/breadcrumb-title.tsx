"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useLayoutEffect, useSyncExternalStore } from "react"

/**
 * Titles a page hands to the breadcrumb, so a URL segment renders as the thing
 * it names instead of as its raw slug or id.
 *
 * `title` names the LAST segment (the page you are on). `segments` names any
 * earlier one, keyed by the segment's literal URL text — a lesson page uses it
 * to render its course slug (`sd-g10-literature`) as the subject's own name.
 */
type BreadcrumbTitles = {
  title: string | null
  segments: Record<string, string>
}

const EMPTY: BreadcrumbTitles = { title: null, segments: {} }

let current: BreadcrumbTitles = EMPTY
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function useBreadcrumbTitle(): BreadcrumbTitles {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
    () => EMPTY
  )
}

export function BreadcrumbTitle({
  title,
  segments,
}: {
  title?: string
  segments?: Record<string, string>
}) {
  // Serialized so a fresh object literal on every render doesn't re-fire the
  // effect (and with it a store write + re-render on every parent render).
  const segmentsKey = segments ? JSON.stringify(segments) : ""
  useLayoutEffect(() => {
    current = {
      title: title ?? null,
      segments: segmentsKey
        ? (JSON.parse(segmentsKey) as Record<string, string>)
        : {},
    }
    emit()
    return () => {
      current = EMPTY
      emit()
    }
  }, [title, segmentsKey])
  return null
}
