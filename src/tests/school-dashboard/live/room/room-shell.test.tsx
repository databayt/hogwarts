// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-01: the in-call chrome dropped the class name entirely once the title
 * pill left it (CLAUDE.md "in-call chrome is the player's phone layout").
 * On an OPEN room (`clock` null) `ClassProgress` renders nothing at all, so
 * without a fallback line the bottom card named the class to no one. The
 * fix prints `title` — the player's own `infoTitle` pattern — above the
 * clock inside the glass card.
 *
 * Heavy LiveKit children (`Stage`, adaptive delivery, the class channel) are
 * stubbed: this test is only about the fallback title line, not the whole
 * room tree, and most of that surface needs a real SFU room to exercise
 * meaningfully.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import type { RoomConfig } from "@/components/school-dashboard/live/types"

vi.mock("@livekit/components-react", () => ({
  useLocalParticipant: () => ({
    localParticipant: { identity: "me-1", name: "Me" },
  }),
  useRoomContext: () => ({ disconnect: async () => {} }),
  useConnectionState: () => "connected",
  useRemoteParticipants: () => [],
}))
vi.mock("@/components/school-dashboard/live/room/stage", () => ({
  Stage: () => null,
}))
vi.mock("@/components/school-dashboard/live/room/use-class-channel", () => ({
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

// Imported AFTER the mocks above, so RoomShell picks up the stubbed modules.
const { RoomShell } =
  await import("@/components/school-dashboard/live/room/room-shell")

const labels = resolveRoomLabels(undefined)
const participantsLabels = {
  title: "Participants",
  remove: "Remove",
  removing: "Removing…",
  removed: "Participant removed",
  failed: "Couldn't remove participant",
  empty: "No other participants",
}
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

const baseProps = {
  sessionId: "s1",
  title: "Mathematics",
  role: "OBSERVER" as const,
  hostIdentity: null,
  labels,
  participantsLabels,
  slides: [],
  config,
}

describe("RoomShell fallback title line (lr-01)", () => {
  it("prints the title above the clock on an OPEN room (no clock)", () => {
    render(
      <RoomShell {...baseProps} clock={{ startsAtMs: null, endsAtMs: null }} />
    )
    expect(screen.getByText("Mathematics")).toBeInTheDocument()
  })

  it("prints NO title when the room has a clock — the frame's card opens on the scrubber", () => {
    const now = Date.now()
    render(
      <RoomShell
        {...baseProps}
        clock={{ startsAtMs: now - 60_000, endsAtMs: now + 60_000 }}
      />
    )
    expect(screen.queryByText("Mathematics")).not.toBeInTheDocument()
  })
})
