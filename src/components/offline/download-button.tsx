"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Check, Download, Loader2, RotateCcw, Trash2, X } from "lucide-react"

import { formatBytes, useLessonDownload } from "@/lib/offline/hooks"
import { Button } from "@/components/ui/button"

export interface OfflineLabels {
  [key: string]: string | undefined
}

interface DownloadButtonProps {
  lessonId: string
  labels?: OfflineLabels
  locale?: string
  /** The hero row renders on a dark backdrop; the resources card does not. */
  tone?: "light" | "dark"
}

/**
 * Download / resume / remove a lesson for offline study. All state comes
 * from IndexedDB through `useLessonDownload`, so the button is right on a
 * fresh page load: a download interrupted yesterday shows as resumable.
 */
export function DownloadButton({
  lessonId,
  labels,
  locale = "en",
  tone = "light",
}: DownloadButtonProps) {
  const { state, start, cancel, remove } = useLessonDownload(lessonId)
  const t = (k: string, fallback: string) => labels?.[k] ?? fallback

  if (state.status === "unsupported") return null

  const darkPill =
    tone === "dark"
      ? "border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
      : ""

  if (state.status === "downloading") {
    const { receivedBytes, totalBytes, phase } = state.progress
    const pct =
      totalBytes && totalBytes > 0
        ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
        : null
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className={darkPill}
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("downloading", "Downloading…")}
          {phase === "video" && pct !== null ? ` ${pct}%` : ""}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            tone === "dark"
              ? "text-white hover:bg-white/20 hover:text-white"
              : ""
          }
          onClick={cancel}
          aria-label={t("cancel", "Cancel")}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  if (state.status === "complete") {
    return (
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs " +
            (tone === "dark"
              ? "border-white/40 text-white"
              : "text-muted-foreground")
          }
        >
          <Check className="h-3.5 w-3.5" aria-hidden />
          {t("downloaded", "Available offline")} ·{" "}
          {formatBytes(state.bytes, locale)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={
            tone === "dark"
              ? "text-white hover:bg-white/20 hover:text-white"
              : ""
          }
          onClick={() => void remove()}
          aria-label={t("remove", "Remove download")}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    )
  }

  if (state.status === "failed") {
    const reasonKey =
      state.reason === "not-downloadable"
        ? "notPermitted"
        : state.reason === "storage"
          ? "storage"
          : "failed"
    const canRetry = state.reason !== "not-downloadable"
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            "text-xs " +
            (tone === "dark" ? "text-white/80" : "text-muted-foreground")
          }
        >
          {t(reasonKey, "Download failed")}
        </span>
        {canRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={darkPill}
            onClick={() => void start()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t("retry", "Retry")}
          </Button>
        )}
      </div>
    )
  }

  const partial = state.status === "partial"
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={darkPill}
      onClick={() => void start()}
    >
      <Download className="h-4 w-4" aria-hidden />
      {partial
        ? `${t("resume", "Resume download")} · ${formatBytes(state.bytes, locale)}`
        : t("download", "Download for offline")}
    </Button>
  )
}
