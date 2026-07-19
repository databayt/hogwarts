"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Play, X } from "lucide-react"
import { motion } from "motion/react"

import { UP_NEXT_COUNTDOWN } from "./constants"
import type { UpNextOverlayProps, VideoPlayerLabels } from "./types"

// Circular countdown ring component
function CountdownRing({
  countdown,
  total,
}: {
  countdown: number
  total: number
}) {
  const size = 56
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = ((total - countdown) / total) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-white/20"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        className="text-white"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - progress }}
        transition={{ duration: 0.5, ease: "linear" }}
      />
    </svg>
  )
}

// Format duration in minutes. Units are dict-driven with English fallbacks so
// a missing key never blanks the label.
function formatDuration(
  minutes: number | undefined,
  labels?: Pick<VideoPlayerLabels, "minUnit" | "hourUnit" | "minuteUnit">
): string {
  if (!minutes) return ""
  const minUnit = labels?.minUnit ?? "min"
  const hourUnit = labels?.hourUnit ?? "h"
  const minuteUnit = labels?.minuteUnit ?? "m"
  if (minutes < 60) return `${minutes} ${minUnit}`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0
    ? `${hours}${hourUnit} ${mins}${minuteUnit}`
    : `${hours}${hourUnit}`
}

// Renders the "Press {enter} to play or {esc} to cancel" hint, splitting the
// dict template on its literal `{enter}`/`{esc}` tokens and swapping in <kbd>
// elements so the key-badge styling survives translation/word-reordering.
function renderKeyboardHint(template: string): ReactNode[] {
  return template.split(/(\{enter\}|\{esc\})/g).map((part, i) => {
    if (part === "{enter}" || part === "{esc}") {
      return (
        <kbd key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
          {part === "{enter}" ? "Enter" : "Esc"}
        </kbd>
      )
    }
    return part
  })
}

export function VideoUpNext({
  nextLesson,
  countdown: initialCountdown = UP_NEXT_COUNTDOWN,
  onPlayNext,
  onCancel,
  labels,
}: UpNextOverlayProps) {
  const [countdown, setCountdown] = useState(initialCountdown)
  const [isCancelled, setIsCancelled] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (isCancelled || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onPlayNext()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCancelled, countdown, onPlayNext])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleCancel()
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onPlayNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onPlayNext])

  const handleCancel = useCallback(() => {
    setIsCancelled(true)
    onCancel()
  }, [onCancel])

  if (isCancelled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute end-4 bottom-4 z-50 w-[300px] rounded-xl bg-black p-4 text-white"
    >
      <div className="flex gap-4">
        {/* Circular countdown */}
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
          <CountdownRing countdown={countdown} total={initialCountdown} />
          <span className="absolute text-lg font-bold text-white">
            {countdown}
          </span>
        </div>

        {/* Next lesson info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/60">
            {labels?.upNext ?? "Up Next"}
          </p>
          <h4 className="mt-1 truncate font-semibold text-white">
            {nextLesson.title}
          </h4>
          <p className="mt-0.5 truncate text-sm text-white/60">
            {nextLesson.chapterTitle}
            {nextLesson.duration && (
              <span className="ms-2">
                &bull; {formatDuration(nextLesson.duration, labels)}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onPlayNext}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-medium text-black transition-colors hover:bg-white/90"
        >
          <Play className="h-4 w-4" />
          {labels?.playNow ?? "Play Now"}
        </button>
        <button
          onClick={handleCancel}
          aria-label={labels?.cancelAutoPlay ?? "Cancel auto-play"}
          className="rounded-lg bg-white/10 px-3 py-2.5 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-xs text-white/40">
        {renderKeyboardHint(
          labels?.keyboardHint ?? "Press {enter} to play or {esc} to cancel"
        )}
      </p>
    </motion.div>
  )
}
