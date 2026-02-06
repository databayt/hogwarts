"use client"

import { Loader2, Pause, Play } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

interface VideoOverlayProps {
  isPlaying: boolean
  isLoading: boolean
  hasEnded: boolean
  showControls: boolean
  onTogglePlay: () => void
}

export function VideoOverlay({
  isPlaying,
  isLoading,
  hasEnded,
  showControls,
  onTogglePlay,
}: VideoOverlayProps) {
  // Show loading spinner
  if (isLoading) {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-background/80 rounded-full p-4 backdrop-blur-sm"
        >
          <Loader2 className="text-foreground h-10 w-10 animate-spin" />
        </motion.div>
      </div>
    )
  }

  // Show play/pause overlay when paused or hovering
  const showOverlay = !isPlaying || showControls || hasEnded

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          onClick={onTogglePlay}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "cursor-pointer focus:outline-none"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "rounded-full p-5",
              "bg-background/80 backdrop-blur-sm",
              "border-border/50 border",
              "shadow-lg"
            )}
          >
            {isPlaying ? (
              <Pause className="text-foreground h-12 w-12" />
            ) : (
              <Play className="text-foreground ms-1 h-12 w-12" />
            )}
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
