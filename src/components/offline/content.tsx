"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useSyncExternalStore } from "react"
import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/lib/offline/hooks"
import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { OutboxView } from "./outbox-view"

interface OfflineContentProps {
  dictionary: Dictionary
  lang: Locale
}

/**
 * `/offline` — what the service worker shows when a navigation cannot reach
 * the network, and the queue of work done without one. Nothing is stored on
 * the device except the student's own actions: by school policy videos and
 * materials are viewed in the app, never downloaded.
 */
// The service worker serves this page IN PLACE of a page it has no saved copy
// of, at that page's address. Anywhere but /offline, this is that fallback —
// even when the browser still reports a connection (a dead server, signal
// with no data, a captive portal).
const readFallback = () => !/\/offline\/?$/.test(window.location.pathname)
const readFallbackServer = () => false
const subscribeNever = () => () => {}

export function OfflineContent({ dictionary, lang }: OfflineContentProps) {
  const off = (
    dictionary as unknown as {
      lumos?: { offline?: Record<string, string | undefined> }
    }
  )?.lumos?.offline
  const online = useOnlineStatus()
  const fallback = useSyncExternalStore(
    subscribeNever,
    readFallback,
    readFallbackServer
  )

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {(fallback || !online) && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
            <div className="bg-muted rounded-full p-3">
              <WifiOff className="text-muted-foreground h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-lg">
                {fallback
                  ? (off?.notSavedTitle ?? "This page isn't on this device yet")
                  : (off?.offlineNow ?? "You're offline")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {fallback
                  ? (off?.notSavedHint ??
                    "Open it once while you're connected and it will be here next time. Pages you've already opened still work.")
                  : (off?.offlineHint ??
                    "Downloaded lessons still play. Anything you do is saved and synced later.")}
              </p>
            </div>
            <div className="ms-auto flex gap-2">
              {fallback && (
                // An installed iPhone app has no back button of its own.
                <Button
                  variant="outline"
                  onClick={() => {
                    if (window.history.length > 1) window.history.back()
                    // A full load, so the worker answers with the saved copy.
                    else window.location.assign(`/${lang}/dashboard`)
                  }}
                >
                  {off?.back ?? "Back"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                {off?.retry ?? "Retry"}
              </Button>
            </div>
          </div>
        )}

        <section className="space-y-3">
          <h2>{off?.pendingTitle ?? "Waiting to sync"}</h2>
          <OutboxView labels={off} lang={lang} />
        </section>
      </div>
    </div>
  )
}
