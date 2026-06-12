// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  getAcademicConfig,
  getStreamTypeForSubject,
} from "@/components/catalog/academic-config"
import {
  applyTimetableStructureForNewSchool,
  setupLibraryForSchool,
} from "@/components/catalog/provision"
import {
  _testing,
  getRankedVideos,
  recordVideoView,
  setupCatalogForSchool,
  setupDefaultsForSchool,
  teardownCatalogForSchool,
} from "@/components/catalog/setup"

vi.mock("@/lib/db", () => ({
  db: {
    academicLevel: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    academicGrade: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    academicStream: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    subject: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: {
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    scoreRange: {
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    subjectSelection: {
      count: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    schoolContentOverride: {
      deleteMany: vi.fn(),
    },
    contentOverride: {
      deleteMany: vi.fn(),
    },
    video: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    videoPurchase: {
      findMany: vi.fn(),
    },
    classroom: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    classroomType: {
      findFirst: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    timetable: {
      createMany: vi.fn(),
    },
    instructorPreference: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    period: {
      count: vi.fn(),
      create: vi.fn(),
    },
    term: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    schoolWeekConfig: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    book: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    schoolBook: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    bookSelection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}))

describe("Catalog Setup", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ========================================================================
  // setupDefaultsForSchool
  // ========================================================================

  describe("setupDefaultsForSchool", () => {
    // Source runs idempotency `count` + batch `createMany` INSIDE the tx;
    // createMany returns `{ count }` which becomes the result. The builder
    // reflects the source's own filtered array length back as the count.
    const makeDefaultsTx = (
      existing = { yearLevel: 0, department: 0, scoreRange: 0 }
    ) => ({
      yearLevel: {
        count: vi.fn().mockResolvedValue(existing.yearLevel),
        createMany: vi
          .fn()
          .mockImplementation(async (a: any) => ({ count: a.data.length })),
      },
      department: {
        count: vi.fn().mockResolvedValue(existing.department),
        createMany: vi
          .fn()
          .mockImplementation(async (a: any) => ({ count: a.data.length })),
      },
      scoreRange: {
        count: vi.fn().mockResolvedValue(existing.scoreRange),
        createMany: vi
          .fn()
          .mockImplementation(async (a: any) => ({ count: a.data.length })),
      },
    })

    it("creates YearLevels, Departments, and ScoreRanges for a new school", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
        cb(makeDefaultsTx())
      )

      const result = await setupDefaultsForSchool(schoolId, "both")

      expect(result.yearLevels).toBe(14) // KG1, KG2, Grade 1-12
      expect(result.departments).toBe(6)
      expect(result.scoreRanges).toBe(9)
    })

    it("skips creation when all records already exist (idempotent)", async () => {
      const tx = makeDefaultsTx({ yearLevel: 14, department: 6, scoreRange: 9 })
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(tx))

      const result = await setupDefaultsForSchool(schoolId)

      expect(result).toEqual({ yearLevels: 0, departments: 0, scoreRanges: 0 })
      // Idempotency is now checked inside the tx — nothing is created.
      expect(tx.yearLevel.createMany).not.toHaveBeenCalled()
      expect(tx.department.createMany).not.toHaveBeenCalled()
      expect(tx.scoreRange.createMany).not.toHaveBeenCalled()
    })

    it("filters YearLevels by schoolLevel=primary (8 levels: KG1-2 + Grade 1-6)", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
        cb(makeDefaultsTx())
      )

      const result = await setupDefaultsForSchool(schoolId, "primary")

      // primary = KG1, KG2, Grade 1-6 = 8 year levels
      expect(result.yearLevels).toBe(8)
    })

    it("filters YearLevels by schoolLevel=secondary (6 levels: Grade 7-12)", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
        cb(makeDefaultsTx())
      )

      const result = await setupDefaultsForSchool(schoolId, "secondary")

      // secondary = Grade 7-12 = 6 year levels
      expect(result.yearLevels).toBe(6)
    })

    it("creates departments even when yearLevels already exist", async () => {
      const tx = makeDefaultsTx({ yearLevel: 14, department: 0, scoreRange: 0 })
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(tx))

      const result = await setupDefaultsForSchool(schoolId)

      expect(result.yearLevels).toBe(0)
      expect(result.departments).toBe(6)
      expect(result.scoreRanges).toBe(9)
    })
  })

  // ========================================================================
  // applyTimetableStructureForNewSchool
  // ========================================================================

  describe("applyTimetableStructureForNewSchool", () => {
    it("creates school year, periods, terms, and week config for valid structure", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolYear.create).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.count).mockResolvedValue(0)
      vi.mocked(db.period.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          period: { create: vi.fn() },
          term: {
            create: vi.fn().mockResolvedValue({ id: "term-1" }),
            findFirst: vi.fn(),
          },
          schoolWeekConfig: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await applyTimetableStructureForNewSchool(
        schoolId,
        "sd-gov-default"
      )

      expect(result.skipped).toBe(false)
      expect(result.periods).toBeGreaterThan(0)
      expect(result.yearId).toBe("year-1")
    })

    it("reuses existing school year", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "existing-year",
      } as any)
      vi.mocked(db.term.count).mockResolvedValue(0)
      vi.mocked(db.period.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          period: { create: vi.fn() },
          term: {
            create: vi.fn().mockResolvedValue({ id: "term-1" }),
            findFirst: vi.fn(),
          },
          schoolWeekConfig: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await applyTimetableStructureForNewSchool(
        schoolId,
        "sd-gov-default"
      )

      expect(result.yearId).toBe("existing-year")
      expect(db.schoolYear.create).not.toHaveBeenCalled()
    })

    it("maps legacy template names via LEGACY_TEMPLATE_MAP", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.count).mockResolvedValue(0)
      vi.mocked(db.period.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          period: { create: vi.fn() },
          term: {
            create: vi.fn().mockResolvedValue({ id: "term-1" }),
            findFirst: vi.fn(),
          },
          schoolWeekConfig: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      // "standard_8" maps to "sd-gov-default"
      const result = await applyTimetableStructureForNewSchool(
        schoolId,
        "standard_8"
      )

      expect(result.skipped).toBe(false)
    })

    it("returns skipped when structure slug is unknown", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)

      const result = await applyTimetableStructureForNewSchool(
        schoolId,
        "nonexistent-structure"
      )

      expect(result).toEqual({
        skipped: true,
        message: "Unknown structure: nonexistent-structure",
      })
    })

    it("creates SchoolWeekConfig when terms already exist (Bug 6 fix)", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.count).mockResolvedValue(2) // terms exist
      vi.mocked(db.period.count).mockResolvedValue(8) // periods exist

      let weekConfigCreated = false
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          period: { create: vi.fn() },
          term: {
            create: vi.fn(),
            findFirst: vi.fn().mockResolvedValue({ id: "existing-term-id" }),
          },
          schoolWeekConfig: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockImplementation(async () => {
              weekConfigCreated = true
            }),
          },
        }
        return callback(tx)
      })

      await applyTimetableStructureForNewSchool(schoolId, "sd-gov-default")

      expect(weekConfigCreated).toBe(true)
    })

    it("does not duplicate periods on a re-run (manual publish after onboarding)", async () => {
      vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
        id: "year-1",
      } as any)
      vi.mocked(db.term.count).mockResolvedValue(2)
      vi.mocked(db.period.count).mockResolvedValue(8)

      const periodCreate = vi.fn()
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          period: { create: periodCreate },
          term: {
            create: vi.fn(),
            findFirst: vi.fn().mockResolvedValue({ id: "term-1" }),
          },
          schoolWeekConfig: {
            findFirst: vi.fn().mockResolvedValue({ id: "config-1" }),
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await applyTimetableStructureForNewSchool(
        schoolId,
        "sd-gov-default"
      )

      expect(result.skipped).toBe(false)
      expect(result.periods).toBe(0)
      expect(periodCreate).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // Internal helpers (via _testing export)
  // ========================================================================

  describe("inferCurriculum", () => {
    it("returns US for international schoolType regardless of country", () => {
      expect(_testing.inferCurriculum("SD", "international")).toBe("US")
      expect(_testing.inferCurriculum("EG", "international")).toBe("US")
    })

    it("returns SD for SD country", () => {
      expect(_testing.inferCurriculum("SD")).toBe("SD")
    })

    it("returns SA for SA country", () => {
      expect(_testing.inferCurriculum("SA")).toBe("SA")
    })

    it("returns GB for GB country", () => {
      expect(_testing.inferCurriculum("GB")).toBe("GB")
    })

    it("returns US for US country", () => {
      expect(_testing.inferCurriculum("US")).toBe("US")
    })

    it("returns US for unknown country (fallback)", () => {
      expect(_testing.inferCurriculum("BR")).toBe("US")
      expect(_testing.inferCurriculum("NG")).toBe("US")
    })

    it("returns CBSE for India (IN has its own curriculum)", () => {
      expect(_testing.inferCurriculum("IN")).toBe("CBSE")
    })
  })

  describe("getStreamTypeForSubject (config-driven)", () => {
    const sd = getAcademicConfig("SD")
    const us = getAcademicConfig("US")

    it("returns SCIENCE for science-stream subjects under SD", () => {
      expect(getStreamTypeForSubject(sd, "Physics")).toBe("SCIENCE")
      expect(getStreamTypeForSubject(sd, "فيزياء")).toBe("SCIENCE")
      expect(getStreamTypeForSubject(sd, "Chemistry")).toBe("SCIENCE")
      expect(getStreamTypeForSubject(sd, "كيمياء")).toBe("SCIENCE")
      expect(getStreamTypeForSubject(sd, "Biology")).toBe("SCIENCE")
      expect(getStreamTypeForSubject(sd, "أحياء")).toBe("SCIENCE")
    })

    it("returns ARTS for arts-stream subjects under SD", () => {
      expect(getStreamTypeForSubject(sd, "Philosophy")).toBe("ARTS")
      expect(getStreamTypeForSubject(sd, "فلسفة")).toBe("ARTS")
    })

    it("returns null for shared subjects (math, arabic)", () => {
      expect(getStreamTypeForSubject(sd, "Mathematics")).toBeNull()
      expect(getStreamTypeForSubject(sd, "Arabic Language")).toBeNull()
      expect(getStreamTypeForSubject(sd, "English")).toBeNull()
    })

    it("returns null for Physical Education (not physics)", () => {
      expect(getStreamTypeForSubject(sd, "Physical Education")).toBeNull()
      expect(getStreamTypeForSubject(sd, "تربية بدنية")).toBeNull()
    })

    it("never assigns streams under curricula that provision none", () => {
      expect(getStreamTypeForSubject(us, "Physics")).toBeNull()
      expect(getStreamTypeForSubject(us, "Philosophy")).toBeNull()
    })
  })

  describe("findSubjects (progressive fallback)", () => {
    it("returns exact match when country + curriculum + schoolType matches", async () => {
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findSubjects("SD", "SD", "public")

      expect(result).toHaveLength(1)
      // First call should include schoolType filter
      expect(db.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolTypes: { has: "public" },
          }),
        })
      )
    })

    it("falls back to broad match when no exact match", async () => {
      // Step 1 (exact): no results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([])
      // Step 2 (broad): results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findSubjects("SD", "SD", "public")

      expect(result).toHaveLength(1)
      expect(db.subject.findMany).toHaveBeenCalledTimes(2)
    })

    it("falls back to universal match (country=*)", async () => {
      // Step 1 (exact): no results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([])
      // Step 2 (broad): no results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([])
      // Step 3 (universal): results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "IB Math", levels: ["HIGH"], grades: [] },
      ] as any)

      const result = await _testing.findSubjects("SD", "IB-DP", "private")

      expect(result).toHaveLength(1)
      expect(db.subject.findMany).toHaveBeenCalledTimes(3)
    })

    it("falls back to US K-12 baseline as last resort", async () => {
      // Steps 1-3: no results
      vi.mocked(db.subject.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      // Step 4 (baseline): results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "US Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findSubjects("BR", "SD", "public")

      expect(result).toHaveLength(1)
      // Baseline query should use US
      expect(db.subject.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: "US",
            curriculum: "US",
          }),
        })
      )
    })

    it("returns empty array when no subjects found at any level", async () => {
      vi.mocked(db.subject.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await _testing.findSubjects("BR", "SD", "public")

      expect(result).toEqual([])
    })

    it("skips exact match step when no schoolType provided", async () => {
      // Step 2 (broad, first call without schoolType): results
      vi.mocked(db.subject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findSubjects("SD", "SD")

      expect(result).toHaveLength(1)
      // Only 1 call (no exact match attempted)
      expect(db.subject.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe("YEAR_LEVEL_DEFAULTS", () => {
    it("has 14 entries (KG1, KG2, Grade 1-12)", () => {
      expect(_testing.YEAR_LEVEL_DEFAULTS).toHaveLength(14)
    })

    it("Grade N has levelOrder N+2", () => {
      const grade1 = _testing.YEAR_LEVEL_DEFAULTS.find(
        (yl) => yl.slug === "grade-1"
      )
      expect(grade1?.levelOrder).toBe(3)

      const grade12 = _testing.YEAR_LEVEL_DEFAULTS.find(
        (yl) => yl.slug === "grade-12"
      )
      expect(grade12?.levelOrder).toBe(14)
    })
  })

  // ========================================================================
  // setupCatalogForSchool (existing tests, Bug 2 fixed)
  // ========================================================================

  describe("setupCatalogForSchool", () => {
    it("skips setup if school already has academic levels (skipIfExists=true)", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "both",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "cs1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])
      // Idempotency is now checked INSIDE the tx via tx.academicLevel.count
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
        cb({
          academicLevel: {
            count: vi.fn().mockResolvedValue(3),
            create: vi.fn(),
          },
          academicGrade: { create: vi.fn() },
          academicStream: { create: vi.fn() },
          subjectSelection: { createMany: vi.fn() },
        })
      )

      const result = await setupCatalogForSchool(schoolId)

      expect(result).toEqual({
        skipped: true,
        message: "School already has academic structure",
      })
    })

    it("does not skip if skipIfExists is false", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(3)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "both",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([])
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      const result = await setupCatalogForSchool(schoolId, {
        skipIfExists: false,
      })

      expect(result).toEqual({
        skipped: true,
        message: "No catalog subjects found after all fallback attempts",
      })
    })

    it("skips when no catalog subjects found", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "both",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([])
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      const result = await setupCatalogForSchool(schoolId)

      expect(result).toEqual({
        skipped: true,
        message: "No catalog subjects found after all fallback attempts",
      })
    })

    it("creates full academic structure when catalog subjects exist", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "primary",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "cs1", name: "رياضيات", levels: ["ELEMENTARY"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      // Mock transaction to execute the callback
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
            count: vi.fn().mockResolvedValue(0),
            create: vi
              .fn()
              .mockResolvedValue({ id: "al1", level: "ELEMENTARY" }),
          },
          academicGrade: {
            create: vi.fn().mockImplementation(async (args: any) => ({
              id: `ag-${args.data.gradeNumber}`,
              gradeNumber: args.data.gradeNumber,
            })),
          },
          academicStream: { create: vi.fn() },
          subjectSelection: { create: vi.fn(), createMany: vi.fn() },
          catalogSubject: { update: vi.fn() },
        }
        return callback(tx)
      })

      const result = await setupCatalogForSchool(schoolId)

      expect(result).toEqual(
        expect.objectContaining({
          skipped: false,
          levels: 1,
          grades: 6,
          streams: 0,
          subjects: 1,
        })
      )
    })

    it("filters levels based on school's schoolLevel=primary", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "primary",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "cs1", name: "Math", levels: ["ELEMENTARY", "HIGH"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      const createdLevels: string[] = []
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockImplementation(async (args: any) => {
              createdLevels.push(args.data.level)
              return { id: `al-${args.data.level}`, level: args.data.level }
            }),
          },
          academicGrade: {
            create: vi.fn().mockImplementation(async (args: any) => ({
              id: `ag-${args.data.gradeNumber}`,
              gradeNumber: args.data.gradeNumber,
            })),
          },
          academicStream: { create: vi.fn() },
          subjectSelection: { create: vi.fn(), createMany: vi.fn() },
          catalogSubject: { update: vi.fn() },
        }
        return callback(tx)
      })

      await setupCatalogForSchool(schoolId)

      // Should only create ELEMENTARY, not HIGH
      expect(createdLevels).toEqual(["ELEMENTARY"])
    })

    it("creates streams for high school grades 10-12", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "secondary",
        country: "SD",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([
        { id: "cs1", name: "Science", levels: ["HIGH"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      let streamCount = 0
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockImplementation(async (args: any) => ({
              id: `al-${args.data.level}`,
              level: args.data.level,
            })),
          },
          academicGrade: {
            create: vi.fn().mockImplementation(async (args: any) => ({
              id: `ag-${args.data.gradeNumber}`,
              gradeNumber: args.data.gradeNumber,
              levelId: args.data.levelId,
            })),
          },
          academicStream: {
            create: vi.fn().mockImplementation(async () => {
              streamCount++
              return { id: `stream-${streamCount}` }
            }),
          },
          subjectSelection: { create: vi.fn(), createMany: vi.fn() },
          catalogSubject: { update: vi.fn() },
        }
        return callback(tx)
      })

      const result = await setupCatalogForSchool(schoolId)

      // HIGH has grades 10,11,12 * 2 streams (science + arts) = 6
      expect(result).toEqual(
        expect.objectContaining({
          streams: 6,
        })
      )
    })

    it("uses school country from database over options", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "both",
        country: "EG",
      } as any)
      vi.mocked(db.subject.findMany).mockResolvedValue([])
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      await setupCatalogForSchool(schoolId, { country: "SD" })

      // Should use EG from school, not SD from options
      expect(db.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ country: "EG" }),
        })
      )
    })
  })

  // ========================================================================
  // teardownCatalogForSchool
  // ========================================================================

  describe("teardownCatalogForSchool", () => {
    it("deletes all catalog data in correct order", async () => {
      // Source reads selections (for affected-subject ids) before the tx
      vi.mocked(db.subjectSelection.findMany).mockResolvedValue([])
      const deletions: string[] = []
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          subjectSelection: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("subjectSelection")
            }),
          },
          contentOverride: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("contentOverride")
            }),
          },
          academicStream: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("academicStream")
            }),
          },
          academicGrade: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("academicGrade")
            }),
          },
          academicLevel: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("academicLevel")
            }),
          },
        }
        return callback(tx)
      })

      const result = await teardownCatalogForSchool(schoolId)

      expect(result).toEqual({ success: true })
      // Bridge tables deleted before structure
      expect(deletions.indexOf("subjectSelection")).toBeLessThan(
        deletions.indexOf("academicLevel")
      )
    })
  })

  // ========================================================================
  // getRankedVideos
  // ========================================================================

  describe("getRankedVideos", () => {
    it("returns ranked videos for a lesson", async () => {
      const mockVideos = [
        {
          id: "v1",
          title: "Lesson 1",
          videoUrl: "https://example.com/v1",
          thumbnailUrl: null,
          durationSeconds: 300,
          provider: "YOUTUBE",
          visibility: "PUBLIC",
          isFeatured: true,
          viewCount: 100,
          averageRating: 4.5,
          ratingCount: 10,
          user: { username: "teacher1" },
          school: { name: "Test School" },
        },
      ]
      vi.mocked(db.video.findMany).mockResolvedValue(mockVideos as any)

      const result = await getRankedVideos("lesson-1", schoolId)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: "v1",
          title: "Lesson 1",
          isFeatured: true,
          uploaderName: "teacher1",
          schoolName: "Test School",
        })
      )
    })

    it("filters by PUBLIC visibility when no schoolId", async () => {
      vi.mocked(db.video.findMany).mockResolvedValue([])

      await getRankedVideos("lesson-1", null)

      expect(db.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            // No schoolId → PUBLIC + PAID are matched via an OR clause
            OR: expect.arrayContaining([{ visibility: "PUBLIC" }]),
          }),
        })
      )
    })

    it("filters to school-only when includeSchoolOnly is true", async () => {
      vi.mocked(db.video.findMany).mockResolvedValue([])

      await getRankedVideos("lesson-1", schoolId, {
        includeSchoolOnly: true,
      })

      expect(db.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId,
          }),
        })
      )
    })

    it("respects limit option", async () => {
      vi.mocked(db.video.findMany).mockResolvedValue([])

      await getRankedVideos("lesson-1", schoolId, { limit: 5 })

      expect(db.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })
  })

  // ========================================================================
  // recordVideoView
  // ========================================================================

  describe("recordVideoView", () => {
    it("increments view count", async () => {
      vi.mocked(db.video.update).mockResolvedValue({} as any)

      await recordVideoView("v1")

      expect(db.video.update).toHaveBeenCalledWith({
        where: { id: "v1" },
        data: { viewCount: { increment: 1 } },
      })
    })
  })

  // ========================================================================
  // setupLibraryForSchool
  // ========================================================================

  describe("setupLibraryForSchool", () => {
    const mockBooks = [
      {
        id: "cb-1",
        title: "Book One",
        author: "Author A",
        genre: "Fiction",
        description: "A great book about fiction",
        summary: "Summary of the book one",
        coverUrl: "https://example.com/cover1.jpg",
        coverColor: "#FF0000",
        rating: 4.5,
        videoUrl: null,
        isbn: "978-0-1234-5678-0",
        publisher: "Publisher A",
        publicationYear: 2020,
        language: "en",
        pageCount: 300,
        gradeLevel: "GENERAL",
      },
      {
        id: "cb-2",
        title: "Book Two",
        author: "Author B",
        genre: "Science",
        description: null,
        summary: null,
        coverUrl: null,
        coverColor: "#0000FF",
        rating: 3.7,
        videoUrl: "https://example.com/video.mp4",
        isbn: null,
        publisher: null,
        publicationYear: null,
        language: null,
        pageCount: null,
        gradeLevel: "PRIMARY",
      },
    ]

    it("creates books from catalog for a new school", async () => {
      vi.mocked(db.schoolBook.count).mockResolvedValue(0)
      vi.mocked(db.book.findMany).mockResolvedValue(mockBooks as any)
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          bookSelection: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
          },
          schoolBook: { create: vi.fn() },
        }
        await cb(tx)
        return mockBooks.length
      })
      vi.mocked(db.bookSelection.count).mockResolvedValue(1)
      vi.mocked(db.book.update).mockResolvedValue({} as any)

      const result = await setupLibraryForSchool(schoolId)

      expect(result).toEqual({ skipped: false, books: 2 })
      expect(db.schoolBook.count).toHaveBeenCalledWith({
        where: { schoolId },
      })
      expect(db.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: "PUBLISHED",
            approvalStatus: "APPROVED",
            visibility: "PUBLIC",
          },
        })
      )
    })

    it("skips if school already has books (idempotent)", async () => {
      vi.mocked(db.schoolBook.count).mockResolvedValue(10)

      const result = await setupLibraryForSchool(schoolId)

      expect(result).toEqual({
        skipped: true,
        books: 0,
        message: "School already has library books",
      })
      expect(db.book.findMany).not.toHaveBeenCalled()
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("skips when no catalog books exist", async () => {
      vi.mocked(db.schoolBook.count).mockResolvedValue(0)
      vi.mocked(db.book.findMany).mockResolvedValue([])

      const result = await setupLibraryForSchool(schoolId)

      expect(result).toEqual({
        skipped: true,
        books: 0,
        message: "No catalog books available",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("creates BookSelection and Book for each catalog book", async () => {
      vi.mocked(db.schoolBook.count).mockResolvedValue(0)
      vi.mocked(db.book.findMany).mockResolvedValue(mockBooks as any)

      const txSelectionCreate = vi.fn()
      const txBookCreate = vi.fn()
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          bookSelection: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: txSelectionCreate,
          },
          schoolBook: { create: txBookCreate },
        }
        await cb(tx)
        return mockBooks.length
      })
      vi.mocked(db.bookSelection.count).mockResolvedValue(1)
      vi.mocked(db.book.update).mockResolvedValue({} as any)

      await setupLibraryForSchool(schoolId)

      // Should create 2 selections and 2 books
      expect(txSelectionCreate).toHaveBeenCalledTimes(2)
      expect(txBookCreate).toHaveBeenCalledTimes(2)

      // Verify first book data
      expect(txBookCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId,
            catalogBookId: "cb-1",
            title: "Book One",
            rating: 5, // Math.round(4.5) = 5
            totalCopies: 3,
            availableCopies: 3,
          }),
        })
      )

      // Verify null coercion for second book
      expect(txBookCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId,
            catalogBookId: "cb-2",
            description: "", // null → ""
            summary: "", // null → ""
            coverUrl: "", // null → ""
            rating: 4, // Math.round(3.7) = 4
          }),
        })
      )
    })

    it("skips catalog books that already have a selection", async () => {
      vi.mocked(db.schoolBook.count).mockResolvedValue(0)
      vi.mocked(db.book.findMany).mockResolvedValue(mockBooks as any)

      const txSelectionCreate = vi.fn()
      const txBookCreate = vi.fn()
      vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
        const tx = {
          bookSelection: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce({ id: "existing" }) // First book already selected
              .mockResolvedValueOnce(null), // Second book not selected
            create: txSelectionCreate,
          },
          schoolBook: { create: txBookCreate },
        }
        await cb(tx)
        return 1
      })
      vi.mocked(db.bookSelection.count).mockResolvedValue(1)
      vi.mocked(db.book.update).mockResolvedValue({} as any)

      await setupLibraryForSchool(schoolId)

      // Only 1 selection + 1 book created (second one)
      expect(txSelectionCreate).toHaveBeenCalledTimes(1)
      expect(txBookCreate).toHaveBeenCalledTimes(1)
    })
  })
})
