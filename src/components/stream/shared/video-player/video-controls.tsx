"use client"

import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"

import { PLAYBACK_SPEEDS } from "./constants"
import type { ControlsProps } from "./types"

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

// Animated button wrapper
function ControlButton({
  children,
  onClick,
  ariaLabel,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  ariaLabel: string
  className?: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "text-foreground hover:bg-accent/50",
          "focus-visible:ring-ring focus-visible:ring-2",
          className
        )}
      >
        {children}
      </Button>
    </motion.div>
  )
}

export function VideoControls({
  isPlaying,
  isMuted,
  volume,
  playbackRate,
  currentTime,
  duration,
  isFullscreen,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSkip,
  onPlaybackRateChange,
  onToggleFullscreen,
}: ControlsProps) {
  const VolumeIcon =
    isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      {/* Left controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Play/Pause */}
        <ControlButton
          onClick={onTogglePlay}
          ariaLabel={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </ControlButton>

        {/* Skip backward */}
        <ControlButton
          onClick={() => onSkip(-10)}
          ariaLabel="Rewind 10 seconds"
        >
          <SkipBack className="h-5 w-5" />
        </ControlButton>

        {/* Skip forward */}
        <ControlButton
          onClick={() => onSkip(10)}
          ariaLabel="Forward 10 seconds"
        >
          <SkipForward className="h-5 w-5" />
        </ControlButton>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <ControlButton
            onClick={onToggleMute}
            ariaLabel={isMuted ? "Unmute" : "Mute"}
          >
            <VolumeIcon className="h-5 w-5" />
          </ControlButton>

          <div className="hidden w-20 sm:block">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(value) => onVolumeChange(value[0])}
              aria-label="Volume"
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Time display */}
        <div className="text-foreground ml-2 font-mono text-sm tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-muted-foreground">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Playback speed */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-accent/50 font-mono text-xs"
                aria-label="Playback speed"
              >
                {playbackRate}x
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-background/95 backdrop-blur-sm"
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <DropdownMenuItem
                key={speed}
                onClick={() => onPlaybackRateChange(speed)}
                className={cn(
                  "cursor-pointer",
                  playbackRate === speed && "bg-accent"
                )}
              >
                {speed}x
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-accent/50"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-background/95 backdrop-blur-sm"
          >
            <DropdownMenuItem className="text-muted-foreground text-xs">
              Quality: Auto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Fullscreen */}
        <ControlButton
          onClick={onToggleFullscreen}
          ariaLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="h-5 w-5" />
          ) : (
            <Maximize className="h-5 w-5" />
          )}
        </ControlButton>
      </div>
    </div>
  )
}
