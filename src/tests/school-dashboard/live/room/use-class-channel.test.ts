// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `useClassChannel`'s host-trust derivation — the client half of live-01.
 *
 * A PARTICIPANT (student) token carries `canUpdateOwnMetadata` (needed for
 * hand-raising), which lets a student's own client rewrite
 * `localParticipant.attributes.role` to "HOST" at will. The hook must never
 * treat that as host-authoritative: trust comes ONLY from the ticket's
 * `hostIdentity` and the server-published room-metadata host set
 * (`{ hosts: string[] }`, written via `livekit/rooms.ts addRoomHost`, which
 * needs `roomAdmin` — a grant no PARTICIPANT or CO_HOST token carries).
 */

import { act, renderHook } from "@testing-library/react"
import { ConnectionState, RoomEvent } from "livekit-client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  encodeMessage,
  type ClassMessage,
} from "@/components/school-dashboard/live/room/class-channel"
import {
  HAND_ATTRIBUTE,
  useClassChannel,
} from "@/components/school-dashboard/live/room/use-class-channel"

type Listener = (...args: unknown[]) => void

/** Minimal fake LiveKit `Room` — just enough surface for the hook. */
function makeRoom(metadata: string | null) {
  const listeners = new Map<string, Set<Listener>>()
  return {
    metadata,
    state: ConnectionState.Connected,
    localParticipant: {
      identity: "me-1",
      name: "Me",
      attributes: {} as Record<string, string>,
      setAttributes: vi.fn(async () => undefined),
    },
    remoteParticipants: new Map(),
    on(event: string, cb: Listener) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(cb)
      return this
    },
    off(event: string, cb: Listener) {
      listeners.get(event)?.delete(cb)
      return this
    },
    emit(event: string, ...args: unknown[]) {
      for (const cb of listeners.get(event) ?? []) cb(...args)
    },
  }
}

type FakeRoom = ReturnType<typeof makeRoom>

const state = vi.hoisted(() => ({
  room: undefined as unknown,
  onMessage: undefined as unknown,
  sendSpy: vi.fn(async () => undefined),
}))

vi.mock("@livekit/components-react", () => ({
  useRoomContext: () => state.room,
  useLocalParticipant: () => ({
    localParticipant: (state.room as FakeRoom).localParticipant,
  }),
  useDataChannel: (_topic: string, onMessage: unknown) => {
    state.onMessage = onMessage
    return { send: state.sendSpy }
  },
}))

/** Simulate an inbound data-channel message from `from`. */
function deliver(
  msg: ClassMessage,
  from: { identity: string; name?: string; attributes?: Record<string, string> }
) {
  const cb = state.onMessage as (raw: {
    payload: Uint8Array
    from: typeof from
  }) => void
  act(() => {
    cb({ payload: encodeMessage(msg), from })
  })
}

const HOST_ID = "teacher-1"

beforeEach(() => {
  state.sendSpy.mockClear()
})

describe("useClassChannel — host trust", () => {
  it("trusts the ticket's hostIdentity by identity alone", () => {
    state.room = makeRoom(null)
    const { result } = renderHook(() =>
      useClassChannel({ hostIdentity: HOST_ID, isHost: false })
    )
    deliver(
      { t: "poll.open", id: "p1", question: "2+2?", options: ["3", "4"] },
      { identity: HOST_ID, name: "Teacher" }
    )
    expect(result.current.state.poll).toMatchObject({ id: "p1", open: true })
  })

  it('a PARTICIPANT self-reporting attributes.role="HOST" is NOT treated as host', () => {
    state.room = makeRoom(null)
    const { result } = renderHook(() =>
      useClassChannel({ hostIdentity: HOST_ID, isHost: false })
    )
    // Legitimate host opens a poll first.
    deliver(
      { t: "poll.open", id: "p1", question: "2+2?", options: ["3", "4"] },
      { identity: HOST_ID, name: "Teacher" }
    )
    expect(result.current.state.poll?.open).toBe(true)

    // A student forges the OLD trust signal — self-edited attributes — and
    // tries to close the poll. Neither `hostIdentity` nor the room-metadata
    // host set names this identity.
    deliver(
      { t: "poll.close", id: "p1" },
      {
        identity: "student-attacker",
        name: "Eve",
        attributes: { role: "HOST" },
      }
    )
    expect(result.current.state.poll?.open).toBe(true) // unchanged — rejected
  })

  it("a co-host published in ROOM metadata (addRoomHost) IS trusted", () => {
    state.room = makeRoom(JSON.stringify({ hosts: ["co-host-1"] }))
    const { result } = renderHook(() =>
      useClassChannel({ hostIdentity: HOST_ID, isHost: false })
    )
    deliver(
      { t: "poll.open", id: "p1", question: "2+2?", options: ["3", "4"] },
      { identity: HOST_ID }
    )
    deliver({ t: "poll.close", id: "p1" }, { identity: "co-host-1" })
    expect(result.current.state.poll?.open).toBe(false)
  })

  it("a later co-host is trusted once RoomMetadataChanged fires — no attributes.role needed", () => {
    state.room = makeRoom(null)
    const { result } = renderHook(() =>
      useClassChannel({ hostIdentity: HOST_ID, isHost: false })
    )

    // Before the server publishes it, this identity is untrusted.
    deliver(
      { t: "poll.open", id: "p1", question: "x", options: ["a", "b"] },
      { identity: "co-host-2" }
    )
    expect(result.current.state.poll).toBeNull()

    // join-core resolves them as CO_HOST and calls addRoomHost — the room's
    // metadata changes and the client re-syncs its trust set.
    const room = state.room as FakeRoom
    act(() => {
      room.metadata = JSON.stringify({ hosts: ["co-host-2"] })
      room.emit(RoomEvent.RoomMetadataChanged)
    })

    deliver(
      { t: "poll.open", id: "p2", question: "y", options: ["a", "b"] },
      { identity: "co-host-2" }
    )
    expect(result.current.state.poll).toMatchObject({ id: "p2" })
  })

  it("hand.clear from a spoofed attributes.role is ignored; from a real host it clears the local hand", () => {
    state.room = makeRoom(null)
    renderHook(() => useClassChannel({ hostIdentity: HOST_ID, isHost: false }))
    const localParticipant = (state.room as FakeRoom).localParticipant

    deliver(
      { t: "hand.clear" },
      { identity: "student-attacker", attributes: { role: "HOST" } }
    )
    expect(localParticipant.setAttributes).not.toHaveBeenCalled()

    deliver({ t: "hand.clear" }, { identity: HOST_ID })
    expect(localParticipant.setAttributes).toHaveBeenCalledWith({
      [HAND_ATTRIBUTE]: "",
    })
  })
})
