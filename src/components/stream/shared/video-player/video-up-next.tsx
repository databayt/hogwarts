"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import { Play, X } from "lucide-react"
import { motion } from "motion/react"

import { UP_NEXT_COUNTDOWN } from "./constants"
import type { UpNextOverlayProps } from "./types"

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

// Format duration in minutes
function formatDuration(minutes?: number): string {
  if (!minutes) return ""
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function VideoUpNext({
  nextLesson,
  countdown: initialCountdown = UP_NEXT_COUNTDOWN,
  onPlayNext,
  onCancel,
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
          <p className="text-sm font-medium text-white/60">Up Next</p>
          <h4 className="mt-1 truncate font-semibold text-white">
            {nextLesson.title}
          </h4>
          <p className="mt-0.5 truncate text-sm text-white/60">
            {nextLesson.chapterTitle}
            {nextLesson.duration && (
              <span className="ms-2">
                &bull; {formatDuration(nextLesson.duration)}
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
          Play Now
        </button>
        <button
          onClick={handleCancel}
          aria-label="Cancel auto-play"
          className="rounded-lg bg-white/10 px-3 py-2.5 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-xs text-white/40">
        Press{" "}
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Enter</kbd>{" "}
        to play or{" "}
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Esc</kbd>{" "}
        to cancel
      </p>
    </motion.div>
  )
}
