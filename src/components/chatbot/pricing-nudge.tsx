"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import {
  PRICING_NUDGE_COOLDOWN_DAYS,
  PRICING_NUDGE_DELAY_MS,
  PRICING_NUDGE_STORAGE_KEY,
} from "./constant"

/**
 * One-shot proactive open of the chatbot on the /pricing page.
 *
 * Fires the existing `open-chatbot` window event (already wired up in
 * `content.tsx`) — no new infra. Behaviour:
 *
 * - Skips on touch / small viewports (avoid surprise modal on mobile)
 * - Respects `prefers-reduced-motion` (skips entirely)
 * - localStorage value `dismissed`        → never re-trigger (user closed it
 *                                            within 5 s of auto-open)
 * - localStorage value `shown:<isoDate>`  → 30-day cooldown, then re-trigger
 *
 * Renders nothing visually — it's a side-effect-only mount.
 */
export function PricingChatbotNudge() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Mobile / reduced-motion → skip entirely
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.innerWidth < 768) return

    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(PRICING_NUDGE_STORAGE_KEY)
    } catch {
      // localStorage may be blocked in private mode — fail silently
      return
    }

    if (stored === "dismissed") return
    if (stored?.startsWith("shown:")) {
      const lastShown = new Date(stored.slice("shown:".length))
      const elapsedMs = Date.now() - lastShown.getTime()
      const cooldownMs = PRICING_NUDGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      if (Number.isFinite(lastShown.getTime()) && elapsedMs < cooldownMs) {
        return
      }
    }

    let opened = false
    let openedAt = 0

    const fireOpen = () => {
      try {
        window.localStorage.setItem(
          PRICING_NUDGE_STORAGE_KEY,
          `shown:${new Date().toISOString()}`
        )
      } catch {
        /* ignore */
      }
      opened = true
      openedAt = Date.now()
      window.dispatchEvent(new CustomEvent("open-chatbot"))
    }

    const timer = window.setTimeout(fireOpen, PRICING_NUDGE_DELAY_MS)

    // If the user closes within 5 s of auto-open, treat it as a dismissal
    // and never re-trigger in this browser. Detected via `mousedown` on
    // anything outside the chat window — `chat-window.tsx` already closes
    // on outside-click, so we just listen for the same signal.
    const handleQuickDismiss = () => {
      if (!opened) return
      if (Date.now() - openedAt < 5_000) {
        try {
          window.localStorage.setItem(PRICING_NUDGE_STORAGE_KEY, "dismissed")
        } catch {
          /* ignore */
        }
      }
    }

    window.addEventListener("mousedown", handleQuickDismiss, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("mousedown", handleQuickDismiss, true)
    }
  }, [])

  return null
}
