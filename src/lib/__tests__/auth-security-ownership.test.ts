// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { canUserAccessSchool, ensureUserSchool } from "@/lib/school-access"

import { requireSchoolOwnership, TenantError } from "../auth-security"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-1",
      email: "admin@school-a.org",
      schoolId: "school-a",
      role: "ADMIN",
    },
  }),
}))

vi.mock("@/lib/school-access", () => ({
  canUserAccessSchool: vi.fn(),
  ensureUserSchool: vi.fn(),
}))

const mockCanAccess = canUserAccessSchool as ReturnType<typeof vi.fn>
const mockEnsureSchool = ensureUserSchool as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("requireSchoolOwnership", () => {
  it("allows access when user schoolId matches target", async () => {
    mockCanAccess.mockResolvedValue({ hasAccess: true })

    const ctx = await requireSchoolOwnership("school-a")

    expect(ctx.schoolId).toBe("school-a")
    expect(ctx.userId).toBe("user-1")
  })

  it("throws CROSS_TENANT_ACCESS_DENIED when user has different schoolId", async () => {
    mockCanAccess.mockResolvedValue({ hasAccess: false })

    await expect(requireSchoolOwnership("school-b")).rejects.toThrow(
      TenantError
    )

    try {
      await requireSchoolOwnership("school-b")
    } catch (error) {
      expect(error).toBeInstanceOf(TenantError)
      expect((error as TenantError).code).toBe("CROSS_TENANT_ACCESS_DENIED")
    }
  })

  it("creates school for user without schoolId via ensureUserSchool", async () => {
    // Override auth to return user without schoolId
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: {
        id: "user-new",
        email: "new@school.org",
        schoolId: null,
        role: "USER",
      },
    })

    mockCanAccess.mockResolvedValue({ hasAccess: false })
    mockEnsureSchool.mockResolvedValue({
      success: true,
      schoolId: "school-new",
    })

    const ctx = await requireSchoolOwnership("school-new")

    expect(mockEnsureSchool).toHaveBeenCalledWith("user-new")
    expect(ctx.schoolId).toBe("school-new")
  })

  it("throws when ensureUserSchool recovery yields different schoolId", async () => {
    const { auth } = await import("@/auth")
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: {
        id: "user-new",
        email: "new@school.org",
        schoolId: null,
        role: "USER",
      },
    })

    mockCanAccess.mockResolvedValue({ hasAccess: false })
    mockEnsureSchool.mockResolvedValue({
      success: true,
      schoolId: "school-other",
    })

    await expect(requireSchoolOwnership("school-target")).rejects.toThrow(
      TenantError
    )
  })
})
