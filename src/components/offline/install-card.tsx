"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { ArrowRight, EllipsisVertical, Share, SquarePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import type { OfflineLabels } from "./outbox-view"

const DISMISS_KEY = "pwa-install-dismissed-at"
const DISMISS_DAYS = 14

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "ios" | "android"

/**
 * "Download app" for phones. One button, always actionable:
 *
 * - Android Chrome hands us a `beforeinstallprompt` we replay from the tap,
 *   so the real install sheet opens.
 * - iOS has no install API: the tap opens the native share sheet through Web
 *   Share (Add to Home Screen is one of its actions) with the two-step guide
 *   underneath. Android without the event (already dismissed, unmet
 *   heuristics) gets the browser-menu guide.
 *
 * Hidden when already installed (standalone), on desktop, or for two weeks
 * after a dismissal. The row is styled like an App Store search result (icon,
 * bold app name, grey blurb, a "Get"-style pill with a caption under it), per
 * Abdout's reference of 2026-09-13. Installed is the prerequisite for Web
 * Push on iOS.
 */
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
    // storage blocked — show the card anyway
  }
  return ios ? "ios" : "android"
}
const subscribeNoop = () => () => {}
const serverSnapshot = () => null

export function InstallCard({ labels }: { labels?: OfflineLabels }) {
  const detected = useSyncExternalStore(subscribeNoop, detectPlatform, serverSnapshot)
  const [hidden, setHidden] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
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

  const download = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      setDeferred(null)
      if (outcome === "accepted") setHidden(true)
      return
    }
    // iPhone: open the native share sheet straight from the tap (Web Share
    // needs the user gesture) — "Add to Home Screen" is one of its actions —
    // with the two-step guide underneath so the sheet's dismissal lands on
    // the instruction, not on nothing.
    setSheetOpen(true)
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

  const steps =
    platform === "ios"
      ? [
          {
            icon: <Share className="size-5" aria-hidden />,
            text: t("installIosStep1", "Tap the Share button at the bottom of Safari."),
          },
          {
            icon: <SquarePlus className="size-5" aria-hidden />,
            text: t("installIosStep2", "Choose “Add to Home Screen”, then tap Add."),
          },
        ]
      : [
          {
            icon: <EllipsisVertical className="size-5" aria-hidden />,
            text: t("installAndroidStep1", "Open the browser menu (⋮) at the top."),
          },
          {
            icon: <SquarePlus className="size-5" aria-hidden />,
            text: t("installAndroidStep2", "Choose “Add to Home screen” or “Install app”."),
          },
        ]

  return (
    <>
      <div
        role="region"
        aria-label={t("installTitle", "Add balqalam to your Home Screen")}
        className="bg-card text-card-foreground border-border/50 relative mb-4 flex items-center gap-3 rounded-2xl border p-3 shadow-sm md:hidden"
      >
        <Image
          src="/icon-192.png"
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-[14px]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] leading-tight font-bold">
            {t("installAppName", "balqalam")}
          </p>
          <p className="text-muted-foreground truncate text-[15px] leading-snug">
            {t("installHint", "For a better experience, use the app.")}
          </p>
        </div>
        <Button
          onClick={download}
          aria-label={t("installDownload", "Download app")}
          className="h-8 w-14 shrink-0 rounded-full bg-[#EFEFF4] text-[#007AFF] hover:bg-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-[#0A84FF] dark:hover:bg-[#3A3A3C]"
        >
          <ArrowRight className="size-5 rtl:rotate-180" strokeWidth={2.5} />
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installDismiss", "Not now")}
          className="text-muted-foreground hover:text-foreground absolute -end-1 -top-1 rounded-full p-1"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>
              {t("installSheetTitle", "Get balqalam on your Home Screen")}
            </DrawerTitle>
            <DrawerDescription>
              {t(
                "installSheetHint",
                "It takes two taps. The app opens full-screen, works without a connection, and can send you notifications."
              )}
            </DrawerDescription>
          </DrawerHeader>
          <ol className="space-y-3 px-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="bg-muted text-foreground grid size-9 shrink-0 place-items-center rounded-xl">
                  {step.icon}
                </span>
                <span className="text-sm">{step.text}</span>
              </li>
            ))}
          </ol>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="rounded-full">{t("installGotIt", "Got it")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
