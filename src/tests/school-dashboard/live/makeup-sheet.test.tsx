// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The make-up sheet: it asks the server for free times when it opens, books
// the chosen one, says so on a conflict (and reloads), and reads a typed time
// in the SCHOOL's zone — not the device's.

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MakeupLabels } from "@/components/school-dashboard/live/makeup-badge"
import {
  MakeupSheet,
  wallToIso,
} from "@/components/school-dashboard/live/makeup-sheet"

const h = vi.hoisted(() => ({
  suggest: vi.fn(),
  create: vi.fn(),
  replan: vi.fn(),
  cancel: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock("@/components/school-dashboard/live/actions/makeup", () => ({
  suggestMakeupSlotsAction: h.suggest,
  createMakeupAction: h.create,
  replanMakeupAction: h.replan,
  cancelMakeupAction: h.cancel,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: h.refresh, push: vi.fn() }),
}))
vi.mock("@/components/atom/toast", () => ({
  SuccessToast: h.success,
  ErrorToast: h.error,
}))

const labels = {
  cta: "Make up this class",
  sheetTitle: "Make-up class",
  pickDay: "Pick a day",
  pickTime: "Pick a time",
  otherTime: "Another time",
  noSlots: "No time is free",
  confirm: "Confirm make-up class",
  bookThis: "Book this time",
  bestTitle: "Earliest free time",
  creating: "Scheduling the class…",
  scheduled: "The make-up class is scheduled.",
  replan: "Change the time",
  loadingSlots: "Finding free times…",
  customDate: "Date",
  customTime: "Start time",
  errors: {
    MAKEUP_CONFLICT: "This time clashes with another class.",
    MAKEUP_ALREADY_PLANNED: "Already planned.",
    MAKEUP_NOT_ELIGIBLE: "Not eligible.",
  },
} as unknown as MakeupLabels

const suggestions = {
  success: true,
  data: {
    missedId: "missed-1",
    durationMin: 45,
    timeZone: "Asia/Tokyo",
    days: [
      {
        day: "2026-12-01",
        dayOfWeek: 2,
        slots: [
          {
            startIso: "2026-12-01T05:00:00.000Z",
            endIso: "2026-12-01T05:45:00.000Z",
            kind: "period",
            periodId: "p-3",
            periodName: "Period 3",
          },
          {
            startIso: "2026-12-01T07:00:00.000Z",
            endIso: "2026-12-01T07:45:00.000Z",
            kind: "after_last",
            periodId: null,
            periodName: null,
          },
        ],
      },
      {
        day: "2026-12-02",
        dayOfWeek: 3,
        slots: [
          {
            startIso: "2026-12-02T05:00:00.000Z",
            endIso: "2026-12-02T05:45:00.000Z",
            kind: "period",
            periodId: "p-3",
            periodName: "Period 4",
          },
        ],
      },
    ],
  },
}

async function openSheet(
  props: Partial<Parameters<typeof MakeupSheet>[0]> = {}
) {
  render(
    <MakeupSheet missedId="missed-1" labels={labels} lang="en" {...props} />
  )
  fireEvent.click(screen.getByRole("button", { name: "Make up this class" }))
  await screen.findByText("Period 3")
}

beforeEach(() => {
  vi.clearAllMocks()
  h.suggest.mockResolvedValue(suggestions)
})

describe("MakeupSheet", () => {
  it("asks for suggestions when opened and shows days and the day's times", async () => {
    await openSheet()

    expect(h.suggest).toHaveBeenCalledWith({ missedId: "missed-1" })
    // Day chips: the school's calendar day, whatever the device zone is.
    expect(
      screen.getByRole("button", { name: /Tue.*Dec 1/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Wed.*Dec 2/ })
    ).toBeInTheDocument()
    // Time chips: the period's name, else the start–end range in school time
    // (07:00Z is 4 PM in Tokyo).
    expect(screen.getByRole("button", { name: "Period 3" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /04:00 PM.*04:45 PM/ })
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Period 4" })).toBeNull()
  })

  it("books the chosen slot, toasts, closes and refreshes", async () => {
    h.create.mockResolvedValue({ success: true, data: { id: "makeup-1" } })
    await openSheet()

    // Picking a time yourself brings the confirm button; it books YOUR choice.
    fireEvent.click(screen.getByRole("button", { name: "Period 3" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm make-up class" })
    )

    await waitFor(() =>
      expect(h.create).toHaveBeenCalledWith({
        missedId: "missed-1",
        startIso: "2026-12-01T05:00:00.000Z",
        endIso: "2026-12-01T05:45:00.000Z",
      })
    )
    await waitFor(() => expect(h.refresh).toHaveBeenCalled())
    expect(h.success).toHaveBeenCalledWith("The make-up class is scheduled.")
  })

  it("says so on a conflict and reloads the suggestions", async () => {
    h.create.mockResolvedValue({ success: false, error: "MAKEUP_CONFLICT" })
    await openSheet()

    fireEvent.click(screen.getByRole("button", { name: "Period 3" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm make-up class" })
    )

    expect(
      await screen.findByText("This time clashes with another class.")
    ).toBeInTheDocument()
    await waitFor(() => expect(h.suggest).toHaveBeenCalledTimes(2))
    expect(h.refresh).not.toHaveBeenCalled()
    // The choice is reset: the fresh earliest time is offered again.
    expect(
      screen.queryByRole("button", { name: "Confirm make-up class" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Book this time" })
    ).toBeInTheDocument()
  })

  it("reads a typed time in the school's zone, not the device's", async () => {
    h.create.mockResolvedValue({ success: true, data: { id: "makeup-1" } })
    await openSheet()

    fireEvent.click(screen.getByRole("button", { name: "Another time" }))
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2026-12-03" },
    })
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "10:00" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm make-up class" })
    )

    // 10:00 in Tokyo (UTC+9) is 01:00Z; the end is start + the class's 45 min.
    await waitFor(() =>
      expect(h.create).toHaveBeenCalledWith({
        missedId: "missed-1",
        startIso: "2026-12-03T01:00:00.000Z",
        endIso: "2026-12-03T01:45:00.000Z",
      })
    )
  })

  it("shows the empty state when no time is free", async () => {
    h.suggest.mockResolvedValue({
      success: true,
      data: { ...suggestions.data, days: [] },
    })
    render(<MakeupSheet missedId="missed-1" labels={labels} lang="en" />)
    fireEvent.click(screen.getByRole("button", { name: "Make up this class" }))

    expect(await screen.findByText("No time is free")).toBeInTheDocument()
  })

  it("re-plans a scheduled make-up through the replan action", async () => {
    h.replan.mockResolvedValue({ success: true, data: { id: "makeup-2" } })
    render(
      <MakeupSheet
        mode="replan"
        missedId="missed-1"
        makeupId="makeup-1"
        labels={labels}
        lang="en"
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Change the time" }))
    fireEvent.click(await screen.findByRole("button", { name: "Period 3" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm make-up class" })
    )

    await waitFor(() =>
      expect(h.replan).toHaveBeenCalledWith({
        makeupId: "makeup-1",
        startIso: "2026-12-01T05:00:00.000Z",
        endIso: "2026-12-01T05:45:00.000Z",
      })
    )
    expect(h.create).not.toHaveBeenCalled()
  })
})

describe("MakeupSheet — one tap", () => {
  it("offers the earliest free time first and books it with one tap", async () => {
    h.create.mockResolvedValue({ success: true, data: { id: "makeup-1" } })
    await openSheet()

    // Shown prominently, in the school's zone (Tokyo, UTC+9 → 14:00).
    expect(screen.getByText("Earliest free time")).toBeInTheDocument()
    expect(screen.getByText(/Tue, Dec 1 · 02:00 PM/)).toBeInTheDocument()
    // No second confirm until the viewer picks something themselves.
    expect(
      screen.queryByRole("button", { name: "Confirm make-up class" })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Book this time" }))
    await waitFor(() =>
      expect(h.create).toHaveBeenCalledWith({
        missedId: "missed-1",
        startIso: "2026-12-01T05:00:00.000Z",
        endIso: "2026-12-01T05:45:00.000Z",
      })
    )
  })
})

describe("wallToIso", () => {
  it("converts school wall-clock time with the school's zone", () => {
    expect(wallToIso("2026-12-03T10:00", "Asia/Tokyo")).toBe(
      "2026-12-03T01:00:00.000Z"
    )
    expect(wallToIso("2026-12-03T10:00", "Africa/Khartoum")).toBe(
      "2026-12-03T08:00:00.000Z"
    )
  })
})
