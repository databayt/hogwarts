"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { WifiOff } from "lucide-react"

import { useOnlineStatus } from "@/lib/offline/hooks"
import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { OfflineLibrary } from "./library"

interface OfflineContentProps {
  dictionary: Dictionary
  lang: Locale
}

/**
 * `/offline` — what the service worker shows when a navigation cannot reach
 * the network, and the library of everything downloaded to this device.
 * It works online too (it is simply the list of downloads then), which is
 * also how its script chunks get cached for the day they are needed.
 */
export function OfflineContent({ dictionary, lang }: OfflineContentProps) {
  const off = (dictionary as Record<string, any>)?.lumos?.offline as
    | Record<string, string | undefined>
    | undefined
  const online = useOnlineStatus()

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {!online && (
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="bg-muted rounded-full p-3">
              <WifiOff className="text-muted-foreground h-6 w-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg">{off?.offlineNow ?? "You're offline"}</h1>
              <p className="text-muted-foreground text-sm">
                {off?.offlineHint ??
                  "Downloaded lessons still play. Anything you do is saved and synced later."}
              </p>
            </div>
            <Button
              variant="outline"
              className="ms-auto"
              onClick={() => window.location.reload()}
            >
              {off?.retry ?? "Retry"}
            </Button>
          </div>
        )}

        <OfflineLibrary labels={off} lang={lang} />
      </div>
    </div>
  )
}
