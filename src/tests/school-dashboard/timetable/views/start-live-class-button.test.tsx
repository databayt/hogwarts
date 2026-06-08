// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StartLiveClassButton } from "@/components/school-dashboard/timetable/views/start-live-class-button"

const { push, createLiveClassFromTimetable, ErrorToast } = vi.hoisted(() => ({
  push: vi.fn(),
  createLiveClassFromTimetable: vi.fn(),
  ErrorToast: vi.fn(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/components/school-dashboard/conference/actions/sessions", () => ({
  createLiveClassFromTimetable,
}))
vi.mock("@/components/atom/toast", () => ({ ErrorToast }))

const labels = {
  label: "Start live class",
  startingLabel: "Starting…",
  errorLabel: "Couldn't start the live class",
}

beforeEach(() => {
  push.mockReset()
  createLiveClassFromTimetable.mockReset()
  ErrorToast.mockReset()
})

describe("StartLiveClassButton", () => {
  it("renders nothing without a timetableId", () => {
    const { container } = render(
      <StartLiveClassButton timetableId={null} lang="en" {...labels} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("starts the class and routes to the in-app room on success", async () => {
    createLiveClassFromTimetable.mockResolvedValue({
      success: true,
      data: { id: "lcs-9" },
    })
    render(<StartLiveClassButton timetableId="tt-1" lang="en" {...labels} />)

    fireEvent.click(screen.getByRole("button", { name: /start live class/i }))

    await waitFor(() =>
      expect(createLiveClassFromTimetable).toHaveBeenCalledWith({
        timetableId: "tt-1",
      })
    )
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/en/conference/lcs-9/room")
    )
    expect(ErrorToast).not.toHaveBeenCalled()
  })

  it("shows an error toast and does not route on failure", async () => {
    createLiveClassFromTimetable.mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_PROVIDER_UNAVAILABLE",
    })
    render(<StartLiveClassButton timetableId="tt-1" lang="en" {...labels} />)

    fireEvent.click(screen.getByRole("button", { name: /start live class/i }))

    await waitFor(() =>
      expect(ErrorToast).toHaveBeenCalledWith(labels.errorLabel)
    )
    expect(push).not.toHaveBeenCalled()
  })
})
