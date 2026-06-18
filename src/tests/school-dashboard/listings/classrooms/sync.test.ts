// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { syncDefaultClassrooms } from "@/components/school-dashboard/listings/classrooms/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    classroomType: { upsert: vi.fn() },
    academicGrade: { count: vi.fn() },
  },
}))

const provisionMock = vi.fn()
vi.mock("@/components/catalog/provision", () => ({
  autoProvisionSections: (...args: unknown[]) => provisionMock(...args),
}))

const SCHOOL = "school-1"

function asAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin()
})

describe("syncDefaultClassrooms", () => {
  it("returns MISSING_SCHOOL when tenant context is unavailable", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "demo",
      role: "ADMIN",
      locale: "en",
    })

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns NOT_AUTHENTICATED when no session is present", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns UNAUTHORIZED when role lacks create permission", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "STUDENT", schoolId: SCHOOL },
    } as any)

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns NO_GRADES_FOUND when the school has no academic grades yet", async () => {
    vi.mocked(db.classroomType.upsert).mockResolvedValue({ id: "ct1" } as any)
    vi.mocked(db.academicGrade.count).mockResolvedValue(0)

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NO_GRADES_FOUND")
    expect(provisionMock).not.toHaveBeenCalled()
  })

  it("upserts a default classroom type, calls autoProvisionSections, and reports counts", async () => {
    vi.mocked(db.classroomType.upsert).mockResolvedValue({ id: "ct1" } as any)
    vi.mocked(db.academicGrade.count).mockResolvedValue(6)
    provisionMock.mockResolvedValue({ classrooms: 12, sections: 12 })

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ classrooms: 12, sections: 12, grades: 6 })
    }
    expect(provisionMock).toHaveBeenCalledWith(SCHOOL)
    expect(vi.mocked(db.classroomType.upsert)).toHaveBeenCalledWith({
      where: { schoolId_name: { schoolId: SCHOOL, name: "Classroom" } },
      create: { schoolId: SCHOOL, name: "Classroom" },
      update: {},
    })
  })

  it("returns CREATE_FAILED when provisioning throws", async () => {
    vi.mocked(db.classroomType.upsert).mockResolvedValue({ id: "ct1" } as any)
    vi.mocked(db.academicGrade.count).mockResolvedValue(6)
    provisionMock.mockRejectedValue(new Error("kaboom"))

    const result = await syncDefaultClassrooms()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CREATE_FAILED")
  })
})
