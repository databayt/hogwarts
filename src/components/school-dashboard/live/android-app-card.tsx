"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useSyncExternalStore } from "react"

import {
  apkUrlFor,
  buildIntentUrl,
  classifyUserAgent,
  isInAppBrowser,
  subdomainOf,
} from "./android-app"
import type { RoomLabels } from "./room/labels"

const noop = () => () => {}

type Snapshot = { kind: string; webview: boolean; href: string; apk: string }

let cached: { key: string; snap: Snapshot } | null = null
function read(): Snapshot | null {
  if (typeof window === "undefined") return null
  const ua = navigator.userAgent
  const key = `${ua}|${location.host}|${location.pathname}${location.search}`
  if (cached?.key === key) return cached.snap
  const apk = apkUrlFor(subdomainOf(location.host))
  const snap = {
    kind: classifyUserAgent(ua),
    webview: isInAppBrowser(ua),
    href: buildIntentUrl(location.host, location.pathname + location.search, apk),
    apk,
  }
  cached = { key, snap }
  return snap
}

/**
 * Every Android phone is steered to the school's app: it can use the mic
 * (a WebView cannot) and share the screen. Renders nothing elsewhere.
 * `onContinue` hides the card so nobody is locked out of the browser.
 */
export function AndroidAppCard({ labels }: { labels: RoomLabels }) {
  const snap = useSyncExternalStore(noop, read, () => null)
  const [dismissed, setDismissed] = useState(false)
  if (!snap || snap.kind === "other" || dismissed) return null
  return (
    <div
      role="region"
      className="mx-auto my-3 flex w-full max-w-md flex-col gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center"
    >
      <p className="text-base font-semibold">{labels.androidAppTitle}</p>
      {snap.webview && (
        <p className="text-destructive text-sm font-medium">
          {labels.androidAppWebview}
        </p>
      )}
      <a
        href={snap.href}
        className="bg-primary text-primary-foreground rounded-xl px-4 py-3 text-sm font-semibold"
      >
        {labels.androidAppOpen}
      </a>
      <p className="text-muted-foreground text-sm">
        {labels.androidAppNoApp}{" "}
        <a href={snap.apk} className="underline">
          {labels.androidAppDownload}
        </a>
      </p>
      <button
        type="button"
        className="text-muted-foreground text-xs underline"
        onClick={() => setDismissed(true)}
      >
        {labels.androidAppContinue}
      </button>
    </div>
  )
}
