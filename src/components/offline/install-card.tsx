"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  Bell,
  EllipsisVertical,
  Share,
  Smartphone,
  SquarePlus,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import type { OfflineLabels } from "./outbox-view"

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_DAYS = 14
const ACCENT = "#e8704e" // the app icon's orange

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "ios" | "android"

/** Platform detection as an external snapshot: null on the server and on
 *  desktop, "ios" / "android" on phones that are not installed and not
 *  recently dismissed. Read once per render, no state set inside effects. */
function detectPlatform(): Platform | null {
  if (typeof window === "undefined") return null
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  if (standalone) return null
  const ua = navigator.userAgent
  const ios =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) // iPadOS
  const android = /Android/i.test(ua)
  if (!ios && !android) return null
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    if (at && Date.now() - at < DISMISS_DAYS * 86400_000) return null
  } catch {
    // storage blocked — show the sheet anyway
  }
  return ios ? "ios" : "android"
}
const subscribeNoop = () => () => {}
const serverSnapshot = () => null

/**
 * The install welcome sheet — a full-screen "What's new in …" page in the
 * Apple Podcasts style (Abdout's reference, 2026-09-13): an accent eyebrow
 * over the app name, three feature rows with accent icons, a footnote and one
 * big Continue button. Shown on phones that have not installed the app, once
 * per 14 days after "Not now".
 *
 * Continue does the right thing per platform: replays the captured
 * `beforeinstallprompt` on Android; on iPhone opens the native share sheet
 * through Web Share (Add to Home Screen is one of its actions) and turns the
 * footnote into the two-step guide underneath; Android without the event
 * gets the browser-menu guide. Installed is the prerequisite for Web Push on
 * iOS.
 */
export function InstallCard({ labels }: { labels?: OfflineLabels }) {
  const detected = useSyncExternalStore(subscribeNoop, detectPlatform, serverSnapshot)
  const [hidden, setHidden] = useState(false)
  const [guide, setGuide] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const platform = hidden ? null : detected

  const t = (k: string, fallback: string) => labels?.[k] ?? fallback

  useEffect(() => {
    if (detected !== "android") return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [detected])

  if (!platform) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
    setHidden(true)
  }

  const proceed = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      if (outcome === "accepted") setHidden(true)
      return
    }
    setGuide(true)
    // iPhone: the native share sheet straight from the tap (Web Share needs
    // the gesture); "Add to Home Screen" is one of its actions.
    if (platform === "ios" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: t("installAppName", "balqalam"),
          url: window.location.href.split("#")[0],
        })
      } catch {
        // cancelled or unsupported payload — the guide is already showing
      }
    }
  }

  const features = [
    {
      icon: Smartphone,
      title: t("installFeature1Title", "On your Home Screen"),
      body: t("installFeature1Body", "Opens full-screen like any app, with no browser."),
    },
    {
      icon: WifiOff,
      title: t("installFeature2Title", "Works offline"),
      body: t(
        "installFeature2Body",
        "Mark attendance with no signal; it syncs when the network is back."
      ),
    },
    {
      icon: Bell,
      title: t("installFeature3Title", "Notifications on your phone"),
      body: t("installFeature3Body", "Absences, exams and live classes reach you instantly."),
    },
  ]

  const steps =
    platform === "ios"
      ? [
          { icon: Share, text: t("installIosStep1", "In the share sheet that opened, scroll down.") },
          { icon: SquarePlus, text: t("installIosStep2", "Choose “Add to Home Screen”, then tap Add.") },
        ]
      : [
          { icon: EllipsisVertical, text: t("installAndroidStep1", "Open the browser menu (⋮) at the top.") },
          { icon: SquarePlus, text: t("installAndroidStep2", "Choose “Add to Home screen” or “Install app”.") },
        ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("installTitle", "Add balqalam to your Home Screen")}
      className="bg-background text-foreground fixed inset-0 z-[100] flex flex-col overflow-y-auto overscroll-contain px-6 pt-[calc(env(safe-area-inset-top)+64px)] pb-[calc(env(safe-area-inset-bottom)+16px)] md:hidden"
    >
      <h1 className="text-[34px] leading-[1.15] font-bold tracking-tight">
        <span className="block" style={{ color: ACCENT }}>
          {t("installEyebrow", "Get the app")}
        </span>
        <span className="block">{t("installAppName", "balqalam")}</span>
      </h1>

      <ul className="mt-10 space-y-7">
        {features.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex items-start gap-4">
            <Icon
              className="mt-0.5 size-10 shrink-0"
              strokeWidth={1.75}
              style={{ color: ACCENT }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[17px] leading-snug font-semibold">{title}</p>
              <p className="text-muted-foreground text-[17px] leading-snug">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        {guide ? (
          <ol className="mb-5 space-y-3">
            {steps.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {i + 1}
                </span>
                <span className="bg-muted text-foreground grid size-9 shrink-0 place-items-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-[15px]">{text}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground mb-5 text-[13px] leading-snug">
            {platform === "ios"
              ? t("installFootnoteIos", "After Continue, pick “Add to Home Screen” in the share sheet.")
              : t("installFootnoteAndroid", "After Continue, tap Install.")}
          </p>
        )}
        {guide ? (
          <Button
            onClick={dismiss}
            className="h-14 w-full rounded-full text-[17px] font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            {t("installGotIt", "Got it")}
          </Button>
        ) : (
          <Button
            onClick={proceed}
            className="h-14 w-full rounded-full text-[17px] font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            {t("installContinue", "Continue")}
          </Button>
        )}
        {!guide && (
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground mt-3 w-full py-2 text-[15px]"
          >
            {t("installDismiss", "Not now")}
          </button>
        )}
      </div>
    </div>
  )
}
