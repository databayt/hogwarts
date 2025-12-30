"use client"

import { useCallback, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import { PROGRESS_BAR } from "./constants"
import type { ProgressBarProps } from "./types"

// Format time as MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00"

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function VideoProgressBar({
  currentTime,
  duration,
  bufferedEnd,
  isSeeking,
  seekPosition,
  thumbnailUrl,
  thumbnailTime,
  onSeek,
  onSeekStart,
  onSeekMove,
  onSeekEnd,
}: ProgressBarProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [hoverTime, setHoverTime] = useState(0)

  // Calculate position from mouse event
  const getPositionFromEvent = useCallback((clientX: number) => {
    if (!progressRef.current) return 0
    const rect = progressRef.current.getBoundingClientRect()
    const position = ((clientX - rect.left) / rect.width) * 100
    return Math.max(0, Math.min(100, position))
  }, [])

  // Mouse handlers
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    if (!isSeeking) {
      onSeekEnd()
    }
  }, [isSeeking, onSeekEnd])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const position = getPositionFromEvent(e.clientX)
      setHoverPosition(position)
      setHoverTime((position / 100) * duration)

      if (isSeeking) {
        onSeekMove(position)
      }
    },
    [getPositionFromEvent, duration, isSeeking, onSeekMove]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const position = getPositionFromEvent(e.clientX)
      onSeekStart(position)
    },
    [getPositionFromEvent, onSeekStart]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isSeeking) {
        const position = getPositionFromEvent(e.clientX)
        const time = (position / 100) * duration
        onSeek(time)
        onSeekEnd()
      }
    },
    [isSeeking, getPositionFromEvent, duration, onSeek, onSeekEnd]
  )

  // Calculate percentages
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0
  const displayPosition = isSeeking
    ? (seekPosition ?? progressPercent)
    : progressPercent
  const displayTime =
    isSeeking && thumbnailTime !== null ? thumbnailTime : hoverTime

  return (
    <div className="group/progress relative w-full px-1">
      {/* Thumbnail preview */}
      <AnimatePresence>
        {(isHovering || isSeeking) && duration > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pointer-events-none absolute bottom-full mb-3 -translate-x-1/2"
            style={{
              left: `${isSeeking ? (seekPosition ?? hoverPosition) : hoverPosition}%`,
            }}
          >
            <div className="bg-background border-border overflow-hidden rounded-lg border shadow-xl">
              {/* Thumbnail image (if available) */}
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" className="h-auto w-40" />
              ) : (
                <div className="bg-muted h-24 w-40" />
              )}
              {/* Time label */}
              <div className="bg-background/95 px-2 py-1 text-center">
                <span className="text-foreground font-mono text-sm">
                  {formatTime(displayTime)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar container */}
      <motion.div
        ref={progressRef}
        className={cn(
          "relative w-full cursor-pointer rounded-full",
          "bg-muted/50"
        )}
        animate={{
          height:
            isHovering || isSeeking
              ? PROGRESS_BAR.heightHover
              : PROGRESS_BAR.heightRest,
        }}
        transition={{ duration: 0.2 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
      >
        {/* Buffered progress */}
        <div
          className="bg-muted absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* Current progress */}
        <motion.div
          className="bg-primary absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${displayPosition}%` }}
        />

        {/* Scrubber thumb */}
        <AnimatePresence>
          {(isHovering || isSeeking) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={cn(
                "bg-primary absolute top-1/2 -translate-x-1/2 -translate-y-1/2",
                "rounded-full shadow-md"
              )}
              style={{
                left: `${displayPosition}%`,
                width: PROGRESS_BAR.thumbSize,
                height: PROGRESS_BAR.thumbSize,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
