"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { Download, Share, X } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { OfflineLabels } from "./outbox-view"

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_DAYS = 14

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * "Add to Home Screen" for phones. Chrome/Android hand us a
 * `beforeinstallprompt` we can replay from a tap; iOS has no event and no
 * API, so Safari gets the Share → Add to Home Screen hint instead. Hidden
 * when already installed (standalone), on desktop, or for two weeks after
 * a dismissal. Installed is the prerequisite for Web Push on iOS.
 */
export function InstallCard({ labels }: { labels?: OfflineLabels }) {
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden")
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  const t = (k: string, fallback: string) => labels?.[k] ?? fallback

  useEffect(() => {
    if (typeof window === "undefined") return
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!mobile) return
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
      if (at && Date.now() - at < DISMISS_DAYS * 86400_000) return
    } catch {
      // storage blocked — show the card anyway
    }

    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isIos) {
      setMode("ios")
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setMode("prompt")
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    const onInstalled = () => setMode("hidden")
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (mode === "hidden") return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
    setMode("hidden")
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome === "accepted") setMode("hidden")
    else dismiss()
  }

  return (
    <div className="bg-card text-card-foreground mb-4 flex items-start gap-3 rounded-lg border p-3 shadow-sm md:hidden">
      <div className="bg-primary/10 text-primary rounded-md p-2">
        {mode === "ios" ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">
          {t("installTitle", "Add balqalam to your Home Screen")}
        </p>
        <p className="text-muted-foreground text-xs">
          {mode === "ios"
            ? t("installIosHint", 'On iPhone: tap Share, then "Add to Home Screen".')
            : t(
                "installHint",
                "Opens like an app, works without a connection, and can send notifications."
              )}
        </p>
        {mode === "prompt" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={install}>
              {t("installButton", "Install")}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {t("installDismiss", "Not now")}
            </Button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("installDismiss", "Not now")}
        className="text-muted-foreground hover:text-foreground rounded p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
