// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The classroom data channel — everything in the room that is not audio or
 * video: questions, polls, whiteboard strokes, which slide is showing.
 *
 * One LiveKit data topic (`lc`), JSON messages, reliable delivery. The host
 * holds the authoritative state; everyone else mirrors it, and a late joiner
 * asks the host for a snapshot. Raised hands are NOT here: they ride on
 * participant attributes, which the SFU keeps for late joiners for free.
 *
 * Pure module (codec + reducer) so the protocol is testable without a room.
 */

export const CLASS_TOPIC = "lc"

/** Reliable data messages are capped around 15 KB; stay well under it. */
export const MAX_MESSAGE_BYTES = 12_000

export interface Stroke {
  id: string
  /** Normalised 0..1 coordinates so every screen size draws the same board. */
  points: Array<[number, number]>
  color: string
  width: number
}

export interface Question {
  id: string
  from: string
  name: string
  text: string
  at: number
  answered: boolean
}

export interface Poll {
  id: string
  question: string
  options: string[]
  /** Tally as the host last broadcast it. */
  counts: number[]
  total: number
  open: boolean
}

export interface Slides {
  url: string
  title: string
  page: number
}

export type ClassMessage =
  | { t: "q"; id: string; text: string; at: number }
  | { t: "q.answered"; id: string }
  | { t: "poll.open"; id: string; question: string; options: string[] }
  | { t: "poll.vote"; id: string; option: number }
  | { t: "poll.tally"; id: string; counts: number[]; total: number }
  | { t: "poll.close"; id: string }
  | { t: "wb.stroke"; stroke: Stroke }
  | { t: "wb.clear" }
  | { t: "wb.show"; on: boolean }
  | { t: "slides"; slides: Slides | null }
  | { t: "hand.clear" }
  | { t: "sync.request" }
  | {
      t: "sync.state"
      questions: Question[]
      poll: Poll | null
      slides: Slides | null
      whiteboard: boolean
      /** Strokes travel separately in `wb.stroke` messages after the snapshot. */
      strokeCount: number
    }

export interface ClassState {
  questions: Question[]
  poll: Poll | null
  slides: Slides | null
  whiteboard: boolean
  strokes: Stroke[]
  /** Host-only: who voted for what, so a re-vote replaces rather than adds. */
  votes: Record<string, number>
}

export function initialClassState(): ClassState {
  return {
    questions: [],
    poll: null,
    slides: null,
    whiteboard: false,
    strokes: [],
    votes: {},
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function encodeMessage(msg: ClassMessage): Uint8Array {
  return encoder.encode(JSON.stringify(msg))
}

export function decodeMessage(payload: Uint8Array): ClassMessage | null {
  try {
    const parsed = JSON.parse(decoder.decode(payload)) as { t?: unknown }
    return parsed && typeof parsed.t === "string"
      ? (parsed as ClassMessage)
      : null
  } catch {
    return null
  }
}

/**
 * Keep a stroke under the message cap by dropping every other point until it
 * fits. A whiteboard line loses nothing a viewer can see.
 */
export function fitStroke(stroke: Stroke): Stroke {
  let s = stroke
  while (
    encodeMessage({ t: "wb.stroke", stroke: s }).byteLength > MAX_MESSAGE_BYTES
  ) {
    if (s.points.length <= 2) break
    s = {
      ...s,
      points: s.points.filter(
        (_, i) => i % 2 === 0 || i === s.points.length - 1
      ),
    }
  }
  return s
}

/**
 * Apply a message from `from` (a participant identity). `isHost` gates the
 * messages only the host may issue — a student broadcasting `poll.close`
 * must change nothing for anyone.
 */
export function applyMessage(
  state: ClassState,
  msg: ClassMessage,
  from: { identity: string; name: string; isHost: boolean }
): ClassState {
  switch (msg.t) {
    case "q": {
      if (state.questions.some((q) => q.id === msg.id)) return state
      const text = msg.text.trim().slice(0, 500)
      if (!text) return state
      return {
        ...state,
        questions: [
          ...state.questions,
          {
            id: msg.id,
            from: from.identity,
            name: from.name,
            text,
            at: msg.at,
            answered: false,
          },
        ],
      }
    }
    case "q.answered":
      if (!from.isHost) return state
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === msg.id ? { ...q, answered: true } : q
        ),
      }
    case "poll.open":
      if (!from.isHost) return state
      return {
        ...state,
        poll: {
          id: msg.id,
          question: msg.question,
          options: msg.options.slice(0, 8),
          counts: msg.options.slice(0, 8).map(() => 0),
          total: 0,
          open: true,
        },
        votes: {},
      }
    case "poll.vote": {
      // Only the host tallies (votes are addressed to the host alone).
      if (!state.poll || !state.poll.open || state.poll.id !== msg.id)
        return state
      if (msg.option < 0 || msg.option >= state.poll.options.length)
        return state
      const votes = { ...state.votes, [from.identity]: msg.option }
      const counts = state.poll.options.map(
        (_, i) => Object.values(votes).filter((v) => v === i).length
      )
      return {
        ...state,
        votes,
        poll: { ...state.poll, counts, total: Object.keys(votes).length },
      }
    }
    case "poll.tally":
      if (!from.isHost || !state.poll || state.poll.id !== msg.id) return state
      return {
        ...state,
        poll: { ...state.poll, counts: msg.counts, total: msg.total },
      }
    case "poll.close":
      if (!from.isHost || !state.poll || state.poll.id !== msg.id) return state
      return { ...state, poll: { ...state.poll, open: false } }
    case "wb.stroke":
      if (!from.isHost) return state
      if (state.strokes.some((s) => s.id === msg.stroke.id)) return state
      return { ...state, strokes: [...state.strokes, msg.stroke] }
    case "wb.clear":
      if (!from.isHost) return state
      return { ...state, strokes: [] }
    case "wb.show":
      if (!from.isHost) return state
      return {
        ...state,
        whiteboard: msg.on,
        slides: msg.on ? null : state.slides,
      }
    case "slides":
      if (!from.isHost) return state
      return {
        ...state,
        slides: msg.slides,
        whiteboard: msg.slides ? false : state.whiteboard,
      }
    case "sync.state":
      if (!from.isHost) return state
      return {
        ...state,
        questions: msg.questions,
        poll: msg.poll,
        slides: msg.slides,
        whiteboard: msg.whiteboard,
        // strokes arrive right after, one per message, and dedupe by id
        strokes: msg.strokeCount === 0 ? [] : state.strokes,
      }
    case "hand.clear":
    case "sync.request":
      return state
  }
}

/** The snapshot a host sends a late joiner. */
export function snapshotOf(
  state: ClassState
): Extract<ClassMessage, { t: "sync.state" }> {
  return {
    t: "sync.state",
    questions: state.questions,
    poll: state.poll,
    slides: state.slides,
    whiteboard: state.whiteboard,
    strokeCount: state.strokes.length,
  }
}
