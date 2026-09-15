"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"

import { useOnlineStatus, useOutbox } from "@/lib/offline/hooks"
import { installOutboxTriggers } from "@/lib/offline/outbox"

import type { OfflineLabels } from "./outbox-view"

// The last page the service worker served from a saved copy, and why —
// "failed" (no network) or "slow" (no answer within its limit) — as an
// external store: the worker's message arrives outside React, and the strip
// must not set state inside an effect. The worker is the one source of
// "offline" beyond `navigator.onLine`: a dead server or a captive portal
// leaves onLine true, but its fetch fails all the same.
type Served = { url: string; reason: "failed" | "slow" }

const staleStore = {
  served: null as Served | null,
  listeners: new Set<() => void>(),
}

function setServed(served: Served | null) {
  staleStore.served = served
  staleStore.listeners.forEach((l) => l())
}

function subscribeStale(listener: () => void) {
  staleStore.listeners.add(listener)
  return () => {
    staleStore.listeners.delete(listener)
  }
}

const readStale = () => staleStore.served
const readStaleServer = () => null

if (typeof navigator !== "undefined" && navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type !== "sw-stale") return
    setServed(
      e.data.stale
        ? {
            url: String(e.data.url),
            reason: e.data.reason === "slow" ? "slow" : "failed",
          }
        : null
    )
  })
}

function samePage(url: string | null, pathname: string | null): boolean {
  if (!url || !pathname || typeof window === "undefined") return false
  try {
    return new URL(url, window.location.origin).pathname === pathname
  } catch {
    return false
  }
}

/**
 * Mounted once in the school dashboard layout: installs the outbox's drain
 * triggers and keeps offline work silent.
 *
 * Offline, slow and back-online say nothing (#416 reverses #414): pages keep
 * working from their saved copies, work waits in the outbox and drains on its
 * own, and a page shown from a saved copy refreshes itself once the network
 * returns. The one strip left is work the server REFUSED — that needs a
 * person, so it links to /offline.
 */
export function OfflineSyncBanner({ labels }: { labels?: OfflineLabels }) {
  const { parked } = useOutbox()
  const online = useOnlineStatus()
  const pathname = usePathname()
  const router = useRouter()
  const served = useSyncExternalStore(
    subscribeStale,
    readStale,
    readStaleServer
  )
  const servedHere = served !== null && samePage(served.url, pathname)

  const t = (
    k: string,
    fallback: string,
    vars?: Record<string, string | number>
  ) => {
    let s = labels?.[k] ?? fallback
    for (const [name, v] of Object.entries(vars ?? {})) {
      s = s.replace(`{${name}}`, String(v))
    }
    return s
  }

  useEffect(() => installOutboxTriggers(), [])

  // A saved copy on screen is swapped for the live page, without a word, when
  // the connection comes BACK — only on that edge: refreshing whenever a copy
  // is on screen would re-ask every four seconds on a slow link, which the
  // worker answers with the copy again.
  const wasOnline = useRef(online)
  useEffect(() => {
    const cameBack = online && !wasOnline.current
    wasOnline.current = online
    if (!cameBack || !servedHere) return
    setServed(null)
    router.refresh()
  }, [online, servedHere, router])

  // A full load served from a saved copy has no client to message while the
  // worker chooses the response; ask once the page is here.
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage({
      type: "stale-check",
      url: window.location.href,
    })
  }, [pathname])

  if (parked === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <Link
        href="/offline"
        className="font-medium underline underline-offset-2"
      >
        {t("attention", "{count} items need attention", { count: parked })}
      </Link>
    </div>
  )
}
