"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useConnectionState } from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { Headphones, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  glassPill,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"

import type { QualitySample } from "./adaptive-delivery"
import type { RoomLabels } from "./labels"

/** "جارٍ إعادة الاتصال…" — over everything while the SDK re-establishes the call. */
export function ReconnectingOverlay({ labels }: { labels: RoomLabels }) {
  const state = useConnectionState()
  if (
    state !== ConnectionState.Reconnecting &&
    state !== ConnectionState.Connecting
  )
    return null
  return (
    <div
      role="status"
      aria-live="assertive"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 text-white"
    >
      <div
        className={cn(glassPill, "flex items-center gap-3 px-5 py-3 text-base")}
        style={glassSurface}
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        {labels.reconnecting}
      </div>
    </div>
  )
}

/** "تم تشغيل وضع الصوت والشرائح" — the ladder reached the bottom tier. */
export function AudioOnlyBanner({
  on,
  labels,
}: {
  on: boolean
  labels: RoomLabels
}) {
  if (!on) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        glassPill,
        "flex items-center gap-2 bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-black shadow-lg"
      )}
    >
      <Headphones className="h-4 w-4" aria-hidden />
      {labels.audioOnlyOn}
    </div>
  )
}

const DOT: Record<QualitySample, string> = {
  excellent: "bg-emerald-500",
  good: "bg-emerald-400",
  poor: "bg-amber-400",
  lost: "bg-red-500",
  unknown: "bg-neutral-500",
}

export function QualityDot({
  quality,
  labels,
}: {
  quality: QualitySample
  labels: RoomLabels
}) {
  const text =
    quality === "excellent"
      ? labels.excellent
      : quality === "good"
        ? labels.good
        : quality === "poor"
          ? labels.poor
          : quality === "lost"
            ? labels.lost
            : "—"
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-white/80"
      title={labels.connection}
    >
      <span
        className={"inline-block h-2.5 w-2.5 rounded-full " + DOT[quality]}
        aria-hidden
      />
      <span className="sr-only">{labels.connection}: </span>
      {text}
    </span>
  )
}

/**
 * The connection as a TINT on a glyph rather than a dot beside a word — what
 * the top-end pill has room for. Same four steps as `DOT` above.
 */
export const QUALITY_TONE: Record<QualitySample, string> = {
  excellent: "text-emerald-400",
  good: "text-emerald-300",
  poor: "text-amber-400",
  lost: "text-red-500",
  unknown: "text-white/60",
}
