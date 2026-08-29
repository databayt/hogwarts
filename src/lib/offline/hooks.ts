"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"

import { hasIndexedDb, type DownloadedLesson } from "./db"
import {
  DownloadError,
  downloadLesson,
  getDownloadedLesson,
  getStoredAsset,
  removeDownloadedLesson,
  videoAssetKey,
  type DownloadFailure,
  type DownloadProgress,
} from "./download-manager"
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

export type LessonDownloadState =
  | { status: "unsupported" }
  | { status: "none" }
  | { status: "downloading"; progress: DownloadProgress }
  | { status: "partial"; bytes: number }
  | { status: "complete"; bytes: number; savedAt: string }
  | { status: "failed"; reason: DownloadFailure }

/**
 * The download button's brain: what is on disk for this lesson, and the
 * verbs to change it. Re-reads IndexedDB on mount and after every verb.
 */
export function useLessonDownload(lessonId: string): {
  state: LessonDownloadState
  start: () => Promise<void>
  cancel: () => void
  remove: () => Promise<void>
} {
  const [state, setState] = useState<LessonDownloadState>({ status: "none" })
  const abortRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    if (!hasIndexedDb()) {
      setState({ status: "unsupported" })
      return
    }
    const row: DownloadedLesson | undefined =
      await getDownloadedLesson(lessonId)
    if (!row) setState({ status: "none" })
    else if (row.status === "complete")
      setState({ status: "complete", bytes: row.bytes, savedAt: row.savedAt })
    else if (row.status === "failed")
      setState({
        status: "failed",
        reason: (row.error as DownloadFailure) ?? "network",
      })
    else setState({ status: "partial", bytes: row.bytes })
  }, [lessonId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const start = useCallback(async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setState({
      status: "downloading",
      progress: {
        lessonId,
        phase: "manifest",
        receivedBytes: 0,
        totalBytes: null,
      },
    })
    try {
      await downloadLesson(lessonId, {
        signal: controller.signal,
        onProgress: (progress) => setState({ status: "downloading", progress }),
      })
    } catch (err) {
      if (err instanceof DownloadError && err.reason !== "cancelled") {
        setState({ status: "failed", reason: err.reason })
        return
      }
    } finally {
      abortRef.current = null
    }
    await refresh()
  }, [lessonId, refresh])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const remove = useCallback(async () => {
    abortRef.current?.abort()
    await removeDownloadedLesson(lessonId)
    await refresh()
  }, [lessonId, refresh])

  return { state, start, cancel, remove }
}

/**
 * An object URL for the lesson's downloaded video, or null when there is
 * none. Revoked on unmount — object URLs pin their Blob in memory.
 */
export function useOfflineVideoUrl(
  lessonId: string,
  enabled = true
): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled || !hasIndexedDb()) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    void getStoredAsset(videoAssetKey(lessonId)).then((asset) => {
      if (cancelled || !asset?.complete || !asset.blob) return
      objectUrl = URL.createObjectURL(asset.blob)
      setUrl(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [lessonId, enabled])
  return url
}

/** Human-readable bytes, locale-aware digits. */
export function formatBytes(
  bytes: number | null | undefined,
  locale = "en"
): string {
  if (bytes === null || bytes === undefined) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: i >= 2 ? 1 : 0 }).format(v)} ${units[i]}`
}
