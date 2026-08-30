"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"

import {
  drainOutbox,
  subscribeOutbox,
  type DrainSummary,
  type OutboxCounts,
} from "./outbox"

/** `navigator.onLine`, kept current. Starts optimistic on the server. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    setOnline(navigator.onLine)
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])
  return online
}

/** Live outbox counts plus a manual drain. */
export function useOutbox(): OutboxCounts & {
  drain: () => Promise<DrainSummary>
  draining: boolean
} {
  const [counts, setCounts] = useState<OutboxCounts>({ pending: 0, parked: 0 })
  const [draining, setDraining] = useState(false)

  useEffect(() => subscribeOutbox(setCounts), [])

  const drain = useCallback(async () => {
    setDraining(true)
    try {
      return await drainOutbox()
    } finally {
      setDraining(false)
    }
  }, [])

  return { ...counts, drain, draining }
}
