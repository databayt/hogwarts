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

/** What made a stroke. Missing on strokes from older clients → `pen`. */
export type BoardTool =
  | "pen"
  | "highlighter"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"

export interface Stroke {
  id: string
  /**
   * Coordinates on the board's fixed 16:9 page: x is 0..1 of the page width,
   * y is 0..1 of its height. The page keeps its shape on every screen, so a
   * circle drawn on a laptop is a circle on a phone.
   */
  points: Array<[number, number]>
  color: string
  /** Thousandths of the page width. */
  width: number
  tool?: BoardTool
  /** The `text` tool's words, anchored at `points[0]`. */
  text?: string
  /** Who drew it — set by the reducer from the sender, never trusted from the wire. */
  by?: string
}

/**
 * A stroke still being drawn — streamed lossy so others watch it form. Pen
 * and highlighter drafts carry only the points since the last draft (the
 * receiver appends; a dropped packet is a straight hop until the real stroke
 * lands); shape drafts carry both corners and replace.
 */
export interface DraftStroke {
  id: string
  points: Array<[number, number]>
  color: string
  width: number
  tool: BoardTool
}

/** Who besides the hosts may draw: one identity, everyone, or nobody. */
export type BoardGrant = string | "*" | null

/** A countdown everyone sees. `endsAt` is LOCAL time, derived on receipt. */
export interface ClassTimer {
  /** Milliseconds left when it was last started or paused. */
  remainingMs: number
  running: boolean
  /** Local clock: when it hits zero (running), from `Date.now()` at receipt. */
  endsAt: number
  /** The length it was started with — the ring's full circle. */
  totalMs: number
}

export const REACTIONS = ["👍", "❤️", "😂", "👏", "😮", "🎉"] as const
export type Reaction = (typeof REACTIONS)[number]

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
  | { t: "wb.draft"; draft: DraftStroke }
  | { t: "wb.remove"; ids: string[] }
  | { t: "wb.grant"; to: BoardGrant }
  | { t: "wb.clear" }
  | { t: "spotlight"; identity: string | null }
  | { t: "timer"; remainingMs: number; totalMs: number; running: boolean }
  | { t: "timer.stop" }
  | { t: "react"; emoji: string }
  | { t: "hand.clearAll" }
  /** Host → students: your microphone was muted by the teacher. */
  | { t: "muted" }
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
      grant?: BoardGrant
      spotlight?: string | null
      timer?: { remainingMs: number; totalMs: number; running: boolean } | null
    }

export interface ClassState {
  questions: Question[]
  poll: Poll | null
  slides: Slides | null
  whiteboard: boolean
  strokes: Stroke[]
  /** Host-only: who voted for what, so a re-vote replaces rather than adds. */
  votes: Record<string, number>
  grant: BoardGrant
  spotlight: string | null
  timer: ClassTimer | null
}

export function initialClassState(): ClassState {
  return {
    questions: [],
    poll: null,
    slides: null,
    whiteboard: false,
    strokes: [],
    votes: {},
    grant: null,
    spotlight: null,
    timer: null,
  }
}

/** May `identity` draw on the board? Hosts always; others by grant. */
export function canDrawOn(
  state: Pick<ClassState, "grant">,
  identity: string,
  isHost: boolean
): boolean {
  return isHost || state.grant === "*" || state.grant === identity
}

/** The timer as a receiver holds it: `endsAt` on this device's clock. */
export function timerFrom(
  t: { remainingMs: number; totalMs: number; running: boolean },
  now: number
): ClassTimer {
  const remainingMs = Math.max(0, Math.min(t.remainingMs, 6 * 3_600_000))
  return {
    remainingMs,
    totalMs: Math.max(remainingMs, t.totalMs),
    running: t.running && remainingMs > 0,
    endsAt: now + remainingMs,
  }
}

/** Time left on a timer at `now`. */
export function timerLeft(t: ClassTimer, now: number): number {
  return t.running ? Math.max(0, t.endsAt - now) : t.remainingMs
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
  from: { identity: string; name: string; isHost: boolean },
  now: number = Date.now()
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
    case "wb.stroke": {
      // The host replays every stroke to a late joiner, so a host's copy
      // keeps the original author; anyone else is the author of their own.
      if (!canDrawOn(state, from.identity, from.isHost)) return state
      if (state.strokes.some((s) => s.id === msg.stroke.id)) return state
      const by = from.isHost ? (msg.stroke.by ?? from.identity) : from.identity
      const stroke: Stroke = {
        ...msg.stroke,
        by,
        ...(msg.stroke.text !== undefined
          ? { text: msg.stroke.text.slice(0, 200) }
          : {}),
      }
      return { ...state, strokes: [...state.strokes, stroke] }
    }
    case "wb.remove": {
      // The eraser and undo. A host removes anything; a granted student
      // only what they drew themselves.
      if (!canDrawOn(state, from.identity, from.isHost)) return state
      const ids = new Set(msg.ids)
      const strokes = state.strokes.filter(
        (s) => !ids.has(s.id) || (!from.isHost && s.by !== from.identity)
      )
      return strokes.length === state.strokes.length
        ? state
        : { ...state, strokes }
    }
    case "wb.grant":
      if (!from.isHost) return state
      return { ...state, grant: msg.to }
    case "wb.clear":
      if (!from.isHost) return state
      return { ...state, strokes: [] }
    case "spotlight":
      if (!from.isHost) return state
      return { ...state, spotlight: msg.identity }
    case "timer":
      if (!from.isHost) return state
      return { ...state, timer: timerFrom(msg, now) }
    case "timer.stop":
      if (!from.isHost) return state
      return { ...state, timer: null }
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
        grant: msg.grant ?? null,
        spotlight: msg.spotlight ?? null,
        timer: msg.timer ? timerFrom(msg.timer, now) : null,
      }
    // Ephemeral or addressed: handled by the hook, never stored.
    case "wb.draft":
    case "react":
    case "hand.clear":
    case "hand.clearAll":
    case "muted":
    case "sync.request":
      return state
  }
}

/** The snapshot a host sends a late joiner. */
export function snapshotOf(
  state: ClassState,
  now: number = Date.now()
): Extract<ClassMessage, { t: "sync.state" }> {
  return {
    t: "sync.state",
    questions: state.questions,
    poll: state.poll,
    slides: state.slides,
    whiteboard: state.whiteboard,
    strokeCount: state.strokes.length,
    grant: state.grant,
    spotlight: state.spotlight,
    timer: state.timer
      ? {
          remainingMs: timerLeft(state.timer, now),
          totalMs: state.timer.totalMs,
          running: state.timer.running,
        }
      : null,
  }
}
