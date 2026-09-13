"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/**
 * Asks the service worker to save the role's sidebar pages for offline use.
 *
 * The worker keeps the pages a user OPENS; this is what makes the ones they
 * have not opened yet explorable without a connection — the whole menu, not
 * only the last screen. It runs once a day per signed-in user (the worker
 * stamps it), only from the installed app (the one that will be opened at a
 * bus stop), only on a 4G-class connection with data saver off, and only
 * after the page has gone idle, so it never competes with the screen in
 * front of the user. Everything else — what to fetch, the gap between pages,
 * the assets each page needs — is the worker's.
 */
export function OfflineWarmup({ urls }: { urls: string[] }) {
  const list = urls.join("|")

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    if (!navigator.onLine) return

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (!standalone) return

    const connection = (
      navigator as unknown as {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    if (connection?.saveData) return
    if (connection?.effectiveType && connection.effectiveType !== "4g") return

    const win = window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number
      cancelIdleCallback?: (id: number) => void
    }
    let cancelled = false
    const send = () => {
      if (cancelled) return
      void navigator.serviceWorker.ready.then((registration) => {
        if (cancelled) return
        const worker = registration.active ?? navigator.serviceWorker.controller
        worker?.postMessage({ type: "warm-pages", urls: list.split("|") })
      })
    }
    const handle = win.requestIdleCallback
      ? win.requestIdleCallback(send, { timeout: 15_000 })
      : window.setTimeout(send, 10_000)

    return () => {
      cancelled = true
      if (win.requestIdleCallback && win.cancelIdleCallback) {
        win.cancelIdleCallback(handle)
      } else {
        window.clearTimeout(handle)
      }
    }
  }, [list])

  return null
}
