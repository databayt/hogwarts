// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Hoisted spies so the hoisted vi.mock factories can reference them.
const state = vi.hoisted(() => ({
  participants: [] as Array<{ identity: string; name?: string }>,
}))
const { kickParticipant, SuccessToast, ErrorToast } = vi.hoisted(() => ({
  kickParticipant: vi.fn(),
  SuccessToast: vi.fn(),
  ErrorToast: vi.fn(),
}))

vi.mock("@livekit/components-react", () => ({
  useRemoteParticipants: () => state.participants,
}))
vi.mock("@/components/school-dashboard/conference/actions/moderation", () => ({ kickParticipant }))
vi.mock("@/components/atom/toast", () => ({ SuccessToast, ErrorToast }))

import { ParticipantsPanel } from "@/components/school-dashboard/conference/participants-panel"

const labels = {
  title: "Participants",
  remove: "Remove",
  removing: "Removing…",
  removed: "Participant removed",
  failed: "Couldn't remove participant",
  empty: "No other participants",
}

beforeEach(() => {
  state.participants = []
  kickParticipant.mockReset()
  SuccessToast.mockReset()
  ErrorToast.mockReset()
})

describe("ParticipantsPanel", () => {
  it("renders nothing for non-moderators", () => {
    state.participants = [{ identity: "u1", name: "Alice" }]
    const { container } = render(
      <ParticipantsPanel sessionId="s1" canModerate={false} labels={labels} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("lists remote participants behind the toggle and kicks on Remove", async () => {
    state.participants = [
      { identity: "u1", name: "Alice" },
      { identity: "u2", name: "Bob" },
    ]
    kickParticipant.mockResolvedValue({ success: true, data: { userId: "u1" } })

    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    fireEvent.click(screen.getByRole("button", { name: /participants \(2\)/i }))
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole("button", { name: /^remove$/i })[0])

    await waitFor(() =>
      expect(kickParticipant).toHaveBeenCalledWith("s1", "u1")
    )
    await waitFor(() =>
      expect(SuccessToast).toHaveBeenCalledWith(labels.removed)
    )
    // Alice optimistically hidden; Bob remains.
    await waitFor(() =>
      expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    )
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("shows an error toast and keeps the row when the kick fails", async () => {
    state.participants = [{ identity: "u1", name: "Alice" }]
    kickParticipant.mockResolvedValue({ success: false, error: "UPDATE_FAILED" })

    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    fireEvent.click(screen.getByRole("button", { name: /^remove$/i }))

    await waitFor(() => expect(ErrorToast).toHaveBeenCalledWith(labels.failed))
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("falls back to identity when a participant has no name", () => {
    state.participants = [{ identity: "user-xyz" }]
    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)
    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    expect(screen.getByText("user-xyz")).toBeInTheDocument()
  })
})
