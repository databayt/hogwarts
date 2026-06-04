// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { currentUser } from "@/components/auth/auth"

import { canViewProfile, getProfileById } from "../actions"

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn() } },
}))

// detail/actions.ts authenticates via currentUser from @/components/auth/auth
// (NOT the global @/auth mock) — mock the correct module.
vi.mock("@/components/auth/auth", () => ({ currentUser: vi.fn() }))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"

function asViewer(role: string, schoolId: string | null, id = "viewer-1") {
  vi.mocked(currentUser).mockResolvedValue({ id, role, schoolId } as never)
}

function targetUser(over: Record<string, unknown> = {}) {
  return {
    id: "target-1",
    username: "target",
    email: "t@school.edu",
    emailVerified: null,
    image: null,
    role: "STUDENT",
    schoolId: SCHOOL_A,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: null,
    teacher: null,
    guardian: null,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getProfileById", () => {
  it("returns NOT_FOUND when the user does not exist", async () => {
    asViewer("ADMIN", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const res = await getProfileById("missing")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_FOUND")
  })

  it("denies cross-tenant access for non-DEVELOPER viewers", async () => {
    asViewer("ADMIN", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue(
      targetUser({ schoolId: SCHOOL_B }) as never
    )
    const res = await getProfileById("target-1")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("UNAUTHORIZED")
  })

  it("lets a DEVELOPER view a profile in another school", async () => {
    asViewer("DEVELOPER", null)
    vi.mocked(db.user.findUnique).mockResolvedValue(
      targetUser({ schoolId: SCHOOL_B }) as never
    )
    const res = await getProfileById("target-1")
    expect(res.success).toBe(true)
  })

  it("returns the owner's own profile with OWNER permission", async () => {
    asViewer("STUDENT", SCHOOL_A, "target-1")
    vi.mocked(db.user.findUnique).mockResolvedValue(targetUser() as never)
    const res = await getProfileById("target-1")
    expect(res.success).toBe(true)
    if (res.success) expect(res.permissionLevel).toBe("OWNER")
  })

  it("grants an ADMIN in the same school ADMIN permission", async () => {
    asViewer("ADMIN", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue(targetUser() as never)
    const res = await getProfileById("target-1")
    expect(res.success).toBe(true)
    if (res.success) expect(res.permissionLevel).toBe("ADMIN")
  })
})

describe("canViewProfile", () => {
  it("returns false when there is no viewer", async () => {
    vi.mocked(currentUser).mockResolvedValue(null as never)
    expect(await canViewProfile("x")).toBe(false)
  })

  it("lets a DEVELOPER view anyone", async () => {
    asViewer("DEVELOPER", null)
    expect(await canViewProfile("x")).toBe(true)
  })

  it("lets a user view their own profile", async () => {
    asViewer("STUDENT", SCHOOL_A, "me")
    expect(await canViewProfile("me")).toBe(true)
  })

  it("allows same-school viewing", async () => {
    asViewer("TEACHER", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      schoolId: SCHOOL_A,
    } as never)
    expect(await canViewProfile("target-1")).toBe(true)
  })

  it("denies cross-school viewing", async () => {
    asViewer("TEACHER", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      schoolId: SCHOOL_B,
    } as never)
    expect(await canViewProfile("target-1")).toBe(false)
  })

  it("returns false when the target user is missing", async () => {
    asViewer("TEACHER", SCHOOL_A)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    expect(await canViewProfile("missing")).toBe(false)
  })
})
