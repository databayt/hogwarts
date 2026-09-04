// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * lr-03: the panel toggle's pending-items badge (unanswered questions, an
 * open poll) was rendered `aria-hidden` on both branches, so a screen reader
 * heard only "Discussion, button" no matter how much was waiting. The fix
 * folds the same count into the button's `aria-label`.
 *
 * Rendered with `role="OBSERVER"` — the one role for which `ControlBar`
 * mounts no other control (camera/mic/share/more all gate on `canPublish`),
 * so the discussion button is exercised without needing to mock any LiveKit
 * track/device hook.
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { initialClassState } from "@/components/school-dashboard/live/room/class-channel"
import { ControlBar } from "@/components/school-dashboard/live/room/control-bar"
import { resolveRoomLabels } from "@/components/school-dashboard/live/room/labels"
import type { ClassChannel } from "@/components/school-dashboard/live/room/use-class-channel"

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

describe("ControlBar discussion button aria-label (lr-03)", () => {
  it("carries only the label when nothing is pending", () => {
    render(<ControlBar {...baseProps} channel={makeChannel()} />)
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
    render(<ControlBar {...baseProps} channel={channel} />)
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
    render(<ControlBar {...baseProps} channel={channel} />)
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
    render(<ControlBar {...baseProps} channel={channel} />)
    const badge = screen.getByText("1")
    expect(badge).toHaveAttribute("aria-hidden")
  })
})
