// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import StudentView from "@/components/school-dashboard/timetable/views/student-view"

const m = vi.hoisted(() => ({
  getTimetableByStudentGrade: vi.fn(),
  getTimetableByTeacher: vi.fn(),
  getTodaySchedule: vi.fn(),
}))

vi.mock("@/components/school-dashboard/timetable/actions", () => ({
  getTimetableByStudentGrade: m.getTimetableByStudentGrade,
  getTimetableByTeacher: m.getTimetableByTeacher,
  getTodaySchedule: m.getTodaySchedule,
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock("@/components/school-dashboard/live/actions/sessions", () => ({
  createLiveClassFromTimetable: vi.fn(),
}))
vi.mock("@/components/atom/toast", () => ({ ErrorToast: vi.fn() }))
vi.mock(
  "@/components/school-dashboard/timetable/views/slot-detail-dialog",
  () => ({ SlotDetailDialog: () => null })
)

const PERIODS = [
  {
    id: "p1",
    name: "1",
    order: 1,
    startTime: new Date("1970-01-01T08:00:00Z"),
    endTime: new Date("1970-01-01T08:45:00Z"),
    isBreak: false,
  },
]
const WEEK = {
  slots: [
    {
      id: "s1",
      dayOfWeek: 0,
      periodId: "p1",
      periodName: "1",
      subject: "Physics-Seeded",
      teacher: "",
      room: "",
    },
  ],
  periods: PERIODS,
  liveIndicators: {},
  liveJoin: {},
  onlineToday: [],
  joinWindows: {},
  liveEnabled: false,
}

function view(extra: Record<string, unknown>) {
  return (
    <StudentView
      dictionary={{ timetable: {}, liveClasses: {} } as never}
      lang="en"
      termId="term-1"
      termInfo={{ id: "term-1", termNumber: 1, yearName: "2026", label: "T1" }}
      workingDays={[0, 1, 2, 3, 4]}
      periods={PERIODS}
      lunchAfterPeriod={null}
      {...extra}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom has no matchMedia; the view reads it on mount.
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as never
  m.getTimetableByStudentGrade.mockResolvedValue(WEEK)
  m.getTimetableByTeacher.mockResolvedValue(WEEK)
  m.getTodaySchedule.mockResolvedValue({ schedule: [], dayOfWeek: 0 })
})

describe("StudentView — streamed first screen", () => {
  it("fires no server action on mount when the week and today are seeded", async () => {
    render(
      view({
        initialGrid: WEEK,
        initialToday: { closure: null, dayOfWeek: 0 },
      })
    )

    // The seeded grid is on screen at once (no skeleton frame first)…
    expect(screen.getByText("Physics-Seeded")).toBeTruthy()
    // …and neither action fires, not even after effects have flushed.
    await new Promise((r) => setTimeout(r, 0))
    expect(m.getTimetableByStudentGrade).not.toHaveBeenCalled()
    expect(m.getTimetableByTeacher).not.toHaveBeenCalled()
    expect(m.getTodaySchedule).not.toHaveBeenCalled()
  })

  it("fires none for a seeded teacher either", async () => {
    render(
      view({
        teacherId: "tea-1",
        initialGrid: WEEK,
        initialToday: { closure: null, dayOfWeek: 0 },
      })
    )

    await new Promise((r) => setTimeout(r, 0))
    expect(m.getTimetableByTeacher).not.toHaveBeenCalled()
    expect(m.getTodaySchedule).not.toHaveBeenCalled()
  })

  it("loads for itself when there is no seed (the old path)", async () => {
    render(view({}))

    await waitFor(() =>
      expect(m.getTimetableByStudentGrade).toHaveBeenCalledWith({
        termId: "term-1",
      })
    )
    expect(m.getTodaySchedule).toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText("Physics-Seeded")).toBeTruthy())
  })

  it("loads for itself when only the week arrived (no closure to show)", async () => {
    render(view({ initialGrid: WEEK }))

    await waitFor(() =>
      expect(m.getTimetableByStudentGrade).toHaveBeenCalled()
    )
  })

  it("still loads when the term changes after the seeded first view", async () => {
    const seeded = {
      initialGrid: WEEK,
      initialToday: { closure: null, dayOfWeek: 0 },
    }
    const { rerender } = render(view(seeded))
    await new Promise((r) => setTimeout(r, 0))
    expect(m.getTimetableByStudentGrade).not.toHaveBeenCalled()

    rerender(view({ ...seeded, termId: "term-2" }))

    await waitFor(() =>
      expect(m.getTimetableByStudentGrade).toHaveBeenCalledWith({
        termId: "term-2",
      })
    )
  })
})
