"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronRight, Gauge, MoreHorizontal, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

import {
  KEYBOARD_SHORTCUTS,
  PLAYBACK_SPEEDS,
  UP_NEXT_TRIGGER_BEFORE_END,
} from "./constants"
import { glassButton, glassPill, glassScrim, glassSurface } from "./glass"
import {
  useAutoHide,
  useMediaSession,
  useThumbnailSeek,
  useVideoPlayer,
  useVideoProgress,
  useVideoProtection,
} from "./hooks"
import type { VideoPlayerProps } from "./types"
import { VideoOverlay } from "./video-overlay"
import { VideoProgressBar } from "./video-progress-bar"
import { VideoUpNext } from "./video-up-next"

/**
 * The phone layout's clock: hours always, minutes and seconds always two
 * digits — `0:00:57`, the reference app's own format
 * (`public/apple-tv/File.png`). The pair of them sits either side of the
 * scrubber and counts while it plays, so a width that changes at the hour
 * would shift the bar under the reader's thumb.
 */
function formatClock(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00:00"
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * The phone menus' card and row, measured off the reference app's own
 * (`public/apple-tv/IMG_2639.PNG` for the settings card,
 * `IMG_2640.PNG` for the share card — both 1170×2532, so ÷ 3):
 * 250px wide whichever menu it is, 10px of vertical padding, and a corner
 * that fits a 32px radius across four samples of its profile.
 *
 * The ground is the reference's own #121212 rather than the player's pills:
 * a list of text has to survive whatever frame is behind it, so the blur
 * here is cosmetic and the fill does the work. Rows are 42px with an 18px
 * icon 32px in, a 17px label, and the trailing mark 28px from the far edge.
 */
const phoneMenuCard =
  "w-[250px] rounded-[32px] bg-[#121212]/95 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-[40px]"
const phoneMenuRow =
  "flex h-[42px] w-full items-center gap-4 ps-8 pe-7 text-start text-[17px] text-white"

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

const topGlassStyle = glassSurface

/**
 * A source served through our own authorizing route rather than a public URL.
 * Two things follow from it: the clip is school content that must keep its
 * watermark (so no PiP/casting), and its signed URL expires, so a load error
 * is usually routine rather than fatal.
 */
const PROTECTED_URL_PREFIX = "/api/lumos/"

/** One silent re-mint per source; beyond that the error is real. */
const MAX_SOURCE_RETRIES = 1

export function VideoPlayer({
  url,
  title,
  lessonId,
  initialPosition = 0,
  posterUrl,
  nextLesson,
  onProgress,
  onComplete,
  onNextLesson,
  onSourceError,
  className,
  autoPlay = false,
  startFullscreen = false,
  onFullscreenChange,
  chapterNumber,
  lessonNumber,
  courseTitle,
  courseHref,
  labels,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTriggeredUpNextRef = useRef(false)
  const hasResumedRef = useRef(false)

  // Protected sources carry a watermark that PiP and casting would strip, and
  // a signed URL that eventually expires. Both behaviours key off this.
  const isProtected = url.startsWith(PROTECTED_URL_PREFIX)

  // Cache-busting counter for re-minting an expired signed URL. Bumping it
  // changes the <video> src, so the browser re-requests our route and gets a
  // fresh signature instead of replaying the dead one.
  const [sourceAttempt, setSourceAttempt] = useState(0)
  const retriesRef = useRef(0)
  const playbackUrl =
    isProtected && sourceAttempt > 0
      ? `${url}${url.includes("?") ? "&" : "?"}r=${sourceAttempt}`
      : url

  // A new source resets the retry budget.
  useEffect(() => {
    retriesRef.current = 0
    setSourceAttempt(0)
  }, [url])

  // Where the viewer was when the source died, so the re-mint resumes there
  // instead of throwing them back to 0:00.
  const resumeAfterRetryRef = useRef<number | null>(null)

  /**
   * A protected source failing usually just means its signed URL aged out
   * mid-session — re-request once before treating it as a broken video, so a
   * long pause doesn't strand the viewer on an error state.
   */
  const handleSourceError = useCallback(() => {
    if (isProtected && retriesRef.current < MAX_SOURCE_RETRIES) {
      retriesRef.current += 1
      resumeAfterRetryRef.current = videoRef.current?.currentTime ?? null
      setSourceAttempt((n) => n + 1)
      return
    }
    onSourceError?.()
  }, [isProtected, onSourceError])

  // Re-mint: force the element through its load algorithm on the new URL and
  // put the viewer back where they were.
  useEffect(() => {
    if (sourceAttempt === 0) return
    const video = videoRef.current
    if (!video) return

    video.load()

    const restore = () => {
      const at = resumeAfterRetryRef.current
      if (at != null && Number.isFinite(at) && at > 0) {
        video.currentTime = at
      }
      resumeAfterRetryRef.current = null
    }
    video.addEventListener("loadedmetadata", restore, { once: true })
    return () => video.removeEventListener("loadedmetadata", restore)
  }, [sourceAttempt])

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
    // An open menu holds the chrome up. A phone has no mouse to keep
    // resetting the timer, so a seven-row card used to disappear out from
    // under whoever was reading it three seconds in.
    hold: showSpeedMenu || showShareMenu,
  })

  // Stable adapter so the progress hook's syncToServer/flushProgress (which
  // list onSaveProgress in their deps) aren't recreated every render. onProgress
  // is itself a useCallback from the parent, so this stays stable per lesson.
  const handleSaveProgress = useCallback(
    (watchedSeconds: number, totalSeconds: number) => {
      if (!onProgress) return
      onProgress({
        currentTime: watchedSeconds,
        duration: totalSeconds,
        percentage: (watchedSeconds / totalSeconds) * 100,
        watchedSeconds,
      })
    },
    [onProgress]
  )

  // Progress tracking (resume functionality)
  const { getResumePosition, onPause } = useVideoProgress({
    lessonId,
    duration: state.duration,
    currentTime: state.currentTime,
    isPlaying: state.isPlaying,
    onSaveProgress: onProgress ? handleSaveProgress : undefined,
  })

  // Media Session API (PiP controls: skip, progress bar)
  useMediaSession({
    videoRef,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    playbackRate: state.playbackRate,
  })

  // Thumbnail generation
  const { generateThumbnail } = useThumbnailSeek({
    videoRef,
    enabled: !url.includes("youtube") && !url.includes("vimeo"),
  })

  // Video protection (anti-download, anti-screenshot)
  useVideoProtection({
    containerRef,
    videoRef,
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
          } else if (document.fullscreenElement) {
            // The listener below writes the state once the browser is out.
            void document.exitFullscreen().catch(() => {})
          } else if (state.isFullscreen) {
            // The CSS fallback layer — no native element, so no event.
            actions.setFullscreen(false)
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

  // Fullscreen change listener — SYNC the mirror, never toggle it.
  //
  // This used to call `toggleFullscreen`, which turned every entry into an
  // immediate exit: the request resolved, the browser fired this event, and
  // the toggle read the fullscreen it had just been given and undid it. Esc
  // then hit the other branch and asked for fullscreen back with no user
  // gesture, so the promise rejected and the mirror stuck at `true`.
  useEffect(() => {
    const handleFullscreenChange = () => {
      actions.setFullscreen(document.fullscreenElement === containerRef.current)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [actions])

  // Open into fullscreen when the caller asked for it. The player mounts in
  // response to the Play click, and React flushes this effect inside that
  // discrete event, so the request still carries the activation the browser
  // wants. `toggleFullscreen` owns the iOS/refusal fallback.
  const hasAutoFullscreenedRef = useRef(false)
  useEffect(() => {
    if (!startFullscreen || hasAutoFullscreenedRef.current) return
    hasAutoFullscreenedRef.current = true
    actions.toggleFullscreen(containerRef)
  }, [startFullscreen, actions])

  // Tell the caller which side of fullscreen we are on — but only on a real
  // change. Reporting the initial `false` would hand the lesson page a "the
  // viewer left" it never entered, and it would tear this player down on the
  // frame it mounted.
  const wasFullscreenRef = useRef(state.isFullscreen)
  useEffect(() => {
    if (wasFullscreenRef.current === state.isFullscreen) return
    wasFullscreenRef.current = state.isFullscreen
    // Flush the watched position on the way OUT, before the caller hears
    // about it: the caller is likely to put its poster back and tear this
    // player down, and losing the last stretch is the difference between the
    // page reopening on a "continue watching" pill and reopening on a bare
    // Play.
    //
    // `onPause()` is called DIRECTLY rather than left to the pause handler.
    // `.pause()` only queues the `pause` event as a media-element task, and
    // the caller's unmount tears the listener off in the same tick — a race
    // Chromium happens to lose gracefully, but not one worth standing on. A
    // double flush is harmless (it clears its own debounce); a missed one is
    // not.
    if (!state.isFullscreen) {
      videoRef.current?.pause()
      onPause()
    }
    onFullscreenChange?.(state.isFullscreen)
  }, [state.isFullscreen, onFullscreenChange, onPause, videoRef])

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

  /**
   * Hand a URL to the OS share sheet — the reference app's own second step
   * (`public/apple-tv/IMG_2641.PNG`), and the only share surface a phone
   * actually has. Copying the link is the fallback where `navigator.share`
   * is absent, which is most desktop browsers.
   */
  const shareUrl = useCallback(
    (url: string) => {
      setShowShareMenu(false)
      if (navigator.share) {
        void navigator.share({ title: title ?? "", url }).catch(() => {})
      } else {
        void navigator.clipboard?.writeText(url).catch(() => {})
      }
    },
    [title]
  )

  // Play next handler
  const handlePlayNext = useCallback(() => {
    actions.hideUpNext()
    onNextLesson?.()
  }, [actions, onNextLesson])

  const handleCancelUpNext = useCallback(() => {
    actions.cancelUpNext()
  }, [actions])

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

  // Info label parts. chapterShort/lessonShort are reused from
  // `lumos.lesson.*` (already fixed once in dashboard/lesson/content.tsx) —
  // NOT a new player-owned key, per the dictionary reuse convention.
  const chapterShort = labels?.chapterShort ?? "C"
  const lessonShort = labels?.lessonShort ?? "L"
  const infoSubtitle =
    chapterNumber != null && lessonNumber != null
      ? `${chapterShort}${chapterNumber} ${lessonShort}${lessonNumber}${courseTitle ? ` ${courseTitle}` : ""}`
      : null
  const infoTitle = title || null

  return (
    <div
      ref={containerRef}
      data-video-protected
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
        src={playbackUrl}
        className="h-full w-full"
        // A poster is the IDLE state's picture. Pressing Play is a request to
        // watch, not to look at the artwork again: with one set, the browser
        // holds the poster until the first frame is decoded, so opening
        // fullscreen from the lesson's Play pill flashed the lesson thumbnail
        // over the whole screen first. So the poster is drawn only when this
        // player is NOT starting itself, and an autoplaying one preloads the
        // media rather than just its metadata — the overlay's spinner covers
        // the buffer over black, which is what a player looks like while it
        // opens.
        preload={autoPlay ? "auto" : "metadata"}
        poster={autoPlay ? undefined : posterUrl || undefined}
        autoPlay={autoPlay}
        playsInline
        onClick={actions.togglePlay}
        onError={handleSourceError}
        aria-label={title}
        controlsList="nodownload"
        // PiP and casting hand the raw element to the OS, out of reach of
        // anything this player does about capture. Kept off for protected
        // sources.
        disablePictureInPicture={isProtected}
        disableRemotePlayback={isProtected}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* PrintScreen mitigation: the protection hook stamps this attribute for 1.5s */}
      <style>{`[data-capture-blank] video { visibility: hidden; }`}</style>

      {/* Center overlay (play/pause, loading) */}
      <VideoOverlay
        isPlaying={state.isPlaying}
        isLoading={state.isLoading}
        hasEnded={state.hasEnded}
        showControls={state.showControls}
        onTogglePlay={actions.togglePlay}
        onSkip={actions.skip}
        labels={labels}
      />

      {/* Top-left controls: PiP + Share */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            /* Wide layout only — the phone chrome below is its own block. */
            className="absolute start-4 top-4 z-10 hidden items-center gap-1.5 sm:flex"
          >
            {/* PiP + Share — single pill */}
            <div
              className="flex items-center rounded-full px-1.5 backdrop-blur-[40px]"
              style={topGlassStyle}
            >
              {/* PiP pops the bare <video> out of the page, leaving the
                  watermark overlay behind — so it is not offered on protected
                  school content. External clips (YouTube/Vimeo) keep it. */}
              {!isProtected && (
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
                  className="flex h-7 w-6 items-center justify-center transition-opacity hover:opacity-70"
                  aria-label={labels?.pictureInPicture ?? "Picture in Picture"}
                >
                  <PipIcon className="h-3.5 w-3.5 text-white" />
                </button>
              )}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowShareMenu((prev) => !prev)
                  }}
                  className="flex h-7 w-6 items-center justify-center transition-opacity hover:opacity-70"
                  aria-label={labels?.share ?? "Share"}
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
                              ? ` · ${chapterShort}${chapterNumber}, ${lessonShort}${lessonNumber}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-gray-200 dark:bg-white/10" />

                      {/* Share actions */}
                      {[
                        {
                          icon: "🔗",
                          label: labels?.copyLink ?? "Copy Link",
                          action: () => {
                            navigator.clipboard.writeText(window.location.href)
                            setShowShareMenu(false)
                          },
                        },
                        { icon: "📨", label: labels?.airdrop ?? "AirDrop" },
                        { icon: "💬", label: labels?.messages ?? "Messages" },
                        { icon: "📝", label: labels?.notes ?? "Notes" },
                        {
                          icon: "📋",
                          label: labels?.reminders ?? "Reminders",
                        },
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
            className="absolute end-4 top-4 z-10 hidden items-center gap-1 sm:flex"
          >
            {/* Playback speed — a real control: sets video.playbackRate. The
                menu state existed for months with nothing rendering it. */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSpeedMenu((v) => !v)
                }}
                className="flex items-center rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-[40px] transition-opacity hover:opacity-80"
                style={topGlassStyle}
                aria-haspopup="menu"
                aria-expanded={showSpeedMenu}
                aria-label={labels?.speed ?? "Playback speed"}
              >
                {state.playbackRate}×
              </button>
              {showSpeedMenu && (
                <div
                  role="menu"
                  className="absolute end-0 top-full z-20 mt-1 min-w-[5.5rem] overflow-hidden rounded-xl border border-white/10 bg-black/80 py-1 backdrop-blur-[40px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {PLAYBACK_SPEEDS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      role="menuitemradio"
                      aria-checked={state.playbackRate === rate}
                      onClick={() => {
                        actions.setPlaybackRate(rate)
                        setShowSpeedMenu(false)
                      }}
                      className={
                        "flex w-full items-center justify-between px-3 py-1.5 text-start text-xs text-white transition-colors hover:bg-white/10 " +
                        (state.playbackRate === rate ? "font-semibold" : "")
                      }
                    >
                      <span>{rate}×</span>
                      {state.playbackRate === rate && (
                        <span aria-hidden>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume — always-visible horizontal pill */}
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-[40px]"
              style={topGlassStyle}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={state.isMuted ? 0 : state.volume}
                onChange={(e) => actions.setVolume(Number(e.target.value))}
                // The filled part of the track is painted by a hard-stop
                // gradient, and a gradient has no logical direction — while a
                // native range input DOES mirror itself under `dir="rtl"`, so
                // one written `to right` fills the end furthest from the thumb
                // in Arabic. The level rides in a custom property and the two
                // directions are two classes, which keeps it correct on the
                // server render as well.
                className="h-[3px] w-20 cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#ffffffe6_var(--volume-level),#ffffff4d_var(--volume-level))] rtl:bg-[linear-gradient(to_left,#ffffffe6_var(--volume-level),#ffffff4d_var(--volume-level))] [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={
                  {
                    "--volume-level": `${state.isMuted ? 0 : state.volume}%`,
                  } as React.CSSProperties
                }
                aria-label={labels?.volume ?? "Volume"}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  actions.toggleMute()
                }}
                className="flex shrink-0 items-center justify-center transition-opacity hover:opacity-80"
                aria-label={
                  state.isMuted
                    ? (labels?.unmute ?? "Unmute")
                    : (labels?.mute ?? "Mute")
                }
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
              "absolute inset-x-0 bottom-0 hidden sm:block",
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

      {/* Phone chrome — the reference app's own phone player, measured off
          `public/apple-tv/File.png`. That capture is 1170×2532 (a 3x iPhone
          shot), so every number here is the capture ÷ 3 against a 390px
          viewport: 44px round controls 21px in from each side, a 163px
          three-slot pill between them, and a bottom block of title →
          scrubber → capsules. The transport row in the middle is
          `VideoOverlay`, which carries the same measurements at its own
          breakpoint.

          A separate block rather than `sm:` variants threaded through the
          wide chrome above: the two layouts share almost no geometry, and
          the wide player is what every other surface of this app is measured
          against — it should read as untouched here.

          `pointer-events-none` on the frame is load-bearing. This block is
          `inset-0` and sits OVER the transport row, so without it the play
          button would stop responding; each row turns pointer events back
          on for itself. */}
      <AnimatePresence>
        {state.showControls && !state.showUpNext && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-10 sm:hidden"
          >
            {/* An open menu is modal: without this, a tap meant for "anywhere
                else" lands on the <video> underneath, toggles playback, and
                leaves the card standing. A phone has no Escape key and no
                second click of a mouse. */}
            {(showSpeedMenu || showShareMenu) && (
              <div
                role="presentation"
                className="pointer-events-auto absolute inset-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSpeedMenu(false)
                  setShowShareMenu(false)
                }}
              />
            )}

            {/* Top row: close · PiP/share pill · volume. The reference's 47px
                top inset is the iOS status bar, which a fullscreen browser
                hides — so the safe-area inset stands in for it where a device
                reports one, and 12px carries it where none exists. */}
            <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-3 px-[21px] pt-[max(0.75rem,env(safe-area-inset-top))]">
              {/* Exits fullscreen, which is how the lesson page gets its
                  poster back (`onFullscreenChange`). Only drawn IN
                  fullscreen: inline in the page's 4:5 box — where an
                  instructor switch leaves it — an X closes nothing. */}
              {state.isFullscreen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    actions.toggleFullscreen(containerRef)
                  }}
                  className={cn(
                    glassButton,
                    "flex size-11 shrink-0 items-center justify-center"
                  )}
                  style={glassSurface}
                  aria-label={labels?.close ?? "Close"}
                >
                  <X className="size-4 text-white" strokeWidth={2.5} />
                </button>
              )}

              {/* The reference's three 54px slots are PiP · AirPlay · Share.
                  AirPlay has nothing to bind to here — remote playback is
                  disabled on protected sources precisely because it hands the
                  bare <video> to the OS, watermark and all — so the pill keeps
                  the slot geometry and carries the controls that exist. */}
              <div
                className={cn(glassPill, "flex h-11 items-center")}
                style={glassSurface}
              >
                {!isProtected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (
                        videoRef.current &&
                        document.pictureInPictureEnabled &&
                        !document.pictureInPictureElement
                      ) {
                        void videoRef.current.requestPictureInPicture()
                      } else if (document.pictureInPictureElement) {
                        void document.exitPictureInPicture()
                      }
                    }}
                    className="flex h-11 w-[54px] items-center justify-center transition-opacity active:opacity-60"
                    aria-label={labels?.pictureInPicture ?? "Picture in Picture"}
                  >
                    <PipIcon className="size-5 text-white" />
                  </button>
                )}
                {/* Two scopes before the OS sheet, the way the reference's own
                    share icon opens "Share Episode / Share Show"
                    (`IMG_2640.PNG`): this lesson, or the course it belongs
                    to. The sheet itself comes next (`IMG_2641.PNG`) — the
                    wide player's five-row menu never had more than one live
                    action in it. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowSpeedMenu(false)
                    if (courseHref) setShowShareMenu((v) => !v)
                    else shareUrl(window.location.href)
                  }}
                  className="flex h-11 w-[54px] items-center justify-center transition-opacity active:opacity-60"
                  aria-label={labels?.share ?? "Share"}
                  aria-haspopup={courseHref ? "menu" : undefined}
                  aria-expanded={courseHref ? showShareMenu : undefined}
                >
                  <ShareIcon className="size-5 text-white" />
                </button>
              </div>

              {/* The reference's speaker circle — a mute toggle, not a
                  slider. iOS ignores `video.volume` outright and leaves the
                  level to the hardware buttons, so a slider would be dead
                  on the one device this layout is for. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  actions.toggleMute()
                }}
                className={cn(
                  glassButton,
                  "ms-auto flex size-11 shrink-0 items-center justify-center"
                )}
                style={glassSurface}
                aria-label={
                  state.isMuted
                    ? (labels?.unmute ?? "Unmute")
                    : (labels?.mute ?? "Mute")
                }
              >
                <VolumeIcon className="size-5 text-white" />
              </button>

              {/* Anchored the way the reference anchors it: the card COVERS
                  the pill and the X rather than dropping below them — its top
                  is the row's own top and it sits 8px in from the screen edge
                  (`IMG_2640.PNG`, card at x 8, y 47, where 47 is that
                  capture's status bar and 12px is ours). */}
              {showShareMenu && courseHref && (
                <div
                  role="menu"
                  className={cn(
                    phoneMenuCard,
                    "absolute start-2 top-3 z-20 overflow-hidden"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {[
                    {
                      label: labels?.shareLesson ?? "Share lesson",
                      url: window.location.href,
                    },
                    {
                      label: labels?.shareCourse ?? "Share course",
                      url: new URL(courseHref, window.location.origin).href,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => shareUrl(item.url)}
                      className={cn(
                        phoneMenuRow,
                        "transition-colors active:bg-white/10"
                      )}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      <ChevronRight className="size-[18px] shrink-0 text-white/40 rtl:rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom block. The reference's own rhythm: the two title lines
                and the "…" share one 44px band, 15px down to the scrubber
                row, 13px down to the capsules, and the home indicator's
                inset below that. */}
            <div
              className={cn(
                "pointer-events-auto absolute inset-x-0 bottom-0",
                glassScrim,
                "px-[21px] pt-24 pb-[max(1rem,env(safe-area-inset-bottom))]"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {infoSubtitle && (
                    <p className="truncate text-[15px] leading-none text-white/85">
                      {infoSubtitle}
                    </p>
                  )}
                  {infoTitle && (
                    <p className="mt-1 truncate text-2xl leading-none font-bold text-white">
                      {infoTitle}
                    </p>
                  )}
                </div>

                {/* The reference's "…". It carries the speed control, which
                    has no room of its own here — and it opens UPWARD: the
                    button sits a hundred-odd pixels off the bottom of the
                    screen, where the wide player's downward menu would be
                    cut in half. */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowShareMenu(false)
                      setShowSpeedMenu((v) => !v)
                    }}
                    className={cn(
                      glassButton,
                      "flex size-11 items-center justify-center"
                    )}
                    style={glassSurface}
                    aria-haspopup="menu"
                    aria-expanded={showSpeedMenu}
                    aria-label={labels?.more ?? "More"}
                  >
                    <MoreHorizontal className="size-5 text-white" />
                  </button>
                  {/* Anchored the way the reference anchors it: the card
                      COVERS the button and the title beside it, stopping 6px
                      above the scrubber row rather than floating clear of the
                      control that opened it (`IMG_2639.PNG`: card bottom 737,
                      scrubber top 743). `-bottom-[9px]` is that 6px measured
                      from this wrapper's own foot, and `-end-2` puts the card
                      13px from the screen edge — 8 further out than the 21px
                      the buttons keep. */}
                  {showSpeedMenu && (
                    <div
                      role="menu"
                      className={cn(
                        phoneMenuCard,
                        "absolute -end-2 -bottom-[9px] z-20 overflow-hidden"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* The reference's own row — icon, label, and the value
                          where its chevron would be. Not a button: its
                          submenu's contents are the rows directly below, so
                          drilling in would cost a tap and hide nothing worth
                          hiding. Audio and Subtitles, the reference's other
                          two rows, have no tracks behind them here. */}
                      <p
                        className={cn(
                          phoneMenuRow,
                          "text-[15px] text-white/50"
                        )}
                      >
                        <Gauge className="size-[18px] shrink-0" />
                        <span className="flex-1 truncate">
                          {labels?.speed ?? "Playback speed"}
                        </span>
                      </p>
                      {PLAYBACK_SPEEDS.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          role="menuitemradio"
                          aria-checked={state.playbackRate === rate}
                          onClick={() => {
                            actions.setPlaybackRate(rate)
                            setShowSpeedMenu(false)
                          }}
                          className={cn(
                            phoneMenuRow,
                            "transition-colors active:bg-white/10",
                            state.playbackRate === rate && "font-semibold"
                          )}
                        >
                          {/* `dir="ltr"` for the same reason the clocks carry
                              it: the × is a neutral character, so an Arabic
                              row renders the pair as "×0.5" — a multiplier in
                              front of a number rather than a rate after it. */}
                          <span dir="ltr" className="flex-1 text-start">
                            {rate}×
                          </span>
                          {state.playbackRate === rate && (
                            <Check className="size-[18px] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Elapsed · scrubber · time remaining, and the right-hand
                  clock counts DOWN with a minus in front of it — the
                  reference's `0:00:57 … −1:01:40`. Both sit at the inline
                  start and end, so Arabic mirrors the pair without any work
                  here. */}
              <div className="mt-[15px] flex items-center gap-[9px]">
                {/* `dir="ltr"` on the clocks themselves, not on the row: a
                    number keeps its own direction in any script, and the
                    minus in front of the remaining time is a neutral
                    character — left to an Arabic paragraph it lands on the
                    far side of the digits and reads as "0:01:14−". The row
                    stays logical, so the pair still swaps ends. */}
                <span
                  dir="ltr"
                  className="shrink-0 text-xs text-white/55 tabular-nums"
                >
                  {formatClock(state.currentTime)}
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
                <span
                  dir="ltr"
                  className="shrink-0 text-xs text-white/55 tabular-nums"
                >
                  {"−"}
                  {formatClock(
                    Math.max(0, (state.duration || 0) - state.currentTime)
                  )}
                </span>
              </div>

              {/* The reference's capsule row is Info · InSight · Continue
                  Watching. Only the last has anything behind it here — the
                  next lesson, which this player already knows about — and
                  two dead capsules would be decoration. So the row is that
                  one capsule, at the reference's 44px on its 16px padding,
                  and no row at all on the last lesson of a course. */}
              {nextLesson && (
                <div className="mt-[13px] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayNext()
                    }}
                    className={cn(
                      glassButton,
                      "flex h-11 min-w-0 items-center rounded-full px-4 text-[15px] font-semibold text-white"
                    )}
                    style={glassSurface}
                  >
                    <span className="truncate">
                      {labels?.upNext ?? "Up Next"}
                      {": "}
                      {nextLesson.title}
                    </span>
                  </button>
                </div>
              )}
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
            labels={labels}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
