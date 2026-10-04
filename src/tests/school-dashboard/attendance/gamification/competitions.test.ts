// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  createCompetition,
  getActiveCompetitions,
  updateCompetitionStandings,
} from "@/components/school-dashboard/attendance/gamification/actions"

vi.mock("@/lib/db", () => ({
  db: {
    attendanceCompetition: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    classCompetitionEntry: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    section: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
  },
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("@/components/translation/person", () => ({
  getLabels: vi.fn(
    async (values: string[]) => new Map(values.map((v) => [v, v]))
  ),
}))

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", schoolId: SCHOOL, role: "ADMIN" },
  } as never)
})

describe("attendance competitions", () => {
  it("enters the school's sections, each with its student count", async () => {
    vi.mocked(db.attendanceCompetition.create).mockResolvedValue({
      id: "comp-1",
    } as never)
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "7a", _count: { students: 20 } },
      { id: "7b", _count: { students: 18 } },
    ] as never)

    const result = await createCompetition({
      name: "October",
      lang: "ar",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      sectionIds: ["7a", "7b", "other-school"],
      participantPoints: 0,
      winnerPoints: 100,
    })

    expect(result.success).toBe(true)
    expect(vi.mocked(db.section.findMany).mock.calls[0][0]!.where).toEqual({
      schoolId: SCHOOL,
      id: { in: ["7a", "7b", "other-school"] },
    })
    expect(
      vi.mocked(db.classCompetitionEntry.createMany).mock.calls[0][0]!.data
    ).toEqual([
      {
        schoolId: SCHOOL,
        competitionId: "comp-1",
        sectionId: "7a",
        totalStudents: 20,
      },
      {
        schoolId: SCHOOL,
        competitionId: "comp-1",
        sectionId: "7b",
        totalStudents: 18,
      },
    ])
  })

  it("scores a section on its own days", async () => {
    vi.mocked(db.attendanceCompetition.findFirst).mockResolvedValue({
      id: "comp-1",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
      entries: [{ id: "e1", sectionId: "7a" }],
    } as never)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { status: "PRESENT" },
      { status: "LATE" },
      { status: "ABSENT" },
      { status: "PRESENT" },
    ] as never)
    vi.mocked(db.classCompetitionEntry.findMany).mockResolvedValue([
      { id: "e1" },
    ] as never)

    const result = await updateCompetitionStandings("comp-1")

    expect(result.success).toBe(true)
    expect(
      vi.mocked(db.attendance.findMany).mock.calls[0][0]!.where
    ).toMatchObject({ schoolId: SCHOOL, sectionId: "7a", periodId: null })
    expect(db.classCompetitionEntry.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { presentDays: 3, absentDays: 1, attendanceRate: 75 },
    })
  })

  it("names an entry by its section", async () => {
    vi.mocked(db.attendanceCompetition.findMany).mockResolvedValue([
      {
        id: "comp-1",
        name: "October",
        lang: "ar",
        description: null,
        startDate: new Date(),
        endDate: new Date(),
        winnerReward: null,
        entries: [
          {
            id: "e1",
            sectionId: "7a",
            section: { id: "7a", name: "7-A", lang: "ar" },
            attendanceRate: 90,
            totalStudents: 20,
            presentDays: 18,
            absentDays: 2,
          },
        ],
      },
    ] as never)

    const result = await getActiveCompetitions("ar")

    expect(result.success).toBe(true)
    const entries = (
      result as { data: Array<{ entries: Array<{ sectionName: string }> }> }
    ).data[0].entries
    expect(entries.map((e) => e.sectionName)).toEqual(["7-A"])
  })
})
