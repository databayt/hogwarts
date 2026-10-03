"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { mintDraftId, startDraft, type DraftResult } from "./draft-store"

interface DraftLauncherOptions<T> {
  /** Locale-prefixed URL of the wizard's first step for a draft id */
  firstStepHref: (id: string) => string
  /** The create action, given the browser-minted id */
  create: (id: string) => Promise<DraftResult>
  /** The empty row the wizard opens on before the INSERT lands */
  seed: (id: string) => T
  /** Skip the warm-up prefetch (e.g. the viewer cannot add) */
  disabled?: boolean
}

/** Delay the warm-up so it never competes with the list's own first paint. */
const PRIME_DELAY_MS = 1500

/**
 * The listing "+" button, made instant: the id is minted in the browser, the
 * wizard route for it is prefetched ahead of the click, and the click opens
 * the wizard at once while the draft INSERT runs behind it (see
 * `draft-store.ts`).
 */
export function useDraftLauncher<T>({
  firstStepHref,
  create,
  seed,
  disabled = false,
}: DraftLauncherOptions<T>): { launch: () => void } {
  const router = useRouter()
  const nextIdRef = useRef<string | null>(null)
  const optionsRef = useRef({ firstStepHref, create, seed })
  optionsRef.current = { firstStepHref, create, seed }

  const prime = useCallback(() => {
    nextIdRef.current ??= mintDraftId()
    router.prefetch(optionsRef.current.firstStepHref(nextIdRef.current))
  }, [router])

  useEffect(() => {
    if (disabled) return
    const timer = setTimeout(prime, PRIME_DELAY_MS)
    return () => clearTimeout(timer)
  }, [disabled, prime])

  const launch = useCallback(() => {
    const {
      firstStepHref: href,
      create: createDraft,
      seed: makeSeed,
    } = optionsRef.current
    const id = nextIdRef.current ?? mintDraftId()
    nextIdRef.current = null
    startDraft(id, () => createDraft(id), makeSeed(id))
    router.push(href(id))
  }, [router])

  return { launch }
}
