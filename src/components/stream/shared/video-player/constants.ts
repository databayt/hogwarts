// Video Player Constants

// Playback speeds
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const

// Auto-hide controls timeout (ms)
export const CONTROLS_HIDE_DELAY = 3000

// Progress save interval (ms)
export const PROGRESS_SAVE_INTERVAL = 5000

// Resume thresholds (seconds)
export const INTRO_SKIP_THRESHOLD = 15 // Skip if within first 15s
export const END_THRESHOLD = 30 // Consider complete if within 30s of end
export const REWIND_BUFFER = 5 // Rewind 5s for context when resuming

// Up Next countdown (seconds)
export const UP_NEXT_COUNTDOWN = 10

// Up Next trigger - seconds before video ends
export const UP_NEXT_TRIGGER_BEFORE_END = 5

// Thumbnail preview
export const THUMBNAIL_WIDTH = 160
export const THUMBNAIL_CACHE_SIZE = 50

// Skip amounts (seconds)
export const SKIP_FORWARD = 10
export const SKIP_BACKWARD = 10
export const SKIP_SMALL = 5

// Volume step for keyboard
export const VOLUME_STEP = 10

// Keyboard shortcuts mapping
export const KEYBOARD_SHORTCUTS = {
  // Play/Pause
  " ": "togglePlay",
  k: "togglePlay",
  K: "togglePlay",

  // Mute
  m: "toggleMute",
  M: "toggleMute",

  // Fullscreen
  f: "toggleFullscreen",
  F: "toggleFullscreen",

  // Seek backward
  ArrowLeft: "seekBackward5",
  j: "seekBackward10",
  J: "seekBackward10",

  // Seek forward
  ArrowRight: "seekForward5",
  l: "seekForward10",
  L: "seekForward10",

  // Volume
  ArrowUp: "volumeUp",
  ArrowDown: "volumeDown",

  // Cancel
  Escape: "escape",

  // Number keys for percentage seek
  "0": "seekTo0",
  "1": "seekTo10",
  "2": "seekTo20",
  "3": "seekTo30",
  "4": "seekTo40",
  "5": "seekTo50",
  "6": "seekTo60",
  "7": "seekTo70",
  "8": "seekTo80",
  "9": "seekTo90",
} as const

// LocalStorage keys
export const getProgressKey = (lessonId: string) => `video-progress-${lessonId}`

// Animation durations (ms)
export const ANIMATION_DURATION = {
  controls: 300,
  button: 200,
  overlay: 200,
  progressBar: 200,
} as const

// Progress bar dimensions
export const PROGRESS_BAR = {
  heightRest: 4,
  heightHover: 8,
  thumbSize: 12,
} as const
