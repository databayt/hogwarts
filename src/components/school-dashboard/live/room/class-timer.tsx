"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import {
  glassPill,
  glassSurface,
} from "@/components/lumos/shared/video-player/glass"
import {
  SfSymbol,
  timer as timerGlyph,
} from "@/components/lumos/shared/video-player/sf-symbols"

import { timerLeft, type ClassTimer as Timer } from "./class-channel"

const DONE_SHOWN_MS = 8000

/** A running timer that has reached zero. */
export function timerDone(t: Timer | null, now: number): boolean {
  return Boolean(t?.running && now >= t.endsAt)
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Ticks while a timer runs; `now` for everything that reads it. */
export function useTimerNow(timer: Timer | null): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!timer?.running) return
    const h = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(h)
  }, [timer])
  return timer?.running
    ? now
    : (timer?.endsAt ?? now) - (timer?.remainingMs ?? 0)
}

/**
 * The class countdown everyone sees: a glass pill under the top row with a
 * ring that empties as time runs out, red for the last ten seconds. At zero
 * it calls `onDone` once per run (the room chimes and says so).
 */
export function ClassTimerPill({
  timer,
  label,
  onDone,
}: {
  timer: Timer
  label: string
  onDone: () => void
}) {
  const now = useTimerNow(timer)
  const left = timerLeft(timer, now)
  const doneFor = useRef<number | null>(null)
  useEffect(() => {
    if (timer.running && left <= 0 && doneFor.current !== timer.endsAt) {
      doneFor.current = timer.endsAt
      onDone()
    }
  }, [left, timer, onDone])

  // A finished countdown says so for a few seconds, then gets out of the way.
  if (timer.running && now - timer.endsAt > DONE_SHOWN_MS) return null

  const frac = timer.totalMs > 0 ? left / timer.totalMs : 0
  const r = 9
  const c = 2 * Math.PI * r
  const urgent = left <= 10_000

  return (
    <div
      role="timer"
      aria-label={`${label} ${formatClock(left)}`}
      className={cn(
        glassPill,
        "pointer-events-auto flex h-11 items-center gap-2 ps-2 pe-4 text-white",
        urgent && timer.running && "motion-safe:animate-pulse"
      )}
      style={{
        ...glassSurface,
        background: urgent ? "rgb(220 38 38 / 0.85)" : "rgba(20, 20, 20, 0.6)",
      }}
    >
      <span className="relative flex size-7 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx="12"
            cy="12"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2.5"
          />
          <circle
            cx="12"
            cy="12"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - frac)}
            style={{ transition: "stroke-dashoffset 250ms linear" }}
          />
        </svg>
        <SfSymbol glyph={timerGlyph} pt={11} />
      </span>
      <span className="text-[17px] font-semibold tabular-nums">
        {formatClock(left)}
      </span>
    </div>
  )
}
