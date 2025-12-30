"use client"

import { useCallback, useEffect, useState } from "react"
import { Play, X } from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
        className="text-muted"
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
        className="text-primary"
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 z-50",
        "flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm"
      )}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card className="bg-card/95 border-border/50 w-[360px] border backdrop-blur-sm sm:w-[400px]">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Circular countdown */}
              <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
                <CountdownRing countdown={countdown} total={initialCountdown} />
                <span className="text-foreground absolute text-lg font-bold">
                  {countdown}
                </span>
              </div>

              {/* Next lesson info */}
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-sm font-medium">
                  Up Next
                </p>
                <h4 className="text-foreground mt-1 truncate font-semibold">
                  {nextLesson.title}
                </h4>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">
                  {nextLesson.chapterTitle}
                  {nextLesson.duration && (
                    <span className="ml-2">
                      &bull; {formatDuration(nextLesson.duration)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex gap-3">
              <Button onClick={onPlayNext} className="flex-1" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Play Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                aria-label="Cancel auto-play"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Keyboard hint */}
            <p className="text-muted-foreground mt-4 text-center text-xs">
              Press{" "}
              <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono">
                Enter
              </kbd>{" "}
              to play or{" "}
              <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono">
                Esc
              </kbd>{" "}
              to cancel
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
