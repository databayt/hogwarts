// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { getSchoolSubjects } from "@/lib/school-subjects"
import { getTenantContext } from "@/lib/tenant-context"

import { getSubjects } from "@/components/school-dashboard/listings/subjects/actions"

// Mock dependencies
vi.mock("@/lib/school-subjects", () => ({
  getSchoolSubjects: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolSubjectSelection: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    catalogSubject: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    teacherSubjectExpertise: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    exam: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    questionBank: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({})),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Subject Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
  })

  describe("getSubjects", () => {
    it("fetches subjects from Subject via school-subjects lib", async () => {
      const mockSubjects = [
        {
          id: "1",
          name: "Mathematics",
          slug: "mathematics",
          department: "Sciences",
          description: null,
          imageUrl: null,
          color: null,
          status: "PUBLISHED",
          sortOrder: 0,
          country: "US",
          curriculum: "us-k12",
          schoolTypes: [],
          levels: [],
          grades: [],
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          name: "English",
          slug: "english",
          department: "Languages",
          description: null,
          imageUrl: null,
          color: null,
          status: "PUBLISHED",
          sortOrder: 1,
          country: "US",
          curriculum: "us-k12",
          schoolTypes: [],
          levels: [],
          grades: [],
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      vi.mocked(getSchoolSubjects).mockResolvedValue(mockSubjects as any)

      const result = await getSubjects({})

      expect(result.success).toBe(true)
      expect(result.data?.rows).toHaveLength(2)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getSubjects({})

      expect(result.success).toBe(false)
    })
  })
})
