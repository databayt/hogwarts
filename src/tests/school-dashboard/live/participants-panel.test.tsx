// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ParticipantsPanel } from "@/components/school-dashboard/live/participants-panel"

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
vi.mock("@/components/school-dashboard/live/actions/moderation", () => ({
  kickParticipant,
}))
vi.mock("@/components/atom/toast", () => ({ SuccessToast, ErrorToast }))

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

    fireEvent.click(screen.getAllByRole("button", { name: /^remove:/i })[0])

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
    kickParticipant.mockResolvedValue({
      success: false,
      error: "UPDATE_FAILED",
    })

    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    fireEvent.click(screen.getByRole("button", { name: /^remove:/i }))

    await waitFor(() => expect(ErrorToast).toHaveBeenCalledWith(labels.failed))
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("falls back to identity when a participant has no name", () => {
    state.participants = [{ identity: "user-xyz" }]
    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)
    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    expect(screen.getByText("user-xyz")).toBeInTheDocument()
  })

  // lr-02: the list used to close only via its own toggle, or Escape while
  // focus was still inside it — pinning the whole chrome (`onOpenChange`)
  // visible with no other way to let go of it.
  it("closes on a pointerdown outside the panel, like control-bar.tsx's Menu", () => {
    state.participants = [{ identity: "u1", name: "Alice" }]
    const onOpenChange = vi.fn()
    render(
      <ParticipantsPanel
        sessionId="s1"
        canModerate
        labels={labels}
        onOpenChange={onOpenChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    fireEvent.pointerDown(document.body)

    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("stays open on a pointerdown inside the panel", () => {
    state.participants = [{ identity: "u1", name: "Alice" }]
    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    fireEvent.click(screen.getByRole("button", { name: /participants \(1\)/i }))
    fireEvent.pointerDown(screen.getByText("Alice"))

    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("does NOT steal focus back to the toggle on an outside-pointer close", () => {
    // Forcing focus onto the toggle here would trip room-shell.tsx's
    // `onFocusCapture` and re-pin the chrome right after a stage tap tried
    // to let it auto-hide — the toggle should only reclaim focus on the
    // KEYBOARD dismissal path (Escape), tested below.
    state.participants = [{ identity: "u1", name: "Alice" }]
    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    const toggle = screen.getByRole("button", { name: /participants \(1\)/i })
    fireEvent.click(toggle)
    document.body.focus()

    fireEvent.pointerDown(document.body)

    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    expect(document.activeElement).not.toBe(toggle)
  })

  it("closes on Escape even when focus has moved off the panel, and returns focus to the toggle", () => {
    state.participants = [{ identity: "u1", name: "Alice" }]
    render(<ParticipantsPanel sessionId="s1" canModerate labels={labels} />)

    const toggle = screen.getByRole("button", { name: /participants \(1\)/i })
    fireEvent.click(toggle)
    expect(screen.getByText("Alice")).toBeInTheDocument()

    // Focus lands elsewhere entirely (e.g. the mic button) — the panel's
    // own `onKeyDown` would have missed this; the document listener must not.
    document.body.focus()
    fireEvent.keyDown(document, { key: "Escape" })

    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    expect(document.activeElement).toBe(toggle)
  })
})
