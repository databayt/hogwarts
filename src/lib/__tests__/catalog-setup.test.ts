import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  getRankedLessonVideos,
  recordVideoView,
  setupCatalogForSchool,
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
      findMany: vi.fn(),
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
    $transaction: vi.fn(),
  },
}))

describe("Catalog Setup", () => {
  const schoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

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
        message: "No catalog subjects found for this country/system",
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
        message: "No catalog subjects found for this country/system",
      })
    })

    it("creates full academic structure when catalog subjects exist", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        schoolLevel: "primary",
        country: "SD",
      } as any)
      vi.mocked(db.catalogSubject.findMany).mockResolvedValue([
        { id: "cs1", name: "رياضيات", levels: ["ELEMENTARY"] },
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
        { id: "cs1", name: "Math", levels: ["ELEMENTARY", "HIGH"] },
      ] as any)
      vi.mocked(db.yearLevel.findMany).mockResolvedValue([])

      let createdLevels: string[] = []
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
        { id: "cs1", name: "Science", levels: ["HIGH"] },
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

    it("respects limit option", async () => {
      vi.mocked(db.lessonVideo.findMany).mockResolvedValue([])

      await getRankedLessonVideos("lesson-1", schoolId, { limit: 5 })

      expect(db.lessonVideo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      )
    })
  })

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
