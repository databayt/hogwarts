// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Every string the room renders, with English defaults. The page overlays
 * the dictionary's `liveClasses.room` subtree on top, so a missing key
 * degrades to English instead of a blank control.
 */
export const DEFAULT_ROOM_LABELS = {
  leave: "Leave",
  participants: "Participants",
  connection: "Connection",
  reconnecting: "Reconnecting…",
  micMuted: "Microphone muted",
  cameraOff: "Camera off",
  mic: "Microphone",
  camera: "Camera",
  screenShare: "Share screen",
  stopShare: "Stop sharing",
  raiseHand: "Raise hand",
  lowerHand: "Lower hand",
  handsRaised: "Raised hands",
  noHands: "No raised hands",
  clearHand: "Lower",
  chat: "Chat",
  noMessages: "No messages yet",
  messagePlaceholder: "Write a message…",
  send: "Send",
  questions: "Questions",
  askQuestion: "Ask a question",
  questionPlaceholder: "Type your question…",
  noQuestions: "No questions yet",
  answered: "Answered",
  markAnswered: "Mark answered",
  poll: "Poll",
  newPoll: "New poll",
  pollQuestion: "Question",
  pollOption: "Option",
  addOption: "Add option",
  openPoll: "Start poll",
  closePoll: "End poll",
  pollClosed: "Poll ended",
  votes: "votes",
  voted: "Your vote is in",
  noPoll: "No active poll",
  whiteboard: "Whiteboard",
  hideWhiteboard: "Hide whiteboard",
  clearBoard: "Clear",
  slides: "Slides",
  pickSlides: "Choose a document",
  noSlides: "No documents attached to this lesson",
  stopSlides: "Stop presenting",
  prevPage: "Previous page",
  nextPage: "Next page",
  page: "Page",
  quality: "Quality",
  qualityAuto: "Auto",
  qualityHigh: "High",
  qualityMedium: "Medium",
  qualityLow: "Low",
  qualityAudio: "Audio + slides",
  audioOnlyOn: "Audio + slides mode is on",
  connectionLost: "Connection lost",
  rejoin: "Rejoin",
  removedByHost: "You were removed from the class",
  classEnded: "The class has ended",
  openedElsewhere: "This class was opened on another device",
  backToClass: "Back to the class page",
  settings: "Settings",
  you: "You",
  host: "Teacher",
  attendanceAuto:
    "Attendance is recorded automatically from your time in the room",
  more: "More",
  excellent: "Excellent",
  good: "Good",
  poor: "Poor",
  lost: "Offline",
  recordingConsent:
    "This class is being recorded for students who miss it. Your voice and video may appear in the recording.",
  dismiss: "Dismiss",
  close: "Close",
  penColor: "Pen colour",
  penSize: "Pen size",
  live: "Live",
  discussion: "Discussion",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  fitScreen: "Fit to screen",
  fillScreen: "Fill the screen",
  classProgress: "Class progress",
  elapsed: "Elapsed",
  remaining: "Remaining",
} as const

export type RoomLabelKey = keyof typeof DEFAULT_ROOM_LABELS
export type RoomLabels = Record<RoomLabelKey, string>

/** Overlay a dictionary subtree (any shape) on the defaults. */
export function resolveRoomLabels(source: unknown): RoomLabels {
  const out: Record<string, string> = { ...DEFAULT_ROOM_LABELS }
  if (source && typeof source === "object") {
    for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
      if (typeof v === "string" && k in DEFAULT_ROOM_LABELS) out[k] = v
    }
  }
  return out as RoomLabels
}
