// Video Player Types

export interface VideoPlayerProps {
  url: string
  title?: string
  lessonId: string
  userId?: string
  initialPosition?: number
  nextLesson?: NextLesson | null
  onProgress?: (progress: VideoProgress) => void
  onComplete?: () => void
  onNextLesson?: () => void
  className?: string
  autoPlay?: boolean
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
}
