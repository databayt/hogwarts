"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { usePathname } from "next/navigation"

type Idle = {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/** A connection worth spending data on: not data saver, 4G-class or unknown. */
function goodConnection(): boolean {
  if (!navigator.onLine) return false
  const connection = (
    navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection
  if (connection?.saveData) return false
  return !connection?.effectiveType || connection.effectiveType === "4g"
}

function whenIdle(fn: () => void, timeout: number): () => void {
  const win = window as unknown as Idle
  if (win.requestIdleCallback && win.cancelIdleCallback) {
    const id = win.requestIdleCallback(fn, { timeout })
    return () => win.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(fn, Math.min(timeout, 3000))
  return () => window.clearTimeout(id)
}

function post(message: Record<string, unknown>) {
  void navigator.serviceWorker.ready.then((registration) => {
    const worker = registration.active ?? navigator.serviceWorker.controller
    worker?.postMessage(message)
  })
}

/**
 * Keeps dashboard pages on the device, as HTML, for when the connection goes.
 *
 * Two asks of the service worker, both only on a connection worth spending
 * data on (4G-class or unknown, data saver off) and only once the page has
 * gone idle, so neither competes with the screen in front of the user:
 *
 * - The role's whole sidebar, once a day per signed-in user, from the
 *   installed app only — the one that gets opened at a bus stop.
 * - The page just opened, in the app or the browser. A client-side navigation
 *   leaves no HTML behind, and a saved RSC payload only answers the exact
 *   navigation it came from; a saved HTML copy is the fallback that works
 *   from any page. The worker skips pages saved within the day and fetches
 *   one at a time.
 *
 * What to fetch, the gap between pages and the assets each page needs are
 * the worker's business.
 */
export function OfflineWarmup({ urls }: { urls: string[] }) {
  const list = urls.join("|")
  const pathname = usePathname()

  // The whole sidebar, once a day, from the installed app only.
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (!standalone || !goodConnection()) return
    return whenIdle(
      () => post({ type: "warm-pages", urls: list.split("|") }),
      15_000
    )
  }, [list])

  // The page just opened, in the app or the browser: a client-side navigation
  // saves no HTML, and a saved HTML copy is the offline fallback that works
  // from any page. Path only — a query variant falls back to the same copy.
  // The worker skips pages saved within the day.
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (!navigator.serviceWorker.controller || !goodConnection()) return
    const url = window.location.origin + window.location.pathname
    let cancelIdle: (() => void) | undefined
    const timer = window.setTimeout(() => {
      cancelIdle = whenIdle(() => post({ type: "save-page", url }), 10_000)
    }, 3000)
    return () => {
      window.clearTimeout(timer)
      cancelIdle?.()
    }
  }, [pathname])

  return null
}
