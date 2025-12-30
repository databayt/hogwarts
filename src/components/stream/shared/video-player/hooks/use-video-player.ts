"use client"

import { useCallback, useReducer, type RefObject } from "react"

import {
  PLAYBACK_SPEEDS,
  SKIP_BACKWARD,
  SKIP_FORWARD,
  SKIP_SMALL,
  UP_NEXT_COUNTDOWN,
  VOLUME_STEP,
} from "../constants"
import type { VideoPlayerAction, VideoPlayerState } from "../types"

const initialState: VideoPlayerState = {
  isPlaying: false,
  isMuted: false,
  volume: 100,
  playbackRate: 1,
  currentTime: 0,
  duration: 0,
  bufferedEnd: 0,
  showControls: true,
  isFullscreen: false,
  isSettingsOpen: false,
  isLoading: true,
  isSeeking: false,
  seekPosition: null,
  thumbnailUrl: null,
  thumbnailTime: null,
  hasEnded: false,
  showUpNext: false,
  upNextCountdown: UP_NEXT_COUNTDOWN,
}

function videoPlayerReducer(
  state: VideoPlayerState,
  action: VideoPlayerAction
): VideoPlayerState {
  switch (action.type) {
    case "PLAY":
      return { ...state, isPlaying: true, hasEnded: false }
    case "PAUSE":
      return { ...state, isPlaying: false }
    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying, hasEnded: false }
    case "SEEK":
      return { ...state, currentTime: action.time }
    case "SET_VOLUME":
      return {
        ...state,
        volume: action.volume,
        isMuted: action.volume === 0,
      }
    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted }
    case "SET_PLAYBACK_RATE":
      return { ...state, playbackRate: action.rate }
    case "SHOW_CONTROLS":
      return { ...state, showControls: true }
    case "HIDE_CONTROLS":
      return { ...state, showControls: false }
    case "SET_FULLSCREEN":
      return { ...state, isFullscreen: action.isFullscreen }
    case "TOGGLE_SETTINGS":
      return { ...state, isSettingsOpen: !state.isSettingsOpen }
    case "START_SEEKING":
      return {
        ...state,
        isSeeking: true,
        seekPosition: action.position,
      }
    case "UPDATE_SEEK_POSITION":
      return {
        ...state,
        seekPosition: action.position,
        thumbnailUrl: action.thumbnailUrl ?? state.thumbnailUrl,
        thumbnailTime:
          action.position !== null
            ? (action.position / 100) * state.duration
            : null,
      }
    case "END_SEEKING":
      return {
        ...state,
        isSeeking: false,
        seekPosition: null,
        thumbnailUrl: null,
        thumbnailTime: null,
      }
    case "UPDATE_TIME":
      return { ...state, currentTime: action.time, isLoading: false }
    case "UPDATE_DURATION":
      return { ...state, duration: action.duration }
    case "UPDATE_BUFFERED":
      return { ...state, bufferedEnd: action.bufferedEnd }
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading }
    case "VIDEO_ENDED":
      return { ...state, isPlaying: false, hasEnded: true }
    case "RESET_ENDED":
      return { ...state, hasEnded: false }
    case "SHOW_UP_NEXT":
      return {
        ...state,
        showUpNext: true,
        upNextCountdown: UP_NEXT_COUNTDOWN,
      }
    case "HIDE_UP_NEXT":
      return { ...state, showUpNext: false }
    case "DECREMENT_COUNTDOWN":
      return {
        ...state,
        upNextCountdown: Math.max(0, state.upNextCountdown - 1),
      }
    case "CANCEL_UP_NEXT":
      return { ...state, showUpNext: false, upNextCountdown: UP_NEXT_COUNTDOWN }
    default:
      return state
  }
}

export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement | null>) {
  const [state, dispatch] = useReducer(videoPlayerReducer, initialState)

  // Playback controls
  const play = useCallback(() => {
    videoRef.current?.play()
    dispatch({ type: "PLAY" })
  }, [videoRef])

  const pause = useCallback(() => {
    videoRef.current?.pause()
    dispatch({ type: "PAUSE" })
  }, [videoRef])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (state.isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    dispatch({ type: "TOGGLE_PLAY" })
  }, [videoRef, state.isPlaying])

  // Seeking
  const seek = useCallback(
    (time: number) => {
      if (!videoRef.current) return
      const clampedTime = Math.max(0, Math.min(time, state.duration))
      videoRef.current.currentTime = clampedTime
      dispatch({ type: "SEEK", time: clampedTime })
    },
    [videoRef, state.duration]
  )

  const skip = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return
      const newTime = videoRef.current.currentTime + seconds
      seek(newTime)
    },
    [videoRef, seek]
  )

  const skipForward = useCallback(() => skip(SKIP_FORWARD), [skip])
  const skipBackward = useCallback(() => skip(-SKIP_BACKWARD), [skip])
  const skipForwardSmall = useCallback(() => skip(SKIP_SMALL), [skip])
  const skipBackwardSmall = useCallback(() => skip(-SKIP_SMALL), [skip])

  const seekToPercent = useCallback(
    (percent: number) => {
      const time = (percent / 100) * state.duration
      seek(time)
    },
    [seek, state.duration]
  )

  // Volume
  const setVolume = useCallback(
    (volume: number) => {
      if (!videoRef.current) return
      const clampedVolume = Math.max(0, Math.min(100, volume))
      videoRef.current.volume = clampedVolume / 100
      dispatch({ type: "SET_VOLUME", volume: clampedVolume })
    },
    [videoRef]
  )

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !state.isMuted
    dispatch({ type: "TOGGLE_MUTE" })
  }, [videoRef, state.isMuted])

  const volumeUp = useCallback(
    () => setVolume(state.volume + VOLUME_STEP),
    [setVolume, state.volume]
  )
  const volumeDown = useCallback(
    () => setVolume(state.volume - VOLUME_STEP),
    [setVolume, state.volume]
  )

  // Playback rate
  const setPlaybackRate = useCallback(
    (rate: number) => {
      if (!videoRef.current) return
      if (!PLAYBACK_SPEEDS.includes(rate as (typeof PLAYBACK_SPEEDS)[number]))
        return
      videoRef.current.playbackRate = rate
      dispatch({ type: "SET_PLAYBACK_RATE", rate })
    },
    [videoRef]
  )

  // Fullscreen
  const toggleFullscreen = useCallback(
    (containerRef: RefObject<HTMLDivElement | null>) => {
      if (!containerRef.current) return

      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
        dispatch({ type: "SET_FULLSCREEN", isFullscreen: true })
      } else {
        document.exitFullscreen()
        dispatch({ type: "SET_FULLSCREEN", isFullscreen: false })
      }
    },
    []
  )

  // Controls visibility
  const showControls = useCallback(
    () => dispatch({ type: "SHOW_CONTROLS" }),
    []
  )
  const hideControls = useCallback(
    () => dispatch({ type: "HIDE_CONTROLS" }),
    []
  )

  // Settings
  const toggleSettings = useCallback(
    () => dispatch({ type: "TOGGLE_SETTINGS" }),
    []
  )

  // Seeking UI state
  const startSeeking = useCallback(
    (position: number) => dispatch({ type: "START_SEEKING", position }),
    []
  )
  const updateSeekPosition = useCallback(
    (position: number, thumbnailUrl?: string) =>
      dispatch({ type: "UPDATE_SEEK_POSITION", position, thumbnailUrl }),
    []
  )
  const endSeeking = useCallback(() => dispatch({ type: "END_SEEKING" }), [])

  // Video events
  const updateTime = useCallback(
    (time: number) => dispatch({ type: "UPDATE_TIME", time }),
    []
  )
  const updateDuration = useCallback(
    (duration: number) => dispatch({ type: "UPDATE_DURATION", duration }),
    []
  )
  const updateBuffered = useCallback(
    (bufferedEnd: number) => dispatch({ type: "UPDATE_BUFFERED", bufferedEnd }),
    []
  )
  const setLoading = useCallback(
    (isLoading: boolean) => dispatch({ type: "SET_LOADING", isLoading }),
    []
  )
  const onVideoEnded = useCallback(() => dispatch({ type: "VIDEO_ENDED" }), [])

  // Up Next
  const showUpNext = useCallback(() => dispatch({ type: "SHOW_UP_NEXT" }), [])
  const hideUpNext = useCallback(() => dispatch({ type: "HIDE_UP_NEXT" }), [])
  const decrementCountdown = useCallback(
    () => dispatch({ type: "DECREMENT_COUNTDOWN" }),
    []
  )
  const cancelUpNext = useCallback(
    () => dispatch({ type: "CANCEL_UP_NEXT" }),
    []
  )

  return {
    state,
    actions: {
      play,
      pause,
      togglePlay,
      seek,
      skip,
      skipForward,
      skipBackward,
      skipForwardSmall,
      skipBackwardSmall,
      seekToPercent,
      setVolume,
      toggleMute,
      volumeUp,
      volumeDown,
      setPlaybackRate,
      toggleFullscreen,
      showControls,
      hideControls,
      toggleSettings,
      startSeeking,
      updateSeekPosition,
      endSeeking,
      updateTime,
      updateDuration,
      updateBuffered,
      setLoading,
      onVideoEnded,
      showUpNext,
      hideUpNext,
      decrementCountdown,
      cancelUpNext,
    },
  }
}
