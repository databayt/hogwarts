// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  combinedGroupForSlot,
  combinedPrimaryForSlots,
  groupCombinedSlots,
  isCombinedClassPair,
  periodStartKey,
  sessionSectionIds,
  sharedRoomSlotIds,
} from "@/components/school-dashboard/live/combined"
import { resolveOnlinePolicies } from "@/components/school-dashboard/live/online-policy"

vi.mock("@/lib/db", () => ({
  db: {
    timetable: { findFirst: vi.fn(), findMany: vi.fn() },
    conference: { findFirst: vi.fn() },
  },
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

describe("sessionSectionIds — a make-up class (حصة تعويضية)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m(resolveOnlinePolicies).mockImplementation(onlineExcept())
  })

  const combinedOriginal = () => {
    m(db.conference.findFirst).mockResolvedValue({
      sectionId: "g7",
      timetableId: "a",
      scheduledStart: new Date("2026-11-20T17:00:00Z"),
    })
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 5,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g7",
      period: { startTime: at(19), isBreak: false },
    })
    m(db.timetable.findMany).mockResolvedValue([
      s("a", "g7"),
      s("b", "g8"),
      s("c", "g9"),
    ])
  }

  it("covers every section its ORIGINAL covered, so the siblings can join", async () => {
    combinedOriginal()
    expect(
      await sessionSectionIds("school", {
        sectionId: "g7",
        timetableId: null,
        makeupForId: "orig",
      })
    ).toEqual(["g7", "g8", "g9"])
    // The original is read by id AND school.
    expect(m(db.conference.findFirst).mock.calls[0][0].where).toEqual({
      id: "orig",
      schoolId: "school",
    })
  })

  it("reads makeupForId itself when the caller selected only the id", async () => {
    m(db.conference.findFirst)
      .mockResolvedValueOnce({ makeupForId: "orig" })
      .mockResolvedValueOnce({
        sectionId: "g7",
        timetableId: "a",
        scheduledStart: new Date("2026-11-20T17:00:00Z"),
      })
    m(db.timetable.findFirst).mockResolvedValue({
      termId: "term",
      dayOfWeek: 5,
      weekOffset: 0,
      teacherId: "t-1",
      sectionId: "g7",
      period: { startTime: at(19), isBreak: false },
    })
    m(db.timetable.findMany).mockResolvedValue([s("a", "g7"), s("b", "g8")])
    expect(
      await sessionSectionIds("school", {
        id: "mk",
        sectionId: "g7",
        timetableId: null,
      })
    ).toEqual(["g7", "g8"])
  })

  it("is its own section when the original was taught alone, or cannot be found", async () => {
    m(db.conference.findFirst).mockResolvedValue({
      sectionId: "g7",
      timetableId: null,
      scheduledStart: new Date(),
    })
    expect(
      await sessionSectionIds("school", {
        sectionId: "g7",
        timetableId: null,
        makeupForId: "orig",
      })
    ).toEqual(["g7"])
    m(db.conference.findFirst).mockResolvedValue(null)
    expect(
      await sessionSectionIds("school", {
        sectionId: "g7",
        timetableId: null,
        makeupForId: "gone",
      })
    ).toEqual(["g7"])
  })

  it("does not touch the db for a slot-less session that is not a make-up", async () => {
    expect(
      await sessionSectionIds("school", {
        sectionId: "g7",
        timetableId: null,
        makeupForId: null,
      })
    ).toEqual(["g7"])
    expect(db.conference.findFirst).not.toHaveBeenCalled()
  })
})

describe("isCombinedClassPair", () => {
  const base = {
    sameStart: true,
    sectionA: "s1",
    sectionB: "s2",
    onlineA: true,
    onlineB: true,
  }
  it("is a combined class: same start, different sections, both online", () => {
    expect(isCombinedClassPair(base)).toBe(true)
  })
  it("is not when the start times differ, a section is in person, or it is one section twice", () => {
    expect(isCombinedClassPair({ ...base, sameStart: false })).toBe(false)
    expect(isCombinedClassPair({ ...base, onlineB: false })).toBe(false)
    expect(isCombinedClassPair({ ...base, sectionB: "s1" })).toBe(false)
    expect(isCombinedClassPair({ ...base, sectionA: null })).toBe(false)
  })
})

describe("combinedPrimaryForSlots / sharedRoomSlotIds", () => {
  const peers = [
    {
      id: "a-1",
      teacherId: "t-1",
      sectionId: "sec-a",
      period: { startTime: at(19) },
    },
    {
      id: "b-1",
      teacherId: "t-1",
      sectionId: "sec-b",
      period: { startTime: at(19) },
    },
    {
      id: "c-1",
      teacherId: "t-2",
      sectionId: "sec-c",
      period: { startTime: at(19) },
    },
  ]
  const slotRow = {
    termId: "term",
    dayOfWeek: 1,
    weekOffset: 0,
    teacherId: "t-1",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    m(resolveOnlinePolicies).mockImplementation(onlineExcept())
  })

  it("maps a sibling slot to the primary that owns the room, and the primary to itself", async () => {
    m(db.timetable.findMany)
      .mockResolvedValueOnce([slotRow])
      .mockResolvedValueOnce(peers)
    const map = await combinedPrimaryForSlots("school", ["b-1", "c-1"])
    expect(map.get("b-1")).toBe("a-1")
    expect(map.has("c-1")).toBe(false) // taught alone
  })

  it("leaves an in-person section out", async () => {
    m(resolveOnlinePolicies).mockImplementation(onlineExcept("sec-b"))
    m(db.timetable.findMany)
      .mockResolvedValueOnce([slotRow])
      .mockResolvedValueOnce(peers)
    expect((await combinedPrimaryForSlots("school", ["b-1"])).size).toBe(0)
  })

  it("degrades to nothing when the lookup fails", async () => {
    m(db.timetable.findMany).mockRejectedValue(new Error("db down"))
    expect((await combinedPrimaryForSlots("school", ["b-1"])).size).toBe(0)
  })

  it("lists the primary rooms a sibling section shares, never its own", async () => {
    m(db.timetable.findMany)
      .mockResolvedValueOnce([{ id: "b-1" }]) // the viewer's own slots
      .mockResolvedValueOnce([slotRow])
      .mockResolvedValueOnce(peers)
    expect(await sharedRoomSlotIds("school", ["sec-b"])).toEqual(["a-1"])
  })
})
