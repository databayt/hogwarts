"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

const glassStyle = {
  background: "rgba(20, 20, 20, 0.4)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
}

const glassClasses = cn(
  "cursor-pointer rounded-full",
  "backdrop-blur-[40px]",
  "transition-all duration-150",
  "hover:bg-[rgba(40,40,40,0.6)] active:opacity-60",
  "focus:outline-none"
)

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="96.69 30.35 93.5 97.51"
      fill="currentColor"
      className={className}
    >
      <path d="M113.428 127.863c2.588 0 5.03-.733 8.448-2.686l60.302-35.01c4.883-2.88 8.008-6.103 8.008-11.084 0-4.98-3.125-8.203-8.008-11.035l-60.302-35.01c-3.418-2.002-5.86-2.685-8.448-2.685-5.566 0-10.742 4.248-10.742 11.67v74.17c0 7.422 5.176 11.67 10.742 11.67Z" />
    </svg>
  )
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="104.23 34.94 74.91 88.23"
      fill="currentColor"
      className={className}
    >
      <path d="M113.411 123.175h12.94c6.103 0 9.13-3.027 9.13-9.13V44.073c0-5.86-3.027-8.936-9.13-9.131h-12.94c-6.103 0-9.18 3.027-9.18 9.13v69.971c-.146 6.104 2.881 9.131 9.18 9.131Zm43.604 0h12.939c6.104 0 9.18-3.027 9.18-9.13V44.073c0-5.86-3.076-9.131-9.18-9.131h-12.94c-6.103 0-9.18 3.027-9.18 9.13v69.971c0 6.104 2.93 9.131 9.18 9.131Z" />
    </svg>
  )
}

function SkipBackward({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="84.21 19.76 99.61 109.08"
      fill="currentColor"
      className={className}
    >
      <path d="M84.205 79.035c0 27.246 22.608 49.804 49.805 49.804 27.246 0 49.805-22.558 49.805-49.804 0-24.024-17.53-44.385-40.381-48.877v-6.934c0-3.467-2.393-4.395-5.03-2.49l-15.576 10.888c-2.246 1.563-2.295 3.907 0 5.518l15.528 10.938c2.685 1.953 5.078 1.025 5.078-2.49v-6.934c18.457 4.199 32.031 20.605 32.031 40.38 0 23.047-18.408 41.504-41.455 41.504-23.047 0-41.553-18.457-41.504-41.503.049-13.868 6.787-26.124 17.188-33.545 2.002-1.514 2.636-3.809 1.416-5.86-1.221-2.002-3.907-2.539-6.055-.879-12.549 9.131-20.85 23.877-20.85 40.284Zm61.866 20.556c8.105 0 13.427-7.666 13.427-19.385 0-11.816-5.322-19.58-13.427-19.58-8.106 0-13.428 7.764-13.428 19.58 0 11.72 5.322 19.385 13.428 19.385Zm-25.44-.586c1.904 0 3.125-1.318 3.125-3.369V64.923c0-2.392-1.27-3.906-3.467-3.906-1.318 0-2.246.44-4.052 1.611l-6.739 4.541c-1.074.782-1.611 1.66-1.611 2.832 0 1.612 1.27 2.979 2.832 2.979.928 0 1.367-.195 2.344-.879l4.54-3.32v26.855c0 2.002 1.173 3.37 3.028 3.37Zm25.44-5.322c-4.297 0-7.08-5.127-7.08-13.477 0-8.496 2.734-13.671 7.08-13.671 4.345 0 7.03 5.126 7.03 13.671 0 8.35-2.734 13.477-7.03 13.477Z" />
    </svg>
  )
}

function SkipForward({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="84.21 19.78 99.61 109.06"
      fill="currentColor"
      className={className}
    >
      <path d="M84.205 79.035c0 27.246 22.608 49.804 49.805 49.804 27.246 0 49.805-22.558 49.805-49.804 0-16.407-8.301-31.153-20.85-40.284-2.148-1.66-4.834-1.123-6.055.88-1.22 2.05-.586 4.345 1.416 5.859 10.4 7.421 17.139 19.677 17.188 33.545.049 23.046-18.457 41.503-41.504 41.503-23.047 0-41.455-18.457-41.455-41.503 0-19.776 13.574-36.182 32.031-40.381v6.982c0 3.467 2.393 4.395 5.078 2.49L145.24 37.19c2.198-1.514 2.247-3.858 0-5.469l-15.527-10.937c-2.734-1.954-5.127-1.026-5.127 2.49v6.885c-22.851 4.492-40.38 24.853-40.38 48.877Zm61.621 20.556c8.106 0 13.428-7.666 13.428-19.385 0-11.816-5.322-19.58-13.428-19.58-8.105 0-13.427 7.764-13.427 19.58 0 11.72 5.322 19.385 13.427 19.385Zm-25.44-.586c1.905 0 3.126-1.318 3.126-3.369V64.923c0-2.392-1.27-3.906-3.467-3.906-1.318 0-2.246.44-4.053 1.611l-6.738 4.541c-1.074.782-1.611 1.66-1.611 2.832 0 1.612 1.27 2.979 2.832 2.979.928 0 1.367-.195 2.344-.879l4.54-3.32v26.855c0 2.002 1.172 3.37 3.028 3.37Zm25.44-5.322c-4.296 0-7.08-5.127-7.08-13.477 0-8.496 2.735-13.671 7.08-13.671 4.346 0 7.032 5.126 7.032 13.671 0 8.35-2.735 13.477-7.032 13.477Z" />
    </svg>
  )
}

interface VideoOverlayProps {
  isPlaying: boolean
  isLoading: boolean
  hasEnded: boolean
  showControls: boolean
  onTogglePlay: () => void
  onSkip?: (seconds: number) => void
}

export function VideoOverlay({
  isPlaying,
  isLoading,
  hasEnded,
  showControls,
  onTogglePlay,
  onSkip,
}: VideoOverlayProps) {
  if (isLoading) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-full p-4 backdrop-blur-[40px]"
          style={glassStyle}
        >
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </motion.div>
      </div>
    )
  }

  const showOverlay = !isPlaying || showControls || hasEnded

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center gap-10"
        >
          {/* Rewind 10s */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={(e) => {
              e.stopPropagation()
              onSkip?.(-10)
            }}
            className={cn(
              glassClasses,
              "flex h-[50px] w-[50px] items-center justify-center"
            )}
            style={glassStyle}
            aria-label="Rewind 10 seconds"
          >
            <SkipBackward className="h-[22px] w-[22px] text-white" />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePlay()
            }}
            className={cn(
              glassClasses,
              "flex h-20 w-20 items-center justify-center"
            )}
            style={glassStyle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseIcon className="h-8 w-8 text-white" />
            ) : (
              <PlayIcon className="h-8 w-8 text-white" />
            )}
          </motion.button>

          {/* Forward 10s */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={(e) => {
              e.stopPropagation()
              onSkip?.(10)
            }}
            className={cn(
              glassClasses,
              "flex h-[50px] w-[50px] items-center justify-center"
            )}
            style={glassStyle}
            aria-label="Forward 10 seconds"
          >
            <SkipForward className="h-[22px] w-[22px] text-white" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
