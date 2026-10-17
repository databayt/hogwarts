"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import {
  useDataChannel,
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react"
import { ConnectionState, RoomEvent, type Participant } from "livekit-client"

import { parseRoomHostsMetadata } from "@/components/school-dashboard/live/types"

import {
  applyMessage,
  canDrawOn,
  CLASS_TOPIC,
  decodeMessage,
  encodeMessage,
  fitStroke,
  initialClassState,
  snapshotOf,
  type BoardGrant,
  type ClassMessage,
  type ClassState,
  type DraftStroke,
  type Stroke,
} from "./class-channel"

/** What the channel carries that is never state: watched, then gone. */
export type EphemeralEvent =
  | { kind: "draft"; draft: DraftStroke; from: string }
  | { kind: "react"; emoji: string; from: string; name: string }
  | { kind: "handLowered" }
  | { kind: "muted" }

export const HAND_ATTRIBUTE = "hand"

export interface ClassChannel {
  state: ClassState
  isHost: boolean
  hostIdentity: string | null
  /** Broadcast, or address specific identities. */
  send: (msg: ClassMessage, to?: string[]) => Promise<void>
  /** Convenience for the whiteboard: fits the stroke under the size cap first. */
  sendStroke: (stroke: Stroke) => Promise<void>
  /** Identities with a raised hand, in the order they raised it. */
  hands: string[]
  /** When this client first saw each hand go up (local clock). */
  handsSince: ReadonlyMap<string, number>
  handUp: boolean
  setHand: (up: boolean) => Promise<void>
  /** Host: ask a student to lower their hand. */
  clearHand: (identity: string) => Promise<void>
  /** Host: every raised hand down at once. */
  clearAllHands: () => Promise<void>
  /** May this participant draw on the board right now? */
  canDraw: boolean
  /** A stroke in progress — lossy, so a dropped frame costs nothing. */
  sendDraft: (draft: DraftStroke) => void
  sendReaction: (emoji: string) => void
  setGrant: (to: BoardGrant) => Promise<void>
  /** Drafts, reactions, a hand lowered by the host: listen, don't store. */
  subscribe: (listener: (e: EphemeralEvent) => void) => () => void
  localIdentity: string
}

/**
 * The room's classroom state, mirrored from the data channel. The host's
 * copy is authoritative: it tallies votes, answers late joiners' snapshot
 * requests and is the only origin the reducer trusts for host-only messages.
 */
export function useClassChannel(opts: {
  hostIdentity: string | null
  isHost: boolean
}): ClassChannel {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [state, setState] = useState<ClassState>(initialClassState)
  const stateRef = useRef(state)
  const sendRef = useRef<(msg: ClassMessage, to?: string[]) => Promise<void>>(
    async () => {}
  )
  // The data handler is declared before `answerSync` exists; it calls
  // through this ref, filled once the callback is.
  const answerSyncRef = useRef<(identity: string) => Promise<void>>(
    async () => {}
  )
  const { hostIdentity, isHost } = opts
  // Ephemeral events go to listeners directly — a stroke streaming at 20 Hz
  // must not re-render the room.
  const listenersRef = useRef(new Set<(e: EphemeralEvent) => void>())
  const emit = useCallback((e: EphemeralEvent) => {
    for (const l of listenersRef.current) l(e)
  }, [])
  const subscribe = useCallback((listener: (e: EphemeralEvent) => void) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  // ---- host trust: ROOM metadata (`{ hosts: string[] }`), published
  // server-side (`livekit/rooms.ts addRoomHost`, called from
  // `actions/join-core.ts`) whenever a HOST or CO_HOST joins. This is
  // deliberately NOT `participant.attributes.role`: PARTICIPANT tokens carry
  // `canUpdateOwnMetadata` too (so a student can raise a hand over the same
  // grant), which lets a student's own client call
  // `localParticipant.setAttributes({ role: "HOST" })` and forge every
  // host-only message below. Room metadata is written only by
  // `addRoomHost`, a `server-only` call through LiveKit's RoomServiceClient
  // (authenticated with the API key/secret) — a credential no browser-held
  // token can present, so no participant grant lets a client self-edit it.
  const [roomHosts, setRoomHosts] = useState<string[]>(() =>
    parseRoomHostsMetadata(room.metadata)
  )
  useEffect(() => {
    const sync = () => setRoomHosts(parseRoomHostsMetadata(room.metadata))
    // `RoomMetadataChanged` only fires for a CHANGE after the first
    // snapshot — the metadata the join response itself carried needs an
    // explicit re-read on (re)connect.
    if (room.state === ConnectionState.Connected) sync()
    room.on(RoomEvent.Connected, sync)
    room.on(RoomEvent.Reconnected, sync)
    room.on(RoomEvent.RoomMetadataChanged, sync)
    return () => {
      room.off(RoomEvent.Connected, sync)
      room.off(RoomEvent.Reconnected, sync)
      room.off(RoomEvent.RoomMetadataChanged, sync)
    }
  }, [room])

  const { send: sendRaw } = useDataChannel(CLASS_TOPIC, (raw) => {
    const msg = decodeMessage(raw.payload)
    if (!msg) return
    const from = raw.from
    if (!from) return
    // Co-hosts run the same tools as the teacher; every receiver must treat
    // their messages as host messages or their controls would silently do
    // nothing for anyone else. Trust ONLY the ticket's `hostIdentity` and
    // the server-published room-metadata host set — see the comment above.
    const fromIsHost =
      from.identity === hostIdentity || roomHosts.includes(from.identity)

    if (msg.t === "sync.request") {
      if (isHost) void answerSyncRef.current(from.identity)
      return
    }
    if (msg.t === "hand.clear" || msg.t === "hand.clearAll") {
      if (fromIsHost) {
        const wasUp = localParticipant.attributes?.[HAND_ATTRIBUTE] === "1"
        void localParticipant.setAttributes({ [HAND_ATTRIBUTE]: "" })
        if (wasUp) emit({ kind: "handLowered" })
      }
      return
    }
    if (msg.t === "muted") {
      if (fromIsHost) emit({ kind: "muted" })
      return
    }
    if (msg.t === "wb.draft") {
      const st = stateRef.current
      if (
        st.whiteboard &&
        (fromIsHost || st.grant === "*" || st.grant === from.identity)
      )
        emit({ kind: "draft", draft: msg.draft, from: from.identity })
      return
    }
    if (msg.t === "react") {
      if (typeof msg.emoji === "string" && msg.emoji.length <= 8)
        emit({
          kind: "react",
          emoji: msg.emoji,
          from: from.identity,
          name: from.name ?? from.identity,
        })
      return
    }
    // Votes are addressed to the host; a stray copy elsewhere must not tally.
    if (msg.t === "poll.vote" && !isHost) return

    // Reduce through the ref, not only through setState: the tally broadcast
    // below must carry the post-vote counts, and React has not re-rendered
    // (so `stateRef` has not caught up) by the time it is sent.
    const next = applyMessage(stateRef.current, msg, {
      identity: from.identity,
      name: from.name ?? from.identity,
      isHost: fromIsHost,
    })
    stateRef.current = next
    setState(next)

    // Host re-broadcasts the tally after every vote so everyone sees it move.
    if (msg.t === "poll.vote" && isHost) {
      const poll = next.poll
      if (poll && poll.id === msg.id) {
        void sendRef.current({
          t: "poll.tally",
          id: poll.id,
          counts: poll.counts,
          total: poll.total,
        })
      }
    }
  })

  const send = useCallback(
    async (msg: ClassMessage, to?: string[]) => {
      await sendRaw(encodeMessage(msg), {
        reliable: true,
        ...(to && to.length > 0 ? { destinationIdentities: to } : {}),
      })
      // Our own messages don't echo back — apply locally, through the ref.
      const next = applyMessage(stateRef.current, msg, {
        identity: localParticipant.identity,
        name: localParticipant.name ?? localParticipant.identity,
        isHost,
      })
      stateRef.current = next
      setState(next)
    },
    [sendRaw, localParticipant, isHost]
  )
  useEffect(() => {
    sendRef.current = send
  }, [send])

  const answerSync = useCallback(
    async (identity: string) => {
      const snap = snapshotOf(stateRef.current)
      await sendRaw(encodeMessage(snap), {
        reliable: true,
        destinationIdentities: [identity],
      })
      for (const stroke of stateRef.current.strokes) {
        await sendRaw(encodeMessage({ t: "wb.stroke", stroke }), {
          reliable: true,
          destinationIdentities: [identity],
        })
      }
    },
    [sendRaw]
  )
  useEffect(() => {
    answerSyncRef.current = answerSync
  }, [answerSync])

  // Late joiner: ask the host for the state of the room. The hook mounts
  // before the room is connected, so the first ask would be thrown away —
  // ask once we are connected (and again after a reconnect, when the host
  // may have moved on), and whenever the host arrives after us.
  useEffect(() => {
    if (isHost || !hostIdentity) return
    const ask = () => {
      void sendRaw(encodeMessage({ t: "sync.request" }), {
        reliable: true,
        destinationIdentities: [hostIdentity],
      }).catch(() => {})
    }
    const onJoin = (p: Participant) => {
      if (p.identity === hostIdentity) ask()
    }
    if (room.state === ConnectionState.Connected) ask()
    room.on(RoomEvent.Connected, ask)
    room.on(RoomEvent.Reconnected, ask)
    room.on(RoomEvent.ParticipantConnected, onJoin)
    return () => {
      room.off(RoomEvent.Connected, ask)
      room.off(RoomEvent.Reconnected, ask)
      room.off(RoomEvent.ParticipantConnected, onJoin)
    }
  }, [isHost, hostIdentity, room, sendRaw])

  const sendStroke = useCallback(
    (stroke: Stroke) => send({ t: "wb.stroke", stroke: fitStroke(stroke) }),
    [send]
  )

  // ---- hands: participant attributes, so late joiners see them for free
  const [hands, setHands] = useState<string[]>([])
  const [handsSince, setHandsSince] = useState<ReadonlyMap<string, number>>(
    () => new Map()
  )
  const orderRef = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const recompute = () => {
      const all: Participant[] = [
        room.localParticipant,
        ...room.remoteParticipants.values(),
      ]
      const up = all.filter((p) => p.attributes?.[HAND_ATTRIBUTE] === "1")
      for (const p of up) {
        if (!orderRef.current.has(p.identity))
          orderRef.current.set(p.identity, Date.now())
      }
      for (const id of [...orderRef.current.keys()]) {
        if (!up.some((p) => p.identity === id)) orderRef.current.delete(id)
      }
      setHandsSince(new Map(orderRef.current))
      setHands(
        up
          .map((p) => p.identity)
          .sort(
            (a, b) =>
              (orderRef.current.get(a) ?? 0) - (orderRef.current.get(b) ?? 0)
          )
      )
    }
    recompute()
    room.on(RoomEvent.ParticipantAttributesChanged, recompute)
    room.on(RoomEvent.ParticipantConnected, recompute)
    room.on(RoomEvent.ParticipantDisconnected, recompute)
    return () => {
      room.off(RoomEvent.ParticipantAttributesChanged, recompute)
      room.off(RoomEvent.ParticipantConnected, recompute)
      room.off(RoomEvent.ParticipantDisconnected, recompute)
    }
  }, [room])

  const handUp = hands.includes(localParticipant.identity)
  const setHand = useCallback(
    (up: boolean) =>
      localParticipant.setAttributes({ [HAND_ATTRIBUTE]: up ? "1" : "" }),
    [localParticipant]
  )
  const clearHand = useCallback(
    (identity: string) => send({ t: "hand.clear" }, [identity]),
    [send]
  )
  const clearAllHands = useCallback(() => send({ t: "hand.clearAll" }), [send])

  const sendDraft = useCallback(
    (draft: DraftStroke) => {
      void sendRaw(encodeMessage({ t: "wb.draft", draft }), {
        reliable: false,
      }).catch(() => {})
    },
    [sendRaw]
  )
  const lastReactRef = useRef(0)
  const sendReaction = useCallback(
    (emoji: string) => {
      const now = Date.now()
      if (now - lastReactRef.current < 400) return
      lastReactRef.current = now
      void sendRaw(encodeMessage({ t: "react", emoji }), {
        reliable: false,
      }).catch(() => {})
      // No echo for our own: show it here.
      emit({
        kind: "react",
        emoji,
        from: localParticipant.identity,
        name: localParticipant.name ?? localParticipant.identity,
      })
    },
    [sendRaw, emit, localParticipant]
  )
  const setGrant = useCallback(
    (to: BoardGrant) => send({ t: "wb.grant", to }),
    [send]
  )
  const canDraw = canDrawOn(state, localParticipant.identity, isHost)

  return {
    state,
    isHost,
    hostIdentity,
    send,
    sendStroke,
    hands,
    handsSince,
    handUp,
    setHand,
    clearHand,
    clearAllHands,
    canDraw,
    sendDraft,
    sendReaction,
    setGrant,
    subscribe,
    localIdentity: localParticipant.identity,
  }
}
