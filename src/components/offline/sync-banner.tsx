"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react"

import { useOnlineStatus, useOutbox } from "@/lib/offline/hooks"
import { installOutboxTriggers } from "@/lib/offline/outbox"
import { Button } from "@/components/ui/button"

import type { OfflineLabels } from "./download-button"

/**
 * Mounted once in the school dashboard layout: installs the outbox's drain
 * triggers and shows the one strip a student needs — offline, pending sync,
 * or parked items that need a look. Renders nothing when there is nothing
 * to say.
 */
export function OfflineSyncBanner({
  labels,
  locale = "en",
}: {
  labels?: OfflineLabels
  locale?: string
}) {
  const online = useOnlineStatus()
  const { pending, parked, drain, draining } = useOutbox()

  useEffect(() => installOutboxTriggers(), [])

  const t = (
    k: string,
    fallback: string,
    vars?: Record<string, string | number>
  ) => {
    let s = labels?.[k] ?? fallback
    for (const [name, v] of Object.entries(vars ?? {})) {
      s = s.replace(`{${name}}`, String(v))
    }
    return s
  }

  if (online && pending === 0 && parked === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-sm " +
        (!online
          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
          : parked > 0
            ? "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
            : "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100")
      }
    >
      {!online ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium">
            {t("offlineNow", "You're offline")}
          </span>
          <span className="opacity-80">
            {t(
              "offlineHint",
              "Downloaded lessons still play. Anything you do is saved and synced later."
            )}
          </span>
          {pending > 0 && (
            <span className="opacity-80">
              ·{" "}
              {t("pendingSync", "{count} items waiting to sync", {
                count: pending,
              })}
            </span>
          )}
        </>
      ) : (
        <>
          {parked > 0 ? (
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {pending > 0 && (
            <span>
              {t("pendingSync", "{count} items waiting to sync", {
                count: pending,
              })}
            </span>
          )}
          {parked > 0 && (
            <Link
              href="/offline"
              className="font-medium underline underline-offset-2"
            >
              {t("attention", "{count} items need attention", {
                count: parked,
              })}
            </Link>
          )}
          {pending > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ms-auto h-7"
              disabled={draining}
              onClick={() => void drain()}
            >
              {draining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : null}
              {draining ? t("syncing", "Syncing…") : t("syncNow", "Sync now")}
            </Button>
          )}
        </>
      )}
      <span className="sr-only">{locale}</span>
    </div>
  )
}
