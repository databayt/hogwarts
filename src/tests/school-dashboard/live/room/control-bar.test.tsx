// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-03: the panel toggle's pending-items badge (unanswered questions, an
 * open poll) was rendered `aria-hidden` on both branches, so a screen reader
 * heard only "Discussion, button" no matter how much was waiting. The fix
 * folds the same count into the button's `aria-label`.
 *
 * Since 2026-09-13 the toggle is the discussion DISC in the room's one row of
 * controls. For an OBSERVER `ClassControls` mounts no LiveKit track or device
 * hook, so it renders without mocking any.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { ClassControls } from "@/components/school-dashboard/live/room/control-bar"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import type { ClassChannel } from "@/components/school-dashboard/live/room/use-class-channel"

// A student's row mounts the camera and microphone discs, which read LiveKit
// track state; an observer's mounts neither.
vi.mock("@livekit/components-react", () => ({
  useTrackToggle: () => ({
    enabled: false,
    pending: false,
    toggle: async () => {},
    buttonProps: {},
  }),
  useMediaDeviceSelect: () => ({
    devices: [],
    activeDeviceId: "",
    setActiveMediaDevice: async () => {},
  }),
}))

const labels = resolveRoomLabels(undefined)

function makeChannel(over: Partial<ClassChannel["state"]> = {}): ClassChannel {
  return {
    state: { ...initialClassState(), ...over },
    isHost: true,
    hostIdentity: "host-1",
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
  }
}

const baseProps = {
  role: "OBSERVER" as const,
  labels,
  panel: null,
  onPanel: () => {},
  slides: [],
  tools: {
    chat: true,
    hands: true,
    polls: true,
    whiteboard: true,
    studentShare: false,
  },
}

describe("ClassControls discussion button aria-label (lr-03)", () => {
  it("carries only the label when nothing is pending", () => {
    render(<ClassControls {...baseProps} channel={makeChannel()} />)
    expect(
      screen.getByRole("button", { name: labels.discussion })
    ).toBeInTheDocument()
  })

  it("announces the pending count for unanswered questions", () => {
    const channel = makeChannel({
      questions: [
        { id: "q1", from: "u1", name: "A", text: "?", at: 0, answered: false },
        { id: "q2", from: "u2", name: "B", text: "?", at: 0, answered: true },
      ],
    })
    render(<ClassControls {...baseProps} channel={channel} />)
    expect(
      screen.getByRole("button", { name: `${labels.discussion} (1)` })
    ).toBeInTheDocument()
  })

  it("announces an open poll when nothing else is pending", () => {
    const channel = makeChannel({
      poll: {
        id: "p1",
        question: "Q",
        options: ["a", "b"],
        counts: [0, 0],
        total: 0,
        open: true,
      },
    })
    render(<ClassControls {...baseProps} channel={channel} />)
    expect(
      screen.getByRole("button", {
        name: `${labels.discussion} — ${labels.pollOpenAnnounce}`,
      })
    ).toBeInTheDocument()
  })

  it("the visual badge stays aria-hidden — the label alone carries the count", () => {
    const channel = makeChannel({
      questions: [
        { id: "q1", from: "u1", name: "A", text: "?", at: 0, answered: false },
      ],
    })
    render(<ClassControls {...baseProps} channel={channel} />)
    const badge = screen.getByText("1")
    expect(badge).toHaveAttribute("aria-hidden")
  })
})

// The school's Hands switch hid the teacher's hands list but not the
// student's disc: a hand went up that nobody had a place to see or lower.
describe("ClassControls follows the school's Hands switch", () => {
  const student = { ...baseProps, role: "PARTICIPANT" as const }

  it("offers a student the hand when the tool is on", () => {
    render(<ClassControls {...student} channel={makeChannel()} />)
    expect(
      screen.getByRole("button", { name: labels.raiseHand })
    ).toBeInTheDocument()
  })

  it("offers no hand when the school turned the tool off", () => {
    render(
      <ClassControls
        {...student}
        tools={{ ...baseProps.tools, hands: false }}
        channel={makeChannel()}
      />
    )
    expect(
      screen.queryByRole("button", { name: labels.raiseHand })
    ).not.toBeInTheDocument()
  })

  it("the host's discussion badge no longer counts hands it has no tab for", () => {
    const channel = { ...makeChannel(), hands: ["s1", "s2"] }
    render(
      <ClassControls
        {...baseProps}
        role="HOST"
        tools={{ ...baseProps.tools, hands: false }}
        channel={channel}
      />
    )
    expect(
      screen.getByRole("button", { name: labels.discussion })
    ).toBeInTheDocument()
  })
})

// An observer's seat cannot send data: a reaction showed on their own screen
// and reached nobody.
describe("ClassControls for a watching parent", () => {
  it("offers no reactions, hand, camera or microphone", () => {
    render(<ClassControls {...baseProps} channel={makeChannel()} />)
    for (const name of [labels.react, labels.raiseHand]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument()
    }
    expect(
      screen.getByRole("button", { name: labels.discussion })
    ).toBeInTheDocument()
  })
})
