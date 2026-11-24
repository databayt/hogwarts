"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useSyncExternalStore } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { typographyVariants } from "@/lib/typography"

import { apkUrlFor } from "./android-app"
import { reportWebFallback } from "./android-gate-actions"
import {
  APP_STORAGE_KEY,
  buildGateIntentUrl,
  hasAppFlag,
  parseCookies,
  schoolDateString,
  shouldGate,
  WEB_OK_COOKIE,
} from "./android-gate"

export type AppGateLabels = {
  title: string
  why: string
  open: string
  download: string
  cantInstall: string
  confirmTitle: string
  confirmBody: string
  confirmYes: string
  confirmNo: string
}

const DAY = 86_400

// One tiny store so a cookie write re-renders the gate.
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => void listeners.delete(cb)
}
const notify = () => listeners.forEach((l) => l())

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

/**
 * Mounted wherever an app school's pages render for signed-in or signing-in
 * people. On an Android browser (not our app) it covers the screen with
 * "open the app / download the app" and nothing else, except one small way
 * out so nobody is locked out of class for the day. Android's browser can
 * neither share the screen nor keep a class alive in the background.
 *
 * The app marks its own web visits with `?app=1`; that sets `bq_app` in this
 * tab's sessionStorage, so only that tab is let through.
 */
export function AndroidAppGate({
  subdomain,
  lang,
  timeZone,
  labels,
}: {
  subdomain: string
  lang: string
  timeZone?: string | null
  labels: AppGateLabels
}) {
  const [confirming, setConfirming] = useState(false)
  const gated = useSyncExternalStore(
    subscribe,
    () => {
      // The app's mark lives in this tab's sessionStorage, never a cookie.
      let appMark = false
      try {
        if (hasAppFlag(location.search)) {
          sessionStorage.setItem(APP_STORAGE_KEY, "1")
        }
        appMark = sessionStorage.getItem(APP_STORAGE_KEY) === "1"
      } catch {
        // storage blocked: the mark cannot be kept, the gate stays on
      }
      return shouldGate({
        ua: navigator.userAgent,
        uaPlatform: (
          navigator as Navigator & { userAgentData?: { platform?: string } }
        ).userAgentData?.platform,
        maxTouchPoints: navigator.maxTouchPoints,
        screenMin: Math.min(screen.width, screen.height),
        isAppSchool: true,
        appMark,
        cookies: parseCookies(document.cookie),
        todayInSchoolZone: schoolDateString(timeZone),
      })
    },
    () => false
  )
  if (!gated) return null

  const apk = apkUrlFor(subdomain)
  const intent = buildGateIntentUrl(
    location.host,
    location.pathname,
    location.search,
    apk
  )
  const rtl = lang !== "en"

  const letThrough = () => {
    setCookie(WEB_OK_COOKIE, schoolDateString(timeZone), 2 * DAY)
    void reportWebFallback(lang)
    notify()
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={labels.title}
      dir={rtl ? "rtl" : "ltr"}
      className="bg-background fixed inset-0 z-[1000] flex flex-col overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top)+32px)] pb-[calc(env(safe-area-inset-bottom)+24px)]"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 text-center">
        {confirming ? (
          <>
            <h1 className={typographyVariants.sectionTitle}>
              {labels.confirmTitle}
            </h1>
            <p className={typographyVariants.pageDescription}>
              {labels.confirmBody}
            </p>
            <button
              type="button"
              onClick={letThrough}
              className={cn(buttonVariants({ size: "lg" }), "h-14 w-full")}
            >
              {labels.confirmYes}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full"
              )}
            >
              {labels.confirmNo}
            </button>
          </>
        ) : (
          <>
            <h1 className={typographyVariants.sectionTitle}>{labels.title}</h1>
            <p className={typographyVariants.pageDescription}>{labels.why}</p>
            <a
              href={intent}
              className={cn(buttonVariants({ size: "lg" }), "h-14 w-full")}
            >
              {labels.open}
            </a>
            <a
              href={apk}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full"
              )}
            >
              {labels.download}
            </a>
          </>
        )}
      </div>
      {!confirming && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-muted-foreground mx-auto mt-6 min-h-11 px-4 text-sm underline underline-offset-4"
        >
          {labels.cantInstall}
        </button>
      )}
    </div>
  )
}
