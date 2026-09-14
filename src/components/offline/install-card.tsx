"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
 * The install welcome sheet — an iOS sheet like the Activity View (Figma
 * iuYSGaRV8xkcEGnyIltPRg 34:3042): rounded top over the dimmed page, grabber,
 * round close, swipe to dismiss. Inside: the app icon, the one instruction
 * ("tap Continue, then choose Add to Home Screen"), a real capture of Safari's
 * share menu with that row highlighted, and a foreground Continue. Continue
 * does nothing but the native thing — the captured install prompt on Android,
 * the native share sheet on iPhone (Add to Home Screen is one of its actions).
 * Shown on phones that have not installed the app, once per 14 days after a
 * dismissal.
 */
export function InstallCard({ labels }: { labels?: OfflineLabels }) {
  const detected = useSyncExternalStore(
    subscribeNoop,
    detectPlatform,
    serverSnapshot
  )
  const [hidden, setHidden] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  )
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
    // The native share sheet straight from the tap (Web Share needs the
    // gesture); on iPhone "Add to Home Screen" is one of its actions.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: t("installAppName", "balqalam"),
          url: window.location.href.split("#")[0],
        })
      } catch {
        // cancelled — nothing else to say
      }
    }
  }

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) dismiss()
      }}
    >
      <DrawerContent
        aria-label={t("installTitle", "Add balqalam to your Home Screen")}
        className="h-[90vh]! max-h-[92vh]! rounded-t-[36px]! border-0 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] [&>div:first-child]:mt-2 [&>div:first-child]:h-[5px] [&>div:first-child]:w-9 [&>div:first-child]:bg-black/30"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installDismiss", "Not now")}
          className="text-foreground/70 absolute end-4 top-4 grid size-[30px] place-items-center rounded-full bg-black/[0.06] dark:bg-white/10"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-8">
          {/* App identity: icon beside name + short description, at start. */}
          <div className="flex items-center gap-3">
            <Image
              src="/apple-touch-icon.png"
              alt=""
              width={180}
              height={180}
              className="size-[60px] shrink-0 rounded-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
              priority
            />
            <div className="min-w-0 text-start">
              {/* Only the title shares a row with the close button; the
                  description sits below it and stays on one line. */}
              <DrawerTitle className="pe-10 text-[24px] leading-tight font-bold tracking-tight">
                {t("installAppName", "balqalam")}
              </DrawerTitle>
              <p className="text-muted-foreground mt-0.5 text-[min(14px,3.6vw)] leading-snug whitespace-nowrap">
                {t(
                  "installAppDesc",
                  "Feels native, opens full screen, and works offline."
                )}
              </p>
            </div>
          </div>
          <DrawerDescription
            asChild
            className="text-foreground mt-6 space-y-3 text-start text-[16px] leading-snug"
          >
            <ol>
              {[
                t("installStep1", "Tap Continue"),
                t("installStep2", 'Choose "Add to Home Screen"'),
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="bg-muted text-foreground grid size-7 shrink-0 place-items-center rounded-full text-[14px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </DrawerDescription>

          {/* Safari's share menu with "Add to Home Screen" highlighted. */}
          <Image
            src="/install/add-to-home-screen.jpg"
            alt=""
            width={1170}
            height={752}
            sizes="(max-width: 480px) 100vw, 480px"
            className="mt-5 h-auto w-full rounded-[22px]"
          />

          <div className="min-h-5 flex-1" />
          <Button
            onClick={proceed}
            className="bg-foreground text-background hover:bg-foreground/90 h-14 w-full shrink-0 rounded-full text-[17px] font-semibold"
          >
            {t("installContinue", "Continue")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
