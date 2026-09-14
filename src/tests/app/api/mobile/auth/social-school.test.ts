// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"
import { completeSocialLogin } from "@/app/api/mobile/auth/social-school"

vi.mock("@/lib/db", () => ({
  db: { user: { findMany: vi.fn() } },
}))

vi.mock("@/app/api/mobile/auth/jwt", () => ({
  buildAuthResponse: vi.fn(async (u: { id: string; schoolId: string }) => ({
    access_token: `token-for-${u.id}`,
    refresh_token: "r",
    expires_at: 1,
    user: { id: u.id, school_id: u.schoolId },
  })),
}))

const platformUser = {
  id: "platform-1",
  email: "parent@example.com",
  schoolId: null,
  role: "USER",
  username: "Parent",
  image: null,
  isSuspended: false,
  tokenVersion: 0,
}

function membership(schoolId: string, extra: Record<string, unknown> = {}) {
  return {
    id: `user-${schoolId}`,
    email: "Parent@Example.com",
    schoolId,
    role: "GUARDIAN",
    username: "Parent",
    image: null,
    isSuspended: false,
    tokenVersion: 0,
    school: {
      id: schoolId,
      name: `School ${schoolId}`,
      nameEn: null,
      logoUrl: null,
      domain: schoolId,
      isActive: true,
    },
    ...extra,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("completeSocialLogin", () => {
  it("issues tokens directly for an identity that is already school-scoped", async () => {
    const res = await completeSocialLogin(
      { ...platformUser, schoolId: "s1" },
      undefined
    )
    expect((await res.json()).access_token).toBe("token-for-platform-1")
    expect(db.user.findMany).not.toHaveBeenCalled()
  })

  it("returns needs_school with the email's schools and NO tokens when no school_id is given", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      membership("s1"),
      membership("s2"),
    ] as never)
    const res = await completeSocialLogin(platformUser, undefined)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toEqual({
      needs_school: true,
      schools: [
        {
          id: "s1",
          name: "School s1",
          name_en: null,
          logo_url: null,
          domain: "s1",
        },
        {
          id: "s2",
          name: "School s2",
          name_en: null,
          logo_url: null,
          domain: "s2",
        },
      ],
    })
    expect(body.access_token).toBeUndefined()
    expect(buildAuthResponse).not.toHaveBeenCalled()
    // Membership is looked up by email, case-insensitively, school rows only.
    expect(db.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: { equals: "parent@example.com", mode: "insensitive" },
          schoolId: { not: null },
        },
      })
    )
  })

  it("issues tokens for the school row when school_id is one the email belongs to", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      membership("s1"),
      membership("s2"),
    ] as never)
    const res = await completeSocialLogin(platformUser, "s2")
    const body = await res.json()
    expect(body.access_token).toBe("token-for-user-s2")
    expect(body.user.school_id).toBe("s2")
  })

  it("refuses a school_id the email does not belong to (needs_school, no tokens)", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([membership("s1")] as never)
    const body = await (
      await completeSocialLogin(platformUser, "someone-elses-school")
    ).json()
    expect(body.needs_school).toBe(true)
    expect(body.access_token).toBeUndefined()
    expect(buildAuthResponse).not.toHaveBeenCalled()
  })

  it("403 when the chosen school account is suspended", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      membership("s1", { isSuspended: true }),
    ] as never)
    const res = await completeSocialLogin(platformUser, "s1")
    expect(res.status).toBe(403)
  })

  it("an identity without email gets an empty school list", async () => {
    const res = await completeSocialLogin(
      { ...platformUser, email: null },
      "s1"
    )
    expect(await res.json()).toEqual({ needs_school: true, schools: [] })
    expect(db.user.findMany).not.toHaveBeenCalled()
  })

  it("hides inactive schools from the list", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      membership("s1", {
        school: { ...membership("s1").school, isActive: false },
      }),
    ] as never)
    const body = await (
      await completeSocialLogin(platformUser, undefined)
    ).json()
    expect(body.schools).toEqual([])
  })
})
