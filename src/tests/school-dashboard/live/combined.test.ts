// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  combinedGroupForSlot,
  groupCombinedSlots,
  periodStartKey,
  sessionSectionIds,
} from "@/components/school-dashboard/live/combined"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"

vi.mock("@/lib/db", () => ({
  db: { timetable: { findFirst: vi.fn(), findMany: vi.fn() } },
}))
vi.mock("@/components/school-dashboard/live/online-policy", () => ({
  resolveOnlinePolicies: vi.fn(),
}))

/** Every section online, except the ones named. */
const onlineExcept =
  (...inPerson: string[]) =>
  async (_school: string, ids: string[]) =>
    new Map(ids.map((id) => [id, { online: !inPerson.includes(id) }]))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const at = (h: number, min = 0) => new Date(Date.UTC(1970, 0, 1, h, min))
const s = (
  id: string,
  sectionId: string,
  teacherId = "t-1",
  start = at(19)
) => ({
  id,
  sectionId,
  teacherId,
  period: { startTime: start },
})

describe("groupCombinedSlots", () => {
  it("makes one class of one teacher's sections at one start time — the smallest id owns the room", () => {
    // فادية: G7, G8, G9 English at 19:00, each on its grade's own Period row.
    const groups = groupCombinedSlots([
      s("b", "g8"),
      s("a", "g7"),
      s("c", "g9"),
    ])
    for (const id of ["a", "b", "c"]) {
      expect(groups.get(id)?.primaryId).toBe("a")
      expect(groups.get(id)?.members.map((x) => x.sectionId)).toEqual([
        "g7",
        "g8",
        "g9",
      ])
    }
  })

  it("leaves a class taught alone out of the map", () => {
    expect(groupCombinedSlots([s("a", "g7")]).size).toBe(0)
  })

  it("does not combine the same teacher at different start times", () => {
    const groups = groupCombinedSlots([
      s("a", "g7", "t-1", at(18, 55)),
      s("b", "g8", "t-1", at(19)),
    ])
    expect(groups.size).toBe(0)
  })

  it("does not combine two teachers who happen to share a period", () => {
    const groups = groupCombinedSlots([
      s("a", "g7", "t-1"),
      s("b", "g8", "t-2"),
    ])
    expect(groups.size).toBe(0)
  })

  it("treats two slots of ONE section at one time as bad data, not a combined class", () => {
    expect(groupCombinedSlots([s("a", "g7"), s("b", "g7")]).size).toBe(0)
  })

  it("ignores slots with no teacher, no section or no period", () => {
    const groups = groupCombinedSlots([
      {
        id: "a",
        sectionId: "g7",
        teacherId: null,
        period: { startTime: at(19) },
      },
      {
        id: "b",
        sectionId: null,
        teacherId: "t-1",
        period: { startTime: at(19) },
      },
      { id: "c", sectionId: "g9", teacherId: "t-1", period: null },
      s("d", "g8"),
    ])
    expect(groups.size).toBe(0)
  })
})

describe("periodStartKey", () => {
  it("reads the stored wall clock, not the reader's zone", () => {
    expect(periodStartKey(at(18, 55))).toBe("18:55")
    expect(periodStartKey("1970-01-01T07:15:00.000Z")).toBe("07:15")
  })
})

describe("combinedGroupForSlot", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m(resolveOnlinePolicies).mockImplementation(onlineExcept())
  })

  it("reads the slot's same-day peers and returns its group", async () => {
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 1,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g8",
      period: { startTime: at(19), isBreak: false },
    })
    m(db.timetable.findMany).mockResolvedValue([
      s("a", "g7"),
      s("b", "g8"),
      s("z", "g9", "t-1", at(16)),
    ])
    const group = await combinedGroupForSlot("school", "b")
    expect(group?.primaryId).toBe("a")
    expect(group?.members.map((x) => x.slotId)).toEqual(["a", "b"])
  })

  it("leaves out a section taught in person that day", async () => {
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 1,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g8",
      period: { startTime: at(19), isBreak: false },
    })
    m(db.timetable.findMany).mockResolvedValue([
      s("a", "g7"),
      s("b", "g8"),
      s("c", "g9"),
    ])
    m(resolveOnlinePolicies).mockImplementation(onlineExcept("g7"))
    const group = await combinedGroupForSlot("school", "b")
    expect(group?.primaryId).toBe("b")
    expect(group?.members.map((x) => x.sectionId)).toEqual(["g8", "g9"])
    // Alone online, the in-person section's slot is in no group at all.
    m(resolveOnlinePolicies).mockImplementation(onlineExcept("g7", "g9"))
    expect(await combinedGroupForSlot("school", "b")).toBeNull()
  })

  it("is null for a break, and never throws when the lookup fails", async () => {
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 1,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g8",
      period: { startTime: at(19), isBreak: true },
    })
    expect(await combinedGroupForSlot("school", "b")).toBeNull()
    m(db.timetable.findFirst).mockRejectedValue(new Error("db down"))
    expect(await combinedGroupForSlot("school", "b")).toBeNull()
  })
})

describe("sessionSectionIds", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m(resolveOnlinePolicies).mockImplementation(onlineExcept())
  })

  it("covers every section of a combined class", async () => {
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 1,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g7",
      period: { startTime: at(19), isBreak: false },
    })
    m(db.timetable.findMany).mockResolvedValue([s("a", "g7"), s("b", "g8")])
    expect(
      await sessionSectionIds("school", { sectionId: "g7", timetableId: "a" })
    ).toEqual(["g7", "g8"])
  })

  it("is the session's own section otherwise, and nothing without one", async () => {
    expect(
      await sessionSectionIds("school", { sectionId: "g7", timetableId: null })
    ).toEqual(["g7"])
    expect(
      await sessionSectionIds("school", { sectionId: null, timetableId: "a" })
    ).toEqual([])
  })
})
