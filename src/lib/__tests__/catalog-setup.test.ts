// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  _testing,
  applyTimetableStructureForNewSchool,
  getRankedLessonVideos,
  recordVideoView,
  setupCatalogForSchool,
  setupDefaultsForSchool,
  teardownCatalogForSchool,
} from "../catalog-setup"

vi.mock("@/lib/db", () => ({
  db: {
    academicLevel: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    academicGrade: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    academicStream: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    catalogSubject: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    yearLevel: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    department: {
      count: vi.fn(),
      create: vi.fn(),
    },
    scoreRange: {
      count: vi.fn(),
      create: vi.fn(),
    },
    schoolSubjectSelection: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    schoolContentOverride: {
      deleteMany: vi.fn(),
    },
    lessonVideo: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    period: {
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
    $transaction: vi.fn(),
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
    it("creates YearLevels, Departments, and ScoreRanges for a new school", async () => {
      vi.mocked(db.yearLevel.count).mockResolvedValue(0)
      vi.mocked(db.department.count).mockResolvedValue(0)
      vi.mocked(db.scoreRange.count).mockResolvedValue(0)

      const created: Record<string, number> = {
        yearLevel: 0,
        department: 0,
        scoreRange: 0,
      }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          yearLevel: {
            create: vi.fn().mockImplementation(async () => {
              created.yearLevel++
            }),
          },
          department: {
            create: vi.fn().mockImplementation(async () => {
              created.department++
            }),
          },
          scoreRange: {
            create: vi.fn().mockImplementation(async () => {
              created.scoreRange++
            }),
          },
        }
        return callback(tx)
      })

      const result = await setupDefaultsForSchool(schoolId, "both")

      expect(result.yearLevels).toBe(14) // KG1, KG2, Grade 1-12
      expect(result.departments).toBe(6)
      expect(result.scoreRanges).toBe(9)
    })

    it("skips creation when all records already exist (idempotent)", async () => {
      vi.mocked(db.yearLevel.count).mockResolvedValue(14)
      vi.mocked(db.department.count).mockResolvedValue(6)
      vi.mocked(db.scoreRange.count).mockResolvedValue(9)

      const result = await setupDefaultsForSchool(schoolId)

      expect(result).toEqual({ yearLevels: 0, departments: 0, scoreRanges: 0 })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("filters YearLevels by schoolLevel=primary (8 levels: KG1-2 + Grade 1-6)", async () => {
      vi.mocked(db.yearLevel.count).mockResolvedValue(0)
      vi.mocked(db.department.count).mockResolvedValue(0)
      vi.mocked(db.scoreRange.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          yearLevel: {
            create: vi.fn(),
          },
          department: {
            create: vi.fn(),
          },
          scoreRange: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await setupDefaultsForSchool(schoolId, "primary")

      // primary = KG1, KG2, Grade 1-6 = 8 year levels
      expect(result.yearLevels).toBe(8)
    })

    it("filters YearLevels by schoolLevel=secondary (6 levels: Grade 7-12)", async () => {
      vi.mocked(db.yearLevel.count).mockResolvedValue(0)
      vi.mocked(db.department.count).mockResolvedValue(0)
      vi.mocked(db.scoreRange.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          yearLevel: {
            create: vi.fn(),
          },
          department: {
            create: vi.fn(),
          },
          scoreRange: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await setupDefaultsForSchool(schoolId, "secondary")

      // secondary = Grade 7-12 = 6 year levels
      expect(result.yearLevels).toBe(6)
    })

    it("creates departments even when yearLevels already exist", async () => {
      vi.mocked(db.yearLevel.count).mockResolvedValue(14) // already exist
      vi.mocked(db.department.count).mockResolvedValue(0)
      vi.mocked(db.scoreRange.count).mockResolvedValue(0)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          yearLevel: { create: vi.fn() },
          department: { create: vi.fn() },
          scoreRange: { create: vi.fn() },
        }
        return callback(tx)
      })

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
  })

  // ========================================================================
  // Internal helpers (via _testing export)
  // ========================================================================

  describe("inferCurriculum", () => {
    it("returns us-k12 for international schoolType regardless of country", () => {
      expect(_testing.inferCurriculum("SD", "international")).toBe("us-k12")
      expect(_testing.inferCurriculum("EG", "international")).toBe("us-k12")
    })

    it("returns national for SD country", () => {
      expect(_testing.inferCurriculum("SD")).toBe("national")
    })

    it("returns national for SA country", () => {
      expect(_testing.inferCurriculum("SA")).toBe("national")
    })

    it("returns british for GB country", () => {
      expect(_testing.inferCurriculum("GB")).toBe("british")
    })

    it("returns us-k12 for US country", () => {
      expect(_testing.inferCurriculum("US")).toBe("us-k12")
    })

    it("returns us-k12 for unknown country (fallback)", () => {
      expect(_testing.inferCurriculum("BR")).toBe("us-k12")
      expect(_testing.inferCurriculum("IN")).toBe("us-k12")
    })
  })

  describe("getSubjectStreamType", () => {
    it("returns SCIENCE for physics", () => {
      expect(_testing.getSubjectStreamType("Physics")).toBe("SCIENCE")
      expect(_testing.getSubjectStreamType("فيزياء")).toBe("SCIENCE")
    })

    it("returns SCIENCE for chemistry", () => {
      expect(_testing.getSubjectStreamType("Chemistry")).toBe("SCIENCE")
      expect(_testing.getSubjectStreamType("كيمياء")).toBe("SCIENCE")
    })

    it("returns SCIENCE for biology", () => {
      expect(_testing.getSubjectStreamType("Biology")).toBe("SCIENCE")
      expect(_testing.getSubjectStreamType("أحياء")).toBe("SCIENCE")
    })

    it("returns ARTS for philosophy", () => {
      expect(_testing.getSubjectStreamType("Philosophy")).toBe("ARTS")
      expect(_testing.getSubjectStreamType("فلسفة")).toBe("ARTS")
    })

    it("returns null for shared subjects (math, arabic)", () => {
      expect(_testing.getSubjectStreamType("Mathematics")).toBeNull()
      expect(_testing.getSubjectStreamType("Arabic Language")).toBeNull()
      expect(_testing.getSubjectStreamType("English")).toBeNull()
    })

    it("returns null for Physical Education (not physics)", () => {
      expect(_testing.getSubjectStreamType("Physical Education")).toBeNull()
      expect(_testing.getSubjectStreamType("تربية بدنية")).toBeNull()
    })
  })

  describe("getDefaultWeeklyPeriods", () => {
    it("returns 5 for math in elementary (grade <= 6)", () => {
      expect(_testing.getDefaultWeeklyPeriods("Mathematics", 3)).toBe(5)
      expect(_testing.getDefaultWeeklyPeriods("رياضيات", 6)).toBe(5)
    })

    it("returns 4 for math in secondary (grade > 6)", () => {
      expect(_testing.getDefaultWeeklyPeriods("Math", 7)).toBe(4)
      expect(_testing.getDefaultWeeklyPeriods("Math", 12)).toBe(4)
    })

    it("returns 5 for arabic regardless of grade", () => {
      expect(_testing.getDefaultWeeklyPeriods("Arabic", 1)).toBe(5)
      expect(_testing.getDefaultWeeklyPeriods("عربي", 12)).toBe(5)
    })

    it("returns 4 for english in elementary, 5 in secondary", () => {
      expect(_testing.getDefaultWeeklyPeriods("English", 3)).toBe(4)
      expect(_testing.getDefaultWeeklyPeriods("إنجليزي", 8)).toBe(5)
    })

    it("returns 2 for PE, art, music", () => {
      expect(_testing.getDefaultWeeklyPeriods("PE", 5)).toBe(2)
      expect(_testing.getDefaultWeeklyPeriods("Art", 3)).toBe(2)
      expect(_testing.getDefaultWeeklyPeriods("Music", 7)).toBe(2)
      expect(_testing.getDefaultWeeklyPeriods("موسيقى", 4)).toBe(2)
    })

    it("returns 3 as default for unknown subjects", () => {
      expect(_testing.getDefaultWeeklyPeriods("Geography", 5)).toBe(3)
      expect(_testing.getDefaultWeeklyPeriods("History", 8)).toBe(3)
    })
  })

  describe("findCatalogSubjects (progressive fallback)", () => {
    it("returns exact match when country + curriculum + schoolType matches", async () => {
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findCatalogSubjects(
        "SD",
        "national",
        "public"
      )

      expect(result).toHaveLength(1)
      // First call should include schoolType filter
      expect(db.catalogSubject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolTypes: { has: "public" },
          }),
        })
      )
    })

    it("falls back to broad match when no exact match", async () => {
      // Step 1 (exact): no results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([])
      // Step 2 (broad): results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findCatalogSubjects(
        "SD",
        "national",
        "public"
      )

      expect(result).toHaveLength(1)
      expect(db.catalogSubject.findMany).toHaveBeenCalledTimes(2)
    })

    it("falls back to universal match (country=*)", async () => {
      // Step 1 (exact): no results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([])
      // Step 2 (broad): no results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([])
      // Step 3 (universal): results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "IB Math", levels: ["HIGH"], grades: [] },
      ] as any)

      const result = await _testing.findCatalogSubjects("SD", "ib", "private")

      expect(result).toHaveLength(1)
      expect(db.catalogSubject.findMany).toHaveBeenCalledTimes(3)
    })

    it("falls back to US K-12 baseline as last resort", async () => {
      // Steps 1-3: no results
      vi.mocked(db.catalogSubject.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      // Step 4 (baseline): results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "US Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findCatalogSubjects(
        "BR",
        "national",
        "public"
      )

      expect(result).toHaveLength(1)
      // Baseline query should use US + us-k12
      expect(db.catalogSubject.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: "US",
            curriculum: "us-k12",
          }),
        })
      )
    })

    it("returns empty array when no subjects found at any level", async () => {
      vi.mocked(db.catalogSubject.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await _testing.findCatalogSubjects(
        "BR",
        "national",
        "public"
      )

      expect(result).toEqual([])
    })

    it("skips exact match step when no schoolType provided", async () => {
      // Step 2 (broad, first call without schoolType): results
      vi.mocked(db.catalogSubject.findMany).mockResolvedValueOnce([
        { id: "s1", name: "Math", levels: ["ELEMENTARY"], grades: [] },
      ] as any)

      const result = await _testing.findCatalogSubjects("SD", "national")

      expect(result).toHaveLength(1)
      // Only 1 call (no exact match attempted)
      expect(db.catalogSubject.findMany).toHaveBeenCalledTimes(1)
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
      vi.mocked(db.academicLevel.count).mockResolvedValue(3)

      const result = await setupCatalogForSchool(schoolId)

      expect(result).toEqual({
        skipped: true,
        message: "School already has academic structure",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("does not skip if skipIfExists is false", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(3)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "both",
        country: "SD",
      } as any)
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([])
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
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([])
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
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([
        { id: "cs1", name: "رياضيات", levels: ["ELEMENTARY"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      // Mock transaction to execute the callback
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
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
          schoolSubjectSelection: { create: vi.fn() },
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
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([
        { id: "cs1", name: "Math", levels: ["ELEMENTARY", "HIGH"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      const createdLevels: string[] = []
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
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
          schoolSubjectSelection: { create: vi.fn() },
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
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([
        { id: "cs1", name: "Science", levels: ["HIGH"], grades: [] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      let streamCount = 0
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          academicLevel: {
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
          schoolSubjectSelection: { create: vi.fn() },
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
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([])
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      await setupCatalogForSchool(schoolId, { country: "SD" })

      // Should use EG from school, not SD from options
      expect(db.catalogSubject.findMany).toHaveBeenCalledWith(
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
      const deletions: string[] = []
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          schoolSubjectSelection: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("schoolSubjectSelection")
            }),
          },
          schoolContentOverride: {
            deleteMany: vi.fn().mockImplementation(async () => {
              deletions.push("schoolContentOverride")
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
      expect(deletions.indexOf("schoolSubjectSelection")).toBeLessThan(
        deletions.indexOf("academicLevel")
      )
    })
  })

  // ========================================================================
  // getRankedLessonVideos
  // ========================================================================

  describe("getRankedLessonVideos", () => {
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
      vi.mocked(db.lessonVideo.findMany).mockResolvedValue(mockVideos as any)

      const result = await getRankedLessonVideos("lesson-1", schoolId)

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
      vi.mocked(db.lessonVideo.findMany).mockResolvedValue([])

      await getRankedLessonVideos("lesson-1", null)

      expect(db.lessonVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            visibility: "PUBLIC",
          }),
        })
      )
    })

    it("filters to school-only when includeSchoolOnly is true", async () => {
      vi.mocked(db.lessonVideo.findMany).mockResolvedValue([])

      await getRankedLessonVideos("lesson-1", schoolId, {
        includeSchoolOnly: true,
      })

      expect(db.lessonVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId,
          }),
        })
      )
    })

    it("respects limit option", async () => {
      vi.mocked(db.lessonVideo.findMany).mockResolvedValue([])

      await getRankedLessonVideos("lesson-1", schoolId, { limit: 5 })

      expect(db.lessonVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })
  })

  // ========================================================================
  // recordVideoView
  // ========================================================================

  describe("recordVideoView", () => {
    it("increments view count", async () => {
      vi.mocked(db.lessonVideo.update).mockResolvedValue({} as any)

      await recordVideoView("v1")

      expect(db.lessonVideo.update).toHaveBeenCalledWith({
        where: { id: "v1" },
        data: { viewCount: { increment: 1 } },
      })
    })
  })
})
