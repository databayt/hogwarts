"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef } from "react"
import { useRoomContext } from "@livekit/components-react"

import { chime } from "./chime"
import type { RoomLabels } from "./labels"
import type { RoomToasts } from "./toasts"
import type { ClassChannel } from "./use-class-channel"

/**
 * Turns what changes in the class into notices:
 *
 * - host: a new raised hand → "Amira raised a hand" with Give the floor /
 *   Lower, and a soft chime unless the class audio is off here;
 * - student: the teacher lowered my hand, handed me or took back the pen,
 *   gave me the floor, or muted me.
 */
export function useClassNotices(opts: {
  channel: ClassChannel
  labels: RoomLabels
  toasts: RoomToasts
  onGiveFloor: (identity: string) => void
  soundOn: boolean
}) {
  const { channel, labels, onGiveFloor, soundOn } = opts
  const push = opts.toasts.push
  const { isHost, hands, localIdentity, state, subscribe, clearHand } = channel
  // Names are read when a notice is made, not subscribed to: a
  // participants hook here would re-render the whole room on every
  // speaking/quality event.
  const room = useRoomContext()

  // Host: each hand that goes up.
  const seenHands = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!isHost) return
    const prev = seenHands.current
    seenHands.current = new Set(hands)
    // The first read is the room as we found it, not news.
    if (!prev) return
    const fresh = hands.filter((id) => !prev.has(id) && id !== localIdentity)
    if (fresh.length === 0) return
    if (soundOn) chime("hand")
    const nameOf = (id: string) => room.remoteParticipants.get(id)?.name || id
    for (const id of fresh) {
      push({
        id: `hand-${id}`,
        text: `✋ ${labels.handRaisedBy.replace("{name}", nameOf(id))}`,
        ttl: 6000,
        actions: [
          {
            label: labels.giveFloor,
            primary: true,
            onClick: () => onGiveFloor(id),
          },
          {
            label: labels.clearHand,
            onClick: () => void clearHand(id),
          },
        ],
      })
    }
  }, [
    hands,
    isHost,
    localIdentity,
    soundOn,
    push,
    labels,
    room,
    onGiveFloor,
    clearHand,
  ])

  // Student: messages addressed to me. A hand lowered because the teacher
  // gave me the floor is not news — that notice says so instead.
  const floorRef = useRef(false)
  useEffect(() => {
    floorRef.current = state.spotlight === localIdentity
  }, [state.spotlight, localIdentity])
  useEffect(
    () =>
      subscribe((e) => {
        if (e.kind === "handLowered" && !floorRef.current)
          push({ id: "hand-lowered", text: labels.handLoweredByHost })
        if (e.kind === "muted") push({ id: "muted", text: labels.mutedByHost })
      }),
    [subscribe, push, labels]
  )

  // Student: the pen and the floor.
  const canDrawByGrant =
    !isHost && (state.grant === "*" || state.grant === localIdentity)
  const hadPen = useRef(canDrawByGrant)
  useEffect(() => {
    if (canDrawByGrant === hadPen.current) return
    hadPen.current = canDrawByGrant
    push({
      id: "pen",
      text: canDrawByGrant
        ? `✏️ ${labels.boardYouCanDraw}`
        : labels.boardPenTaken,
    })
  }, [canDrawByGrant, push, labels])

  const hasFloor = state.spotlight === localIdentity && !isHost
  const hadFloor = useRef(hasFloor)
  useEffect(() => {
    if (hasFloor === hadFloor.current) return
    hadFloor.current = hasFloor
    if (hasFloor) {
      navigator.vibrate?.(20)
      push({ id: "floor", text: `🎙️ ${labels.youHaveFloor}`, ttl: 5000 })
    }
  }, [hasFloor, push, labels])
}
