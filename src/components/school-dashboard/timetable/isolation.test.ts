import { beforeEach, describe, expect, it, vi } from "vitest"

import { getWeeklyTimetable, upsertTimetableSlot } from "./actions"

const getTenantContext = vi.fn()
vi.mock("@/components/school-dashboard/saas-dashboard/lib/tenant", () => ({
  getTenantContext,
}))

const termFindFirst = vi.fn()
const periodFindMany = vi.fn()
const timetableFindMany = vi.fn()
const timetableUpsert = vi.fn()
const schoolWeekConfigFindFirst = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    term: { findFirst: termFindFirst },
    period: { findMany: periodFindMany },
    timetable: { findMany: timetableFindMany, upsert: timetableUpsert },
    schoolWeekConfig: { findFirst: schoolWeekConfigFindFirst },
  },
}))

describe("tenant isolation and schedule resolution", () => {
  beforeEach(() => {
    getTenantContext.mockResolvedValue({ schoolId: "s1", role: "ADMIN" })
    termFindFirst.mockReset()
    periodFindMany.mockReset()
    timetableFindMany.mockReset()
    timetableUpsert.mockReset()
    schoolWeekConfigFindFirst.mockReset()
  })

  it("scopes weekly timetable query by schoolId", async () => {
    schoolWeekConfigFindFirst.mockResolvedValue({
      workingDays: [0, 1, 2, 3, 4],
      defaultLunchAfterPeriod: 2,
    })
    termFindFirst.mockResolvedValue({ yearId: "year1" })
    periodFindMany.mockResolvedValue([
      {
        id: "p1",
        name: "Period 1",
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T08:45:00Z"),
      },
    ])
    timetableFindMany.mockResolvedValue([])
    await getWeeklyTimetable({ termId: "t1" })
    const call = timetableFindMany.mock.calls[0]?.[0]
    expect(call?.where?.schoolId).toBe("s1")
  })

  it("scopes upsertTimetableSlot by schoolId and enforces role", async () => {
    timetableUpsert.mockResolvedValue({ id: "tt1" })
    const res = await upsertTimetableSlot({
      termId: "t1",
      dayOfWeek: 0,
      periodId: "p1",
      classId: "c1",
      teacherId: "tch1",
      classroomId: "r1",
    })
    expect(timetableUpsert).toHaveBeenCalled()
    const call = timetableUpsert.mock.calls[0]?.[0]
    expect(
      call?.where?.schoolId_termId_dayOfWeek_periodId_classId_weekOffset
        ?.schoolId
    ).toBe("s1")

    // deny non-admin
    getTenantContext.mockResolvedValueOnce({ schoolId: "s1", role: "TEACHER" })
    const denied = await upsertTimetableSlot({
      termId: "t1",
      dayOfWeek: 0,
      periodId: "p1",
      classId: "c1",
      teacherId: "tch1",
      classroomId: "r1",
    })
    expect(denied instanceof Response).toBe(true)
  })

  it("resolves schedule config days and lunch correctly", async () => {
    schoolWeekConfigFindFirst.mockResolvedValue({
      workingDays: [0, 2, 4],
      defaultLunchAfterPeriod: 3,
    })
    termFindFirst.mockResolvedValue({ yearId: "y1" })
    periodFindMany.mockResolvedValue([
      {
        id: "p1",
        name: "P1",
        startTime: new Date("1970-01-01T07:00:00Z"),
        endTime: new Date("1970-01-01T07:45:00Z"),
      },
      {
        id: "p2",
        name: "P2",
        startTime: new Date("1970-01-01T07:50:00Z"),
        endTime: new Date("1970-01-01T08:35:00Z"),
      },
    ])
    timetableFindMany.mockResolvedValue([])
    const res = await getWeeklyTimetable({ termId: "t1" })
    expect(res.days).toEqual([0, 2, 4])
    expect(res.lunchAfterPeriod).toBe(3)
  })
})
