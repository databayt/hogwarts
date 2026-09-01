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

import {
  applyMessage,
  CLASS_TOPIC,
  decodeMessage,
  encodeMessage,
  fitStroke,
  initialClassState,
  snapshotOf,
  type ClassMessage,
  type ClassState,
  type Stroke,
} from "./class-channel"

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
  handUp: boolean
  setHand: (up: boolean) => Promise<void>
  /** Host: ask a student to lower their hand. */
  clearHand: (identity: string) => Promise<void>
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
  const { hostIdentity, isHost } = opts

  const { send: sendRaw } = useDataChannel(CLASS_TOPIC, (raw) => {
    const msg = decodeMessage(raw.payload)
    if (!msg) return
    const from = raw.from
    const fromRole = from?.attributes?.role
    // Co-hosts run the same tools as the teacher; every receiver must treat
    // their messages as host messages or their controls would silently do
    // nothing for anyone else.
    const fromIsHost =
      !!from &&
      (from.identity === hostIdentity ||
        fromRole === "HOST" ||
        fromRole === "CO_HOST")
    if (!from) return

    if (msg.t === "sync.request") {
      if (isHost) void answerSync(from.identity)
      return
    }
    if (msg.t === "hand.clear") {
      if (fromIsHost)
        void localParticipant.setAttributes({ [HAND_ATTRIBUTE]: "" })
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
  sendRef.current = send

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

  return {
    state,
    isHost,
    hostIdentity,
    send,
    sendStroke,
    hands,
    handUp,
    setHand,
    clearHand,
  }
}
