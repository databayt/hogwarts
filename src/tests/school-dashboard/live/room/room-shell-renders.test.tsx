// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The shell's re-render budget. Chat state lives in a provider above the
 * shell's content, and the stage / control bar / side panel are memoised on
 * stable props, so a chat message must NOT re-render the stage or the shell —
 * only the chat reader (the discussion badge) updates.
 */
import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import type { RoomConfig } from "@/components/school-dashboard/live/types"

const probe = vi.hoisted(() => ({
  stageRenders: 0,
  pushMessage: (_text: string) => {},
}))

vi.mock("@livekit/components-react", async () => {
  const React = await import("react")
  const local = { identity: "me-1", name: "Me" }
  return {
    useLocalParticipant: () => ({ localParticipant: local }),
    useRoomContext: () => ({
      disconnect: async () => {},
      on: () => {},
      off: () => {},
    }),
    useConnectionState: () => "connected",
    useRemoteParticipants: () => [],
    RoomAudioRenderer: () => null,
    useChat: () => {
      const [chatMessages, setMessages] = React.useState<
        Array<{
          id: string
          message: string
          timestamp: number
          from: { identity: string; name: string }
        }>
      >([])
      probe.pushMessage = (text: string) =>
        setMessages((m) => [
          ...m,
          {
            id: `m${m.length}`,
            message: text,
            timestamp: Date.now(),
            from: { identity: "teacher-1", name: "Teacher" },
          },
        ])
      return { chatMessages, send: async () => ({}), isSending: false }
    },
    useParticipants: () => [],
  }
})
vi.mock("@/components/school-dashboard/live/actions/chat", () => ({
  getRoomChat: vi.fn(async () => ({
    success: true,
    data: { messages: [], hasMore: false },
  })),
  recordChatMessage: vi.fn(async () => ({ success: true })),
}))
vi.mock("@/components/school-dashboard/live/room/stage", async () => {
  const { memo } = await import("react")
  return {
    Stage: memo(function Stage() {
      probe.stageRenders++
      return null
    }),
  }
})
vi.mock("@/components/school-dashboard/live/room/use-class-channel", () => ({
  // A NEW object each call, as the real hook returns.
  useClassChannel: () => ({
    state: initialClassState(),
    isHost: false,
    hostIdentity: null,
    send: async () => {},
    sendStroke: async () => {},
    hands: [],
    handUp: false,
    setHand: async () => {},
    clearHand: async () => {},
    handsSince: new Map(),
    clearAllHands: async () => {},
    canDraw: false,
    sendDraft: () => {},
    sendReaction: () => {},
    setGrant: async () => {},
    subscribe: () => () => {},
    localIdentity: "me",
  }),
}))
vi.mock(
  "@/components/school-dashboard/live/room/use-adaptive-delivery",
  () => ({
    useAdaptiveDelivery: () => ({
      tier: "high",
      quality: "excellent",
      manual: null,
      setManual: () => {},
    }),
  })
)
vi.mock("@/components/lumos/shared/video-player/video-watermark", () => ({
  VideoWatermark: () => null,
}))
vi.mock("@/components/school-dashboard/live/actions/room-events", () => ({
  recordClassEvent: vi.fn(async () => ({ success: true })),
}))
vi.mock("@/components/school-dashboard/live/actions/connection-trace", () => ({
  recordConnectionTrace: vi.fn(async () => ({ success: true })),
}))

const { RoomShell } =
  await import("@/components/school-dashboard/live/room/room-shell")

const labels = resolveRoomLabels(undefined)
const config: RoomConfig = {
  joinMuted: true,
  tools: {
    chat: true,
    hands: true,
    polls: true,
    whiteboard: true,
    studentShare: false,
  },
  consentNote: null,
  recording: false,
}

describe("RoomShell re-renders", () => {
  it("a chat message updates the discussion badge without re-rendering the stage", async () => {
    render(
      <RoomShell
        sessionId="s1"
        title="Mathematics"
        role="OBSERVER"
        hostIdentity={null}
        labels={labels}
        participantsLabels={{
          title: "Participants",
          remove: "Remove",
          removing: "Removing…",
          removed: "Participant removed",
          failed: "Couldn't remove participant",
          empty: "No other participants",
        }}
        slides={[]}
        config={config}
        clock={{ startsAtMs: null, endsAtMs: null }}
      />
    )
    const before = probe.stageRenders
    expect(before).toBeGreaterThan(0)

    await act(async () => {
      probe.pushMessage("hello")
    })

    // The unread count reached the control row's discussion disc…
    expect(
      screen.getByRole("button", { name: `${labels.discussion} (1)` })
    ).toBeTruthy()
    // …and the stage was not touched.
    expect(probe.stageRenders).toBe(before)
  })
})
