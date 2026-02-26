"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import {
  KEYBOARD_SHORTCUTS,
  PLAYBACK_SPEEDS,
  UP_NEXT_TRIGGER_BEFORE_END,
} from "./constants"
import {
  useAutoHide,
  useThumbnailSeek,
  useVideoPlayer,
  useVideoProgress,
} from "./hooks"
import type { VideoPlayerProps } from "./types"
import { VideoOverlay } from "./video-overlay"
import { VideoProgressBar } from "./video-progress-bar"
import { VideoUpNext } from "./video-up-next"

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

// Apple TV volume icons
function VolumeHighIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M2,16H5.889l5.295,4.332A.5.5,0,0,0,12,19.945V4.055a.5.5,0,0,0-.817-.387L5.889,8H2A1,1,0,0,0,1,9v6A1,1,0,0,0,2,16Z" />
      <path d="M18,12a5.989,5.989,0,0,0-2.287-4.713L14.284,8.716a4,4,0,0,1,0,6.568l1.429,1.429A5.989,5.989,0,0,0,18,12Z" />
      <path d="M23,12a10.974,10.974,0,0,1-3.738,8.262l-1.418-1.418a9,9,0,0,0,0-13.689l1.418-1.418A10.974,10.974,0,0,1,23,12Z" />
    </svg>
  )
}

function VolumeMidIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M2,16H5.889l5.295,4.332A.5.5,0,0,0,12,19.945V4.055a.5.5,0,0,0-.817-.387L5.889,8H2A1,1,0,0,0,1,9v6A1,1,0,0,0,2,16Z" />
      <path d="M18,12a5.989,5.989,0,0,0-2.287-4.713L14.284,8.716a4,4,0,0,1,0,6.568l1.429,1.429A5.989,5.989,0,0,0,18,12Z" />
      <path
        opacity="0.3"
        d="M23,12a10.974,10.974,0,0,1-3.738,8.262l-1.418-1.418a9,9,0,0,0,0-13.689l1.418-1.418A10.974,10.974,0,0,1,23,12Z"
      />
    </svg>
  )
}

function VolumeLowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M2,16H5.889l5.295,4.332A.5.5,0,0,0,12,19.945V4.055a.5.5,0,0,0-.817-.387L5.889,8H2A1,1,0,0,0,1,9v6A1,1,0,0,0,2,16Z" />
      <path
        opacity="0.3"
        d="M18,12a5.989,5.989,0,0,0-2.287-4.713L14.284,8.716a4,4,0,0,1,0,6.568l1.429,1.429A5.989,5.989,0,0,0,18,12Z"
      />
      <path
        opacity="0.3"
        d="M23,12a10.974,10.974,0,0,1-3.738,8.262l-1.418-1.418a9,9,0,0,0,0-13.689l1.418-1.418A10.974,10.974,0,0,1,23,12Z"
      />
    </svg>
  )
}

function VolumeMutedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M5.88889 16.0001H2C1.44772 16.0001 1 15.5524 1 15.0001V9.00007C1 8.44778 1.44772 8.00007 2 8.00007H5.88889L11.1834 3.66821C11.3971 3.49335 11.7121 3.52485 11.887 3.73857C11.9601 3.8279 12 3.93977 12 4.05519V19.9449C12 20.2211 11.7761 20.4449 11.5 20.4449C11.3846 20.4449 11.2727 20.405 11.1834 20.3319L5.88889 16.0001ZM20.4142 12.0001L23.9497 15.5356L22.5355 16.9498L19 13.4143L15.4645 16.9498L14.0503 15.5356L17.5858 12.0001L14.0503 8.46454L15.4645 7.05032L19 10.5859L22.5355 7.05032L23.9497 8.46454L20.4142 12.0001Z" />
    </svg>
  )
}

// Apple TV PiP icon — rounded outer frame with filled mini-player
function PipIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <rect x="12.5" y="12" width="7" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

// Apple TV Share icon — square with upward arrow (SF Symbols style)
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        d="M12 2.5l4 4-1.4 1.4L13 6.3V15h-2V6.3L9.4 7.9 8 6.5l4-4z"
        fill="currentColor"
      />
      <path
        d="M6 10h3v2H6.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5H15v-2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
    </svg>
  )
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z" />
    </svg>
  )
}

function ExitFullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18 7H22V9H16V3H18V7ZM8 9H2V7H6V3H8V9ZM18 17V21H16V15H22V17H18ZM8 15V21H6V17H2V15H8Z" />
    </svg>
  )
}

const topGlassStyle = {
  background: "rgba(20, 20, 20, 0.4)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
}

export function VideoPlayer({
  url,
  title,
  lessonId,
  userId,
  initialPosition = 0,
  posterUrl,
  nextLesson,
  onProgress,
  onComplete,
  onNextLesson,
  className,
  autoPlay = false,
  chapterNumber,
  lessonNumber,
  courseTitle,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTriggeredUpNextRef = useRef(false)
  const hasResumedRef = useRef(false)

  // Volume slider — compact, expands on hover
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Speed menu state
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)

  // Share menu state
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Initialize player state and actions
  const { state, actions } = useVideoPlayer(videoRef)

  // Auto-hide controls
  const { handleMouseMove, handleMouseLeave } = useAutoHide({
    isPlaying: state.isPlaying,
    showControls: actions.showControls,
    hideControls: actions.hideControls,
  })

  // Progress tracking (resume functionality)
  const { getResumePosition, onPause } = useVideoProgress({
    lessonId,
    duration: state.duration,
    currentTime: state.currentTime,
    isPlaying: state.isPlaying,
    onSaveProgress: onProgress
      ? (watchedSeconds, totalSeconds) => {
          onProgress({
            currentTime: watchedSeconds,
            duration: totalSeconds,
            percentage: (watchedSeconds / totalSeconds) * 100,
            watchedSeconds,
          })
        }
      : undefined,
  })

  // Thumbnail generation
  const { generateThumbnail } = useThumbnailSeek({
    videoRef,
    enabled: !url.includes("youtube") && !url.includes("vimeo"),
  })

  // Handle resume on load
  useEffect(() => {
    if (!videoRef.current || hasResumedRef.current || state.duration <= 0)
      return

    const resumePos =
      initialPosition > 0 ? initialPosition : getResumePosition()
    if (resumePos > 0) {
      videoRef.current.currentTime = resumePos
      hasResumedRef.current = true
    }
  }, [state.duration, initialPosition, getResumePosition])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      actions.updateTime(video.currentTime)

      // Check for Up Next trigger
      if (
        nextLesson &&
        !hasTriggeredUpNextRef.current &&
        state.duration > 0 &&
        video.currentTime >= state.duration - UP_NEXT_TRIGGER_BEFORE_END
      ) {
        hasTriggeredUpNextRef.current = true
        actions.showUpNext()
      }
    }

    const handleLoadedMetadata = () => {
      actions.updateDuration(video.duration)
      actions.setLoading(false)
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        actions.updateBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }

    const handlePlay = () => actions.play()
    const handlePause = () => {
      actions.pause()
      onPause()
    }

    const handleWaiting = () => actions.setLoading(true)
    const handleCanPlay = () => actions.setLoading(false)

    const handleEnded = () => {
      actions.onVideoEnded()
      onComplete?.()

      // Show Up Next if not already shown
      if (nextLesson && !state.showUpNext) {
        actions.showUpNext()
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("ended", handleEnded)
    }
  }, [
    actions,
    nextLesson,
    onComplete,
    onPause,
    state.duration,
    state.showUpNext,
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const action =
        KEYBOARD_SHORTCUTS[e.key as keyof typeof KEYBOARD_SHORTCUTS]
      if (!action) return

      e.preventDefault()

      switch (action) {
        case "togglePlay":
          actions.togglePlay()
          break
        case "toggleMute":
          actions.toggleMute()
          break
        case "toggleFullscreen":
          actions.toggleFullscreen(containerRef)
          break
        case "seekBackward5":
          actions.skipBackwardSmall()
          break
        case "seekForward5":
          actions.skipForwardSmall()
          break
        case "seekBackward10":
          actions.skipBackward()
          break
        case "seekForward10":
          actions.skipForward()
          break
        case "volumeUp":
          actions.volumeUp()
          break
        case "volumeDown":
          actions.volumeDown()
          break
        case "escape":
          if (state.showUpNext) {
            actions.cancelUpNext()
          } else if (state.isFullscreen) {
            document.exitFullscreen()
          }
          break
        case "seekTo0":
        case "seekTo10":
        case "seekTo20":
        case "seekTo30":
        case "seekTo40":
        case "seekTo50":
        case "seekTo60":
        case "seekTo70":
        case "seekTo80":
        case "seekTo90":
          const percent = parseInt(action.replace("seekTo", ""))
          actions.seekToPercent(percent)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [actions, state.showUpNext, state.isFullscreen])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      actions.toggleFullscreen(containerRef)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [actions])

  // Seek handlers
  const handleSeek = useCallback(
    (time: number) => {
      actions.seek(time)
    },
    [actions]
  )

  const handleSeekStart = useCallback(
    (position: number) => {
      actions.startSeeking(position)
    },
    [actions]
  )

  const handleSeekMove = useCallback(
    async (position: number) => {
      const time = (position / 100) * state.duration
      const thumbnail = await generateThumbnail(time)
      actions.updateSeekPosition(position, thumbnail ?? undefined)
    },
    [actions, state.duration, generateThumbnail]
  )

  const handleSeekEnd = useCallback(() => {
    actions.endSeeking()
  }, [actions])

  // Play next handler
  const handlePlayNext = useCallback(() => {
    actions.hideUpNext()
    onNextLesson?.()
  }, [actions, onNextLesson])

  const handleCancelUpNext = useCallback(() => {
    actions.cancelUpNext()
  }, [actions])

  // Volume hover handlers — expand slider on hover, collapse on leave
  const handleVolumeEnter = useCallback(() => {
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeLeave = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 600)
  }, [])

  // Volume icon selection — matches original 4-level thresholds
  const VolumeIcon = state.isMuted
    ? VolumeMutedIcon
    : state.volume <= 0
      ? VolumeMutedIcon
      : state.volume <= 20
        ? VolumeLowIcon
        : state.volume <= 60
          ? VolumeMidIcon
          : VolumeHighIcon

  // Info label parts
  const infoSubtitle =
    chapterNumber != null && lessonNumber != null
      ? `C${chapterNumber} L${lessonNumber}${courseTitle ? ` ${courseTitle}` : ""}`
      : null
  const infoTitle = title || null

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden",
        "bg-black",
        state.isFullscreen && "fixed inset-0 z-50",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full"
        preload="metadata"
        poster={posterUrl || undefined}
        autoPlay={autoPlay}
        playsInline
        onClick={actions.togglePlay}
        aria-label={title}
      />

      {/* Center overlay (play/pause, loading) */}
      <VideoOverlay
        isPlaying={state.isPlaying}
        isLoading={state.isLoading}
        hasEnded={state.hasEnded}
        showControls={state.showControls}
        onTogglePlay={actions.togglePlay}
        onSkip={actions.skip}
      />

      {/* Top-left controls: PiP + Share */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute start-4 top-4 z-10 flex items-center gap-1.5"
          >
            {/* PiP */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (
                  videoRef.current &&
                  document.pictureInPictureEnabled &&
                  !document.pictureInPictureElement
                ) {
                  videoRef.current.requestPictureInPicture()
                } else if (document.pictureInPictureElement) {
                  document.exitPictureInPicture()
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-[40px] transition-all hover:bg-[rgba(40,40,40,0.6)]"
              style={topGlassStyle}
              aria-label="Picture in Picture"
            >
              <PipIcon className="h-3.5 w-3.5 text-white" />
            </button>

            {/* Share */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowShareMenu((prev) => !prev)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-[40px] transition-all hover:bg-[rgba(40,40,40,0.6)]"
                style={topGlassStyle}
                aria-label="Share"
              >
                <ShareIcon className="h-3.5 w-3.5 text-white" />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute start-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl bg-white/95 shadow-xl backdrop-blur-xl dark:bg-neutral-800/95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header — thumbnail + title */}
                    <div className="flex items-center gap-2.5 px-3 py-2.5">
                      {posterUrl && (
                        <img
                          src={posterUrl}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
                          {title}
                        </p>
                        <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                          {courseTitle}
                          {chapterNumber != null
                            ? ` · C${chapterNumber}, L${lessonNumber}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-white/10" />

                    {/* Share actions */}
                    {[
                      {
                        icon: "🔗",
                        label: "Copy Link",
                        action: () => {
                          navigator.clipboard.writeText(window.location.href)
                          setShowShareMenu(false)
                        },
                      },
                      { icon: "📨", label: "AirDrop" },
                      { icon: "💬", label: "Messages" },
                      { icon: "📝", label: "Notes" },
                      { icon: "📋", label: "Reminders" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={(e) => {
                          e.stopPropagation()
                          item.action?.()
                          if (!item.action) setShowShareMenu(false)
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-1.5 text-start text-xs text-gray-800 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
                      >
                        <span className="text-sm">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right controls: volume slider + icon */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute end-4 top-4 z-10 flex items-center gap-1"
          >
            {/* Volume — compact: icon only, slider expands on hover */}
            <div
              className="flex items-center overflow-hidden rounded-full backdrop-blur-[40px] transition-all duration-300"
              style={topGlassStyle}
              onMouseEnter={handleVolumeEnter}
              onMouseLeave={handleVolumeLeave}
            >
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  width: showVolumeSlider ? 80 : 0,
                  opacity: showVolumeSlider ? 1 : 0,
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={state.isMuted ? 0 : state.volume}
                  onChange={(e) => actions.setVolume(Number(e.target.value))}
                  className="ms-3 h-[3px] w-[68px] cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.9) ${state.isMuted ? 0 : state.volume}%, rgba(255,255,255,0.3) ${state.isMuted ? 0 : state.volume}%)`,
                  }}
                  aria-label="Volume"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  actions.toggleMute()
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center transition-opacity hover:opacity-80"
                aria-label={state.isMuted ? "Unmute" : "Mute"}
              >
                <VolumeIcon className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls: info label + progress bar + time */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute inset-x-0 bottom-0",
              "bg-gradient-to-t from-black/80 to-transparent",
              "px-4 pt-16 pb-4"
            )}
          >
            {/* Info label above progress — left-aligned, two lines */}
            {(infoSubtitle || infoTitle) && (
              <div className="mb-2 flex flex-col">
                {infoSubtitle && (
                  <span className="text-xs text-white">{infoSubtitle}</span>
                )}
                {infoTitle && (
                  <span className="text-base font-semibold text-white">
                    {infoTitle}
                  </span>
                )}
              </div>
            )}

            {/* Time + Progress bar row */}
            <div className="flex items-center gap-3">
              <span className="min-w-[40px] shrink-0 font-mono text-xs text-white/80 tabular-nums">
                {formatTime(state.currentTime)}
              </span>

              <div className="flex-1">
                <VideoProgressBar
                  currentTime={state.currentTime}
                  duration={state.duration}
                  bufferedEnd={state.bufferedEnd}
                  isSeeking={state.isSeeking}
                  seekPosition={state.seekPosition}
                  thumbnailUrl={state.thumbnailUrl}
                  thumbnailTime={state.thumbnailTime}
                  onSeek={handleSeek}
                  onSeekStart={handleSeekStart}
                  onSeekMove={handleSeekMove}
                  onSeekEnd={handleSeekEnd}
                />
              </div>

              <span className="min-w-[40px] shrink-0 text-end font-mono text-xs text-white/80 tabular-nums">
                {formatTime(state.duration)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Up Next overlay */}
      <AnimatePresence>
        {state.showUpNext && nextLesson && (
          <VideoUpNext
            nextLesson={nextLesson}
            countdown={state.upNextCountdown}
            onPlayNext={handlePlayNext}
            onCancel={handleCancelUpNext}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
