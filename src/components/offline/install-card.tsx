"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { EllipsisVertical, Share, SquarePlus, X } from "lucide-react"

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
 * - iOS has no event and no API (install is Share → Add to Home Screen), and
 *   Android without the event (already dismissed, unmet heuristics) has only
 *   the browser menu. Both get a two-step instruction sheet from the same
 *   button instead of a decorative icon nobody can press.
 *
 * Hidden when already installed (standalone), on desktop, or for two weeks
 * after a dismissal. The surface is the house liquid glass — the same tokens
 * the messaging tab bar was measured to from Apple's kit (Figma
 * iuYSGaRV8xkcEGnyIltPRg, "Liquid Glass – Regular – Large"). Installed is the
 * prerequisite for Web Push on iOS.
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
    setSheetOpen(true)
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
        className="wa-glass-tabbar text-foreground relative mb-4 flex items-center gap-3 rounded-[22px] p-3 pe-10 md:hidden"
      >
        <Image
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm leading-tight font-semibold">
            {t("installTitle", "Add balqalam to your Home Screen")}
          </p>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
            {t(
              "installHint",
              "Opens like an app, works without a connection, and can send notifications."
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 shrink-0 rounded-full px-4 font-semibold"
          onClick={download}
        >
          {t("installDownload", "Download app")}
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installDismiss", "Not now")}
          className="text-muted-foreground hover:text-foreground absolute end-2 top-2 rounded-full p-1"
        >
          <X className="size-4" />
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
