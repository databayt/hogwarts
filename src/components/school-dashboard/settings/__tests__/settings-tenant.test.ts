// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createUser,
  deleteUser,
  getRoleStatistics,
  getSchoolUsers,
  updateUserRole,
  updateUserStatus,
} from "../actions"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "viewer-1", role: "ADMIN", schoolId: "school-123" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("settings tenant isolation", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updateUserRole returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const formData = new FormData()
    formData.set("userId", "user-1")
    formData.set("role", "TEACHER")

    const result = await updateUserRole(formData)
    expect(result.success).toBe(false)
    expect(result.message).toBe("Missing school context")
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it("updateUserRole passes schoolId directly to db query", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    vi.mocked(db.user.update).mockResolvedValue({} as any)

    const formData = new FormData()
    formData.set("userId", "user-1")
    formData.set("role", "TEACHER")

    await updateUserRole(formData)

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1", schoolId: mockSchoolId },
      })
    )
  })

  it("getSchoolUsers returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await getSchoolUsers()
    expect(result.success).toBe(false)
    expect(result.message).toBe("Missing school context")
    expect(db.user.findMany).not.toHaveBeenCalled()
  })

  it("createUser returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const formData = new FormData()
    formData.set("username", "newuser")
    formData.set("email", "new@test.com")
    formData.set("role", "STUDENT")

    const result = await createUser(formData)
    expect(result.success).toBe(false)
    expect(result.message).toBe("Missing school context")
    expect(db.user.create).not.toHaveBeenCalled()
  })

  it("deleteUser includes schoolId in where clause", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    vi.mocked(db.user.delete).mockResolvedValue({} as any)

    await deleteUser("target-user")

    expect(db.user.delete).toHaveBeenCalledWith({
      where: { id: "target-user", schoolId: mockSchoolId },
    })
  })

  it("getRoleStatistics returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const result = await getRoleStatistics()
    expect(result.success).toBe(false)
    expect(result.statistics).toEqual([])
    expect(db.user.groupBy).not.toHaveBeenCalled()
  })

  it("updateUserStatus returns error when schoolId is null", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "test",
      role: "ADMIN",
      locale: "en",
    })

    const formData = new FormData()
    formData.set("userId", "user-1")
    formData.set("isActive", "false")

    const result = await updateUserStatus(formData)
    expect(result.success).toBe(false)
    expect(result.message).toBe("Missing school context")
    expect(db.user.update).not.toHaveBeenCalled()
  })
})
