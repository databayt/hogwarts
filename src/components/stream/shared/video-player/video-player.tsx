"use client"

import { useCallback, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import { KEYBOARD_SHORTCUTS, UP_NEXT_TRIGGER_BEFORE_END } from "./constants"
import {
  useAutoHide,
  useThumbnailSeek,
  useVideoPlayer,
  useVideoProgress,
} from "./hooks"
import type { VideoPlayerProps } from "./types"
import { VideoControls } from "./video-controls"
import { VideoOverlay } from "./video-overlay"
import { VideoProgressBar } from "./video-progress-bar"
import { VideoUpNext } from "./video-up-next"

export function VideoPlayer({
  url,
  title,
  lessonId,
  userId,
  initialPosition = 0,
  nextLesson,
  onProgress,
  onComplete,
  onNextLesson,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTriggeredUpNextRef = useRef(false)
  const hasResumedRef = useRef(false)

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

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-lg",
        "bg-background",
        state.isFullscreen && "fixed inset-0 z-50 rounded-none",
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
      />

      {/* Title bar */}
      <AnimatePresence>
        {title && state.showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute top-0 right-0 left-0",
              "from-background/80 bg-gradient-to-b to-transparent",
              "p-4"
            )}
          >
            <h3 className="text-foreground text-lg font-semibold">{title}</h3>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute right-0 bottom-0 left-0",
              "from-background/90 bg-gradient-to-t to-transparent",
              "p-4 pt-12"
            )}
          >
            {/* Progress bar */}
            <div className="mb-3">
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

            {/* Control buttons */}
            <VideoControls
              isPlaying={state.isPlaying}
              isMuted={state.isMuted}
              volume={state.volume}
              playbackRate={state.playbackRate}
              currentTime={state.currentTime}
              duration={state.duration}
              isFullscreen={state.isFullscreen}
              onTogglePlay={actions.togglePlay}
              onToggleMute={actions.toggleMute}
              onVolumeChange={actions.setVolume}
              onSkip={actions.skip}
              onPlaybackRateChange={actions.setPlaybackRate}
              onToggleFullscreen={() => actions.toggleFullscreen(containerRef)}
            />
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
