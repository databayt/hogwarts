// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getMyContributions,
  submitAssignment,
  submitMaterial,
  submitQuestion,
  updateContributionVisibility,
} from "../contribution-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogQuestion: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    catalogMaterial: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    catalogAssignment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// ============================================================================
// Helpers
// ============================================================================

const TEACHER_SESSION = {
  user: { id: "teacher-1", role: "TEACHER" },
}

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "ADMIN" },
}

const STUDENT_SESSION = {
  user: { id: "student-1", role: "STUDENT" },
}

const SCHOOL_CONTEXT = { schoolId: "school-1" }

function setupAuth(session: any = TEACHER_SESSION) {
  vi.mocked(auth).mockResolvedValue(session)
  vi.mocked(getTenantContext).mockResolvedValue(SCHOOL_CONTEXT as any)
}

function makeQuestionInput(overrides: Record<string, unknown> = {}) {
  return {
    catalogSubjectId: "subject-1",
    questionText: "What is 2 + 2?",
    questionType: "MULTIPLE_CHOICE" as const,
    difficulty: "EASY" as const,
    bloomLevel: "REMEMBER" as const,
    points: 5,
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Catalog Contribution Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // submitQuestion
  // ==========================================================================

  describe("submitQuestion", () => {
    it("creates question with PENDING approval status", async () => {
      setupAuth()

      const mockQuestion = { id: "q-1" }
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogQuestion: {
            create: vi.fn().mockResolvedValue(mockQuestion),
          },
          subject: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          questionBank: {
            create: vi.fn(),
          },
          questionAnalytics: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await submitQuestion(makeQuestionInput())

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "q-1" })

      // Verify the transaction callback was called
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      const txCallback = vi.mocked(db.$transaction).mock.calls[0][0] as any
      // Re-run to inspect the create call args
      const spyCreate = vi.fn().mockResolvedValue(mockQuestion)
      await txCallback({
        catalogQuestion: { create: spyCreate },
        subject: { findFirst: vi.fn().mockResolvedValue(null) },
        questionBank: { create: vi.fn() },
        questionAnalytics: { create: vi.fn() },
      })

      expect(spyCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalStatus: "PENDING",
          catalogSubjectId: "subject-1",
          questionText: "What is 2 + 2?",
          questionType: "MULTIPLE_CHOICE",
          difficulty: "EASY",
          bloomLevel: "REMEMBER",
          points: 5,
          contributedBy: "teacher-1",
          contributedSchoolId: "school-1",
          status: "DRAFT",
        }),
      })
    })

    it("auto-mirrors to school's QuestionBank when subject is linked", async () => {
      setupAuth()

      const mockQuestion = { id: "q-1" }
      const mockSubject = { id: "school-subject-1" }
      const mockMirror = { id: "qb-1" }

      let questionBankCreateCalled = false
      let analyticsCreateCalled = false

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogQuestion: {
            create: vi.fn().mockResolvedValue(mockQuestion),
          },
          subject: {
            findFirst: vi.fn().mockResolvedValue(mockSubject),
          },
          questionBank: {
            create: vi.fn().mockImplementation(async () => {
              questionBankCreateCalled = true
              return mockMirror
            }),
          },
          questionAnalytics: {
            create: vi.fn().mockImplementation(async () => {
              analyticsCreateCalled = true
            }),
          },
        }
        return callback(tx)
      })

      const result = await submitQuestion(makeQuestionInput())

      expect(result.success).toBe(true)
      expect(questionBankCreateCalled).toBe(true)
      expect(analyticsCreateCalled).toBe(true)
    })

    it("does NOT mirror when no matching subject found", async () => {
      setupAuth()

      const mockQuestion = { id: "q-1" }
      let questionBankCreateCalled = false

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogQuestion: {
            create: vi.fn().mockResolvedValue(mockQuestion),
          },
          subject: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
          questionBank: {
            create: vi.fn().mockImplementation(async () => {
              questionBankCreateCalled = true
            }),
          },
          questionAnalytics: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await submitQuestion(makeQuestionInput())

      expect(result.success).toBe(true)
      expect(questionBankCreateCalled).toBe(false)
    })

    it("returns error for missing catalogSubjectId", async () => {
      setupAuth()

      const result = await submitQuestion(
        makeQuestionInput({ catalogSubjectId: "" })
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Subject is required")
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("returns error for empty questionText", async () => {
      setupAuth()

      const result = await submitQuestion(
        makeQuestionInput({ questionText: "   " })
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Question text is required")
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("requires TEACHER/ADMIN role (returns error for STUDENT)", async () => {
      setupAuth(STUDENT_SESSION)

      const result = await submitQuestion(makeQuestionInput())

      expect(result.success).toBe(false)
      expect(result.error).toContain(
        "TEACHER, ADMIN, or DEVELOPER role required"
      )
      expect(db.$transaction).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // submitMaterial
  // ==========================================================================

  describe("submitMaterial", () => {
    it("creates material with PENDING approval status", async () => {
      setupAuth()

      const mockMaterial = { id: "m-1" }
      vi.mocked(db.catalogMaterial.create).mockResolvedValue(
        mockMaterial as any
      )

      const result = await submitMaterial({
        catalogSubjectId: "subject-1",
        title: "Study Guide: Algebra",
        type: "STUDY_GUIDE",
        description: "Comprehensive algebra guide",
        tags: ["algebra", "math"],
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "m-1" })
      expect(db.catalogMaterial.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          catalogSubjectId: "subject-1",
          title: "Study Guide: Algebra",
          type: "STUDY_GUIDE",
          approvalStatus: "PENDING",
          contributedBy: "teacher-1",
          contributedSchoolId: "school-1",
          status: "DRAFT",
          visibility: "PUBLIC",
        }),
      })
    })

    it("returns error for missing title", async () => {
      setupAuth()

      const result = await submitMaterial({
        catalogSubjectId: "subject-1",
        title: "",
        type: "TEXTBOOK",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Title is required")
      expect(db.catalogMaterial.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // submitAssignment
  // ==========================================================================

  describe("submitAssignment", () => {
    it("creates assignment with PENDING approval status", async () => {
      setupAuth()

      const mockAssignment = { id: "a-1" }
      vi.mocked(db.catalogAssignment.create).mockResolvedValue(
        mockAssignment as any
      )

      const result = await submitAssignment({
        catalogSubjectId: "subject-1",
        title: "Lab Report: Photosynthesis",
        description: "Write a lab report on photosynthesis experiment",
        totalPoints: 100,
        estimatedTime: 60,
        tags: ["biology", "lab"],
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "a-1" })
      expect(db.catalogAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          catalogSubjectId: "subject-1",
          title: "Lab Report: Photosynthesis",
          approvalStatus: "PENDING",
          contributedBy: "teacher-1",
          contributedSchoolId: "school-1",
          status: "DRAFT",
          visibility: "PUBLIC",
          totalPoints: 100,
          estimatedTime: 60,
        }),
      })
    })

    it("returns error for missing title", async () => {
      setupAuth()

      const result = await submitAssignment({
        catalogSubjectId: "subject-1",
        title: "   ",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Title is required")
      expect(db.catalogAssignment.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateContributionVisibility
  // ==========================================================================

  describe("updateContributionVisibility", () => {
    it("updates visibility for owned question", async () => {
      setupAuth()

      vi.mocked(db.catalogQuestion.findFirst).mockResolvedValue({
        id: "q-1",
        contributedBy: "teacher-1",
      } as any)
      vi.mocked(db.catalogQuestion.update).mockResolvedValue({} as any)

      const result = await updateContributionVisibility(
        "question",
        "q-1",
        "SCHOOL"
      )

      expect(result.success).toBe(true)
      expect(db.catalogQuestion.findFirst).toHaveBeenCalledWith({
        where: { id: "q-1", contributedBy: "teacher-1" },
      })
      expect(db.catalogQuestion.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: { visibility: "SCHOOL" },
      })
    })

    it("returns error for non-owned content", async () => {
      setupAuth()

      vi.mocked(db.catalogQuestion.findFirst).mockResolvedValue(null)

      const result = await updateContributionVisibility(
        "question",
        "q-999",
        "PRIVATE"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Question not found or not owned by you")
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("returns error for unknown content type", async () => {
      setupAuth()

      const result = await updateContributionVisibility(
        "exam" as any,
        "e-1",
        "PUBLIC"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unknown content type: exam")
    })
  })

  // ==========================================================================
  // getMyContributions
  // ==========================================================================

  describe("getMyContributions", () => {
    it("returns contributions grouped by type", async () => {
      setupAuth()

      const mockQuestions = [
        {
          id: "q-1",
          questionText: "What is 2+2?",
          catalogSubject: { id: "s1", name: "Math" },
          catalogChapter: null,
          catalogLesson: null,
        },
      ]
      const mockMaterials = [
        {
          id: "m-1",
          title: "Study Guide",
          catalogSubject: { id: "s1", name: "Math" },
          catalogChapter: null,
          catalogLesson: null,
        },
      ]
      const mockAssignments = [
        {
          id: "a-1",
          title: "Lab Report",
          catalogSubject: { id: "s2", name: "Biology" },
          catalogChapter: { id: "c1", name: "Chapter 1" },
          catalogLesson: null,
        },
      ]

      vi.mocked(db.catalogQuestion.findMany).mockResolvedValue(
        mockQuestions as any
      )
      vi.mocked(db.catalogMaterial.findMany).mockResolvedValue(
        mockMaterials as any
      )
      vi.mocked(db.catalogAssignment.findMany).mockResolvedValue(
        mockAssignments as any
      )

      const result = await getMyContributions()

      expect(result.questions).toEqual(mockQuestions)
      expect(result.materials).toEqual(mockMaterials)
      expect(result.assignments).toEqual(mockAssignments)

      // Verify each query filters by contributedBy = userId
      expect(db.catalogQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contributedBy: "teacher-1" },
          orderBy: { createdAt: "desc" },
        })
      )
      expect(db.catalogMaterial.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contributedBy: "teacher-1" },
          orderBy: { createdAt: "desc" },
        })
      )
      expect(db.catalogAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contributedBy: "teacher-1" },
          orderBy: { createdAt: "desc" },
        })
      )
    })
  })
})
