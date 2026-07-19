// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Video Player Types

export interface VideoPlayerProps {
  url: string
  title?: string
  lessonId: string
  userId?: string
  userEmail?: string
  initialPosition?: number
  posterUrl?: string | null
  nextLesson?: NextLesson | null
  onProgress?: (progress: VideoProgress) => void
  onComplete?: () => void
  onNextLesson?: () => void
  // Fires when the <video> element fails to load/decode its source (dead URL,
  // unsupported codec). Lets the caller swap in a fallback source.
  onSourceError?: () => void
  className?: string
  autoPlay?: boolean
  chapterNumber?: number
  lessonNumber?: number
  courseTitle?: string
  // i18n — every field is optional with an English fallback at each call
  // site, so a missing key never blanks the UI. Built by the caller (today,
  // only dashboard/lesson/content.tsx) from the `stream` dictionary subtree.
  labels?: VideoPlayerLabels
}

// Display strings for the player + its Up Next overlay. Every consumer reads
// with `labels?.x ?? "English fallback"` — see VideoPlayerProps.labels.
export interface VideoPlayerLabels {
  play?: string
  pause?: string
  rewind?: string
  forward?: string
  pictureInPicture?: string
  share?: string
  copyLink?: string
  airdrop?: string
  messages?: string
  notes?: string
  reminders?: string
  volume?: string
  mute?: string
  unmute?: string
  // Reused from `stream.lesson.chapterShort`/`lessonShort` — NOT duplicated
  // into a player-owned key (see dashboard/lesson/content.tsx).
  chapterShort?: string
  lessonShort?: string
  upNext?: string
  playNow?: string
  cancelAutoPlay?: string
  // Template with literal `{enter}`/`{esc}` tokens — VideoUpNext splits on
  // them and renders <kbd> elements in place so the key-badge styling
  // survives translation/reordering.
  keyboardHint?: string
  minUnit?: string
  hourUnit?: string
  minuteUnit?: string
}

export interface NextLesson {
  id: string
  title: string
  chapterTitle: string
  duration?: number
  thumbnailUrl?: string
}

export interface VideoProgress {
  currentTime: number
  duration: number
  percentage: number
  watchedSeconds: number
}

export interface VideoPlayerState {
  // Playback
  isPlaying: boolean
  isMuted: boolean
  volume: number
  playbackRate: number

  // Time
  currentTime: number
  duration: number
  bufferedEnd: number

  // UI
  showControls: boolean
  isFullscreen: boolean
  isSettingsOpen: boolean
  isLoading: boolean

  // Seeking
  isSeeking: boolean
  seekPosition: number | null
  thumbnailUrl: string | null
  thumbnailTime: number | null

  // Video ended
  hasEnded: boolean

  // Up Next
  showUpNext: boolean
  upNextCountdown: number
}

export type VideoPlayerAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_PLAY" }
  | { type: "SEEK"; time: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_PLAYBACK_RATE"; rate: number }
  | { type: "SHOW_CONTROLS" }
  | { type: "HIDE_CONTROLS" }
  | { type: "SET_FULLSCREEN"; isFullscreen: boolean }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "START_SEEKING"; position: number }
  | { type: "UPDATE_SEEK_POSITION"; position: number; thumbnailUrl?: string }
  | { type: "END_SEEKING" }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "UPDATE_DURATION"; duration: number }
  | { type: "UPDATE_BUFFERED"; bufferedEnd: number }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "VIDEO_ENDED" }
  | { type: "RESET_ENDED" }
  | { type: "SHOW_UP_NEXT" }
  | { type: "HIDE_UP_NEXT" }
  | { type: "DECREMENT_COUNTDOWN" }
  | { type: "CANCEL_UP_NEXT" }

export interface ThumbnailData {
  time: number
  url: string
}

export interface ProgressBarProps {
  currentTime: number
  duration: number
  bufferedEnd: number
  isSeeking: boolean
  seekPosition: number | null
  thumbnailUrl: string | null
  thumbnailTime: number | null
  onSeek: (time: number) => void
  onSeekStart: (position: number) => void
  onSeekMove: (position: number) => void
  onSeekEnd: () => void
}

export interface ControlsProps {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  playbackRate: number
  currentTime: number
  duration: number
  isFullscreen: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
  onSkip: (seconds: number) => void
  onPlaybackRateChange: (rate: number) => void
  onToggleFullscreen: () => void
}

export interface UpNextOverlayProps {
  nextLesson: NextLesson
  countdown: number
  onPlayNext: () => void
  onCancel: () => void
  labels?: VideoPlayerLabels
}
