"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react"
import { toast } from "sonner"

import { useOnlineStatus, useOutbox } from "@/lib/offline/hooks"
import { installOutboxTriggers } from "@/lib/offline/outbox"
import { Button } from "@/components/ui/button"

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

// The Network Information API's own verdict of a weak link (Chrome/Android;
// Safari has no `navigator.connection`, so there the worker's "slow" serve is
// the only signal).
type NetworkInformation = EventTarget & { effectiveType?: string }

function readConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection
}

function subscribeWeak(listener: () => void) {
  const connection = readConnection()
  connection?.addEventListener("change", listener)
  return () => connection?.removeEventListener("change", listener)
}

const readWeak = () => {
  const type = readConnection()?.effectiveType
  return type === "slow-2g" || type === "2g"
}
const readWeakServer = () => false

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
 * triggers and shows the strips a student needs.
 *
 * Losing the connection says something now — but only because pages keep
 * working: the strip says that the screens they have opened are still here
 * and that anything they do is kept for later. A page shown from its saved
 * copy while ONLINE (the network was too slow to answer) says so too, with
 * a way to ask again — a teacher must never take a saved attendance page for
 * a live one. Work still waiting to reach the server keeps its own strip.
 */
export function OfflineSyncBanner({ labels }: { labels?: OfflineLabels }) {
  const { pending, parked, drain, draining } = useOutbox()
  const online = useOnlineStatus()
  const pathname = usePathname()
  const router = useRouter()
  const served = useSyncExternalStore(
    subscribeStale,
    readStale,
    readStaleServer
  )
  const servedHere = served !== null && samePage(served.url, pathname)
  const offline = !online || (servedHere && served.reason === "failed")
  const stale = !offline && servedHere
  const weak = useSyncExternalStore(subscribeWeak, readWeak, readWeakServer)
  const connection = offline ? "offline" : stale || weak ? "slow" : "online"

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

  // The strip sits at the top of the page, so a connection that drops while
  // the student is scrolled down said nothing (#414). A toast follows them:
  // it stays up while offline and is replaced — same id — by "slow" or
  // "back online". A page that simply loads online stays quiet.
  const lastConnection = useRef<typeof connection>("online")
  useEffect(() => {
    const previous = lastConnection.current
    lastConnection.current = connection
    if (connection === previous) return
    if (connection === "offline") {
      toast.warning(t("offlineNow", "You're offline"), {
        id: "connection",
        description: t(
          "offlineToastHint",
          "Pages you've opened still work. Anything you do is saved and synced later."
        ),
        duration: Infinity,
      })
    } else if (connection === "slow") {
      toast.warning(t("slowConnection", "Your connection is slow"), {
        id: "connection",
        description: undefined,
        duration: 5000,
      })
    } else if (previous === "offline") {
      toast.success(t("backOnline", "You're back online"), {
        id: "connection",
        description: undefined,
        duration: 3000,
      })
    } else {
      toast.dismiss("connection")
    }
    // `t` reads labels that never change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection])

  // A full load served from a saved copy has no client to message while the
  // worker chooses the response; ask once the page is here.
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage({
      type: "stale-check",
      url: window.location.href,
    })
  }, [pathname])

  const showConnection = offline || stale
  const showWork = pending > 0 || parked > 0
  if (!showConnection && !showWork) return null

  return (
    <>
      {showConnection && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sky-300 bg-sky-50 px-4 py-2 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {offline
              ? t(
                  "offlineBrowsing",
                  "You're offline. Pages you've opened before still work, and anything you do is saved and synced later."
                )
              : t(
                  "staleCopy",
                  "Slow connection — showing the last saved copy of this page."
                )}
          </span>
          {servedHere && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ms-auto h-7"
              onClick={() => {
                setServed(null)
                router.refresh()
              }}
            >
              {t("retry", "Retry")}
            </Button>
          )}
        </div>
      )}
      {showWork && (
        <div
          role="status"
          aria-live="polite"
          className={
            "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm " +
            (parked > 0
              ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              : "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100")
          }
        >
          {parked > 0 ? (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {pending > 0 && (
            <span>
              {t("pendingSync", "{count} items waiting to sync", {
                count: pending,
              })}
            </span>
          )}
          {parked > 0 && (
            <Link
              href="/offline"
              className="font-medium underline underline-offset-2"
            >
              {t("attention", "{count} items need attention", {
                count: parked,
              })}
            </Link>
          )}
          {pending > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ms-auto h-7"
              disabled={draining}
              onClick={() => void drain()}
            >
              {draining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              {draining ? t("syncing", "Syncing…") : t("syncNow", "Sync now")}
            </Button>
          )}
        </div>
      )}
    </>
  )
}
