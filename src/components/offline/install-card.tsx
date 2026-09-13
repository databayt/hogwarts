"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useSyncExternalStore } from "react"
import {
  Copy,
  EllipsisVertical,
  Pointer,
  Share,
  SquarePlus,
  Star,
  X,
} from "lucide-react"

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
const ACCENT = "#e8704e" // the app icon's orange
const GREEN = "#00bc6d" // the dashboard's green (dark text on it, as the hero card does)

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
 * round close, swipe to dismiss. Inside: the accent eyebrow over the app
 * name, ONE picture of the share list with "Add to Home Screen" highlighted,
 * and a green Continue. Continue does nothing but the native thing — the
 * captured install prompt on Android, the native share sheet on iPhone
 * (Add to Home Screen is one of its actions). Shown on phones that have not
 * installed the app, once per 14 days after a dismissal.
 */
export function InstallCard({ labels }: { labels?: OfflineLabels }) {
  const detected = useSyncExternalStore(subscribeNoop, detectPlatform, serverSnapshot)
  const [hidden, setHidden] = useState(false)
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

  const MenuIcon = platform === "ios" ? Share : EllipsisVertical
  const rows = [
    { icon: Copy, label: t("installPicCopy", "Copy") },
    { icon: Star, label: t("installPicFavorites", "Add to Favorites") },
  ]

  return (
    <Drawer
      open
      onOpenChange={(open) => {
        if (!open) dismiss()
      }}
    >
      <DrawerContent
        aria-label={t("installTitle", "Add balqalam to your Home Screen")}
        className="max-h-[92vh] rounded-t-[36px]! border-0 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] [&>div:first-child]:mt-2 [&>div:first-child]:h-[5px] [&>div:first-child]:w-9 [&>div:first-child]:bg-black/30"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installDismiss", "Not now")}
          className="text-foreground/70 absolute end-4 top-4 grid size-[30px] place-items-center rounded-full bg-black/[0.06] dark:bg-white/10"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        <div className="overflow-y-auto overscroll-contain pt-8">
          <DrawerTitle className="text-[34px] leading-[1.15] font-bold tracking-tight">
            <span className="block" style={{ color: ACCENT }}>
              {t("installEyebrow", "Get the app")}
            </span>
            <span className="block">{t("installAppName", "balqalam")}</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("installPicHome", "Add to Home Screen")}
          </DrawerDescription>

          {/* The one picture: the share list with "Add to Home Screen" lit up. */}
          <figure
            aria-hidden
            className="mt-8 rounded-[22px] bg-[#F2F2F7] p-2 dark:bg-white/5"
          >
            <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-[13px]">
              <span className="grid size-7 place-items-center rounded-full bg-white shadow-sm dark:bg-white/10">
                <MenuIcon className="size-4" strokeWidth={2} />
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/15" />
            </div>
            <ul className="space-y-1">
              {rows.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="text-muted-foreground flex items-center gap-3 px-3 py-2.5 text-[15px]"
                >
                  <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                  <span>{label}</span>
                </li>
              ))}
              <li
                className="text-foreground relative flex items-center gap-3 rounded-2xl bg-white px-3 py-3 text-[16px] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-2 dark:bg-white/10"
                style={{ ["--tw-ring-color" as string]: GREEN }}
              >
                <SquarePlus className="size-5 shrink-0" strokeWidth={2} style={{ color: GREEN }} />
                <span>{t("installPicHome", "Add to Home Screen")}</span>
                <Pointer
                  className="absolute end-4 -bottom-3 size-7 rotate-[-15deg] rtl:rotate-[15deg]"
                  strokeWidth={1.75}
                  style={{ color: GREEN }}
                />
              </li>
            </ul>
          </figure>

          <Button
            onClick={proceed}
            className="mt-8 h-14 w-full rounded-full text-[17px] font-semibold text-[#050505] hover:opacity-90"
            style={{ backgroundColor: GREEN }}
          >
            {t("installContinue", "Continue")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
