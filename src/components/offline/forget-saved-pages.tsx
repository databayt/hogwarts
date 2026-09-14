"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

/**
 * Tells the service worker to drop every page it saved for the signed-in
 * person, and waits (briefly) until it has.
 *
 * The worker also drops them when a response arrives carrying another
 * session key, or none — but on a slow network it shows a saved copy after
 * four seconds, BEFORE any response has arrived. Signing out and then
 * signing in as someone else on a shared school device would open the next
 * person's first screen from the previous person's pages. So the moments a
 * session ends or begins say so themselves: the sign-out button before it
 * signs out, and the sign-in and join pages when they open.
 *
 * Never throws and never blocks longer than `timeoutMs`: a missing or broken
 * worker must not stand between a person and signing out.
 */
export async function forgetSavedPages(timeoutMs = 1000): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return
    }
    const worker =
      navigator.serviceWorker.controller ??
      (await navigator.serviceWorker.getRegistration())?.active
    if (!worker) return

    await new Promise<void>((resolve) => {
      const channel = new MessageChannel()
      const timer = window.setTimeout(resolve, timeoutMs)
      channel.port1.onmessage = () => {
        window.clearTimeout(timer)
        resolve()
      }
      worker.postMessage({ type: "session-end" }, [channel.port2])
    })
  } catch {
    // Nothing to forget, or no way to ask — either way, carry on.
  }
}

/** Mounted on the sign-in and join pages: whoever is here is about to become someone. */
export function ForgetSavedPages() {
  useEffect(() => {
    void forgetSavedPages()
  }, [])
  return null
}
