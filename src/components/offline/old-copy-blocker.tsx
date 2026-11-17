"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useSyncExternalStore } from "react"

import { isOldAppCopy } from "@/components/school-dashboard/live/android-app"

import type { OfflineLabels } from "./outbox-view"

const subscribeNoop = () => () => {}
const serverSnapshot = () => false

/** True inside an installed home-screen window on Android. */
function standaloneAndroid(): boolean {
  if (typeof window === "undefined") return false
  const standalone = ["standalone", "fullscreen", "minimal-ui"].some(
    (m) => window.matchMedia(`(display-mode: ${m})`).matches
  )
  // hasOwnApp is the caller's gate; only the device facts are read here.
  return isOldAppCopy({
    standalone,
    ua: navigator.userAgent,
    hasOwnApp: true,
  })
}

/**
 * Full-screen, non-dismissable notice for the old home-screen web copy of a
 * school that now has its own Android app. The two are easy to confuse, and
 * the copy cannot do what the app does (screen share, live classes), so it
 * tells the person to delete it and install the app.
 */
export function OldCopyBlocker({
  labels,
  lang,
  app,
}: {
  labels?: OfflineLabels
  lang: string
  app: { url: string; name: string; icon: string } | null
}) {
  const old = useSyncExternalStore(
    subscribeNoop,
    standaloneAndroid,
    serverSnapshot
  )
  if (!app || !old) return null

  const t = (k: string, fallback: string) =>
    (labels?.[k] ?? fallback).replaceAll("{app}", app.name)
  const rtl = lang !== "en"
  // A same-site link would stay inside this installed window (it is in the
  // app's scope), so hand the address to Chrome itself; any browser if Chrome
  // is missing.
  const host = window.location.host
  const browserUrl =
    `intent://${host}/${lang}/dashboard#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(`https://${host}/${lang}/dashboard`)};end`

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={t("oldCopyTitle", "This is an old copy of the school app")}
      dir={rtl ? "rtl" : "ltr"}
      className="bg-background fixed inset-0 z-[200] flex flex-col overflow-y-auto px-6 pt-[calc(env(safe-area-inset-top)+32px)] pb-[calc(env(safe-area-inset-bottom)+24px)]"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={app.icon}
          alt=""
          width={72}
          height={72}
          className="size-[72px] rounded-[16px] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
        />
        <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-tight">
          {t("oldCopyTitle", "This is an old copy of the school app")}
        </h1>
        <p className="text-muted-foreground mt-2 text-[16px] leading-snug">
          {t(
            "oldCopyBody",
            "The app on your home screen is the old web copy. Delete it, then install the “{app}” app."
          )}
        </p>
        <ol className="mt-6 space-y-3 text-[16px] leading-snug">
          {[
            t(
              "oldCopyStep1",
              "Press and hold this icon on your phone, then choose “Uninstall” or “Remove”"
            ),
            t(
              "oldCopyStep2",
              "Tap “Download the app” below and install “{app}”"
            ),
            t("oldCopyStep3", "Open “{app}” (the blue icon) and sign in"),
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="bg-muted grid size-7 shrink-0 place-items-center rounded-full text-[14px] font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <div className="min-h-8 flex-1" />
        <a
          href={app.url}
          className="bg-foreground text-background grid h-14 w-full shrink-0 place-items-center rounded-full text-[17px] font-semibold"
        >
          {t("apkDownload", "Download the app")}
        </a>
        <a
          href={browserUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground mt-4 text-center text-[15px] underline underline-offset-4"
        >
          {t("oldCopyBrowser", "Open in the browser instead")}
        </a>
      </div>
    </div>
  )
}
