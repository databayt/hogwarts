"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import { glassButton, glassSurface } from "./glass"
import {
  gobackward10,
  goforward10,
  pauseFill,
  playFill,
  SfSymbol,
} from "./sf-symbols"
import type { VideoPlayerLabels } from "./types"

const glassStyle = glassSurface
const glassClasses = glassButton

interface VideoOverlayProps {
  isPlaying: boolean
  isLoading: boolean
  hasEnded: boolean
  showControls: boolean
  onTogglePlay: () => void
  onSkip?: (seconds: number) => void
  labels?: VideoPlayerLabels
}

export function VideoOverlay({
  isPlaying,
  isLoading,
  hasEnded,
  showControls,
  onTogglePlay,
  onSkip,
  labels,
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
          /* 22px gaps and a 64/92/64 trio on a phone — the reference app's
             own transport row (`public/apple-tv/File.png`); the wide
             player's 40px gaps and 50/80 circles from `sm` up. The glyphs
             are its SF Symbols at the point sizes the capture measures:
             `gobackward.10` 31pt medium, `play.fill` 44pt and `pause.fill`
             51pt medium (IMG_2639.PNG — the two solids are NOT one size). */
          className="absolute inset-0 flex items-center justify-center gap-[22px] sm:gap-10"
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
              "flex size-16 items-center justify-center sm:size-[50px]"
            )}
            style={glassStyle}
            aria-label={labels?.rewind ?? "Rewind 10 seconds"}
          >
            <SfSymbol
              glyph={gobackward10}
              pt={31}
              className="text-white sm:size-[22px]"
            />
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
              "flex size-[92px] items-center justify-center sm:size-20"
            )}
            style={glassStyle}
            aria-label={
              isPlaying ? (labels?.pause ?? "Pause") : (labels?.play ?? "Play")
            }
          >
            {isPlaying ? (
              <SfSymbol
                glyph={pauseFill}
                pt={51}
                className="text-white sm:size-8"
              />
            ) : (
              <SfSymbol
                glyph={playFill}
                pt={44}
                className="text-white sm:size-8"
              />
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
              "flex size-16 items-center justify-center sm:size-[50px]"
            )}
            style={glassStyle}
            aria-label={labels?.forward ?? "Forward 10 seconds"}
          >
            <SfSymbol
              glyph={goforward10}
              pt={31}
              className="text-white sm:size-[22px]"
            />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
