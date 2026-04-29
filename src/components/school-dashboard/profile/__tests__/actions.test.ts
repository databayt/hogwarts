// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getPinnedItems,
  getProfileBasicData,
  getRecentActivity,
  getStaffProfile,
  getStudentProfile,
  getTeacherProfile,
  getUserProfileRole,
  logUserActivity,
  updateGitHubProfile,
  updatePinnedItems,
  updateProfile,
  updateProfileBio,
  uploadProfileAvatar,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
    pinnedItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    userActivity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

vi.mock("@/lib/content-display", () => ({
  getDisplayText: vi.fn(async (text: string) => text),
}))

const SCHOOL_ID = "school-1"
const USER_ID = "user-1"

function asAuthed(role = "TEACHER") {
  vi.mocked(auth).mockResolvedValue({
    user: {
      id: USER_ID,
      schoolId: SCHOOL_ID,
      role,
      email: `${role.toLowerCase()}@school.edu`,
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
    role,
    locale: "en",
  } as never)
}

function asUnauthed() {
  vi.mocked(auth).mockResolvedValue(null as never)
}

function asAuthedNoSchool() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, role: "DEVELOPER" },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    subdomain: null,
    role: "DEVELOPER",
    locale: "en",
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Profile fetch actions", () => {
  describe("getStudentProfile", () => {
    it("rejects unauthenticated callers with NOT_AUTHENTICATED", async () => {
      asUnauthed()
      const res = await getStudentProfile()
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("NOT_AUTHENTICATED")
    })

    it("rejects callers without a school context", async () => {
      asAuthedNoSchool()
      const res = await getStudentProfile()
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("MISSING_SCHOOL")
    })

    it("scopes the query by schoolId and target id", async () => {
      asAuthed()
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "stu-1",
      } as never)
      await getStudentProfile("stu-1")
      const call = vi.mocked(db.student.findFirst).mock.calls[0][0] as {
        where: { id: string; schoolId: string }
      }
      expect(call.where).toMatchObject({ id: "stu-1", schoolId: SCHOOL_ID })
    })

    it("falls back to the session user id when none is supplied", async () => {
      asAuthed()
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: USER_ID,
      } as never)
      await getStudentProfile()
      const call = vi.mocked(db.student.findFirst).mock.calls[0][0] as {
        where: { id: string }
      }
      expect(call.where.id).toBe(USER_ID)
    })

    it("returns STUDENT_NOT_FOUND when the student is missing", async () => {
      asAuthed()
      vi.mocked(db.student.findFirst).mockResolvedValue(null)
      const res = await getStudentProfile("missing")
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("STUDENT_NOT_FOUND")
    })
  })

  describe("getTeacherProfile", () => {
    it("returns TEACHER_NOT_FOUND when the teacher is missing", async () => {
      asAuthed()
      vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
      const res = await getTeacherProfile("missing")
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("TEACHER_NOT_FOUND")
    })
  })

  describe("getStaffProfile", () => {
    it("scopes by role to STAFF/ACCOUNTANT/ADMIN/DEVELOPER only", async () => {
      asAuthed("ADMIN")
      vi.mocked(db.user.findFirst).mockResolvedValue({ id: USER_ID } as never)
      await getStaffProfile()
      const call = vi.mocked(db.user.findFirst).mock.calls[0][0] as {
        where: { role: { in: string[] } }
      }
      expect(call.where.role.in).toEqual([
        "STAFF",
        "ACCOUNTANT",
        "ADMIN",
        "DEVELOPER",
      ])
    })
  })
})

describe("getProfileBasicData", () => {
  it("rejects unauthenticated callers", async () => {
    asUnauthed()
    const res = await getProfileBasicData(USER_ID)
    expect(res.success).toBe(false)
  })

  it("returns NOT_FOUND when no user/student/teacher matches in this school", async () => {
    asAuthed()
    vi.mocked(db.user.findFirst).mockResolvedValue(null)
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const res = await getProfileBasicData("missing")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_FOUND")
  })

  it("flattens role-record fields onto the result for downstream UI", async () => {
    asAuthed()
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: USER_ID,
      username: "alice",
      email: "alice@school.edu",
      image: null,
      role: "TEACHER",
      bio: "Hello",
      website: null,
      timezone: null,
      pronouns: null,
      socialLinks: null,
      statusEmoji: null,
      statusMessage: null,
      createdAt: new Date("2024-01-01"),
      teacher: {
        id: "tch-1",
        firstName: "Alice",
        lastName: "Smith",
        profilePhotoUrl: "/avatar.png",
        employeeId: "EMP-1",
        emailAddress: "alice@school.edu",
        joiningDate: new Date("2024-01-15"),
      },
    } as never)

    const res = await getProfileBasicData(USER_ID)
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.id).toBe("tch-1")
    expect(res.data.firstName).toBe("Alice")
    expect(res.data.employeeId).toBe("EMP-1")
    expect(res.data.role).toBe("TEACHER")
    // session.user.id === USER_ID, profileUserId === USER_ID → OWNER
    expect(res.data.viewerPermission).toBe("OWNER")
  })

  it("flags the viewer as STAFF when a teacher views another user's profile", async () => {
    asAuthed("TEACHER")
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: "other-user",
      username: "bob",
      email: "bob@school.edu",
      image: null,
      role: "STUDENT",
      bio: null,
      website: null,
      timezone: null,
      pronouns: null,
      socialLinks: null,
      statusEmoji: null,
      statusMessage: null,
      createdAt: new Date("2024-01-01"),
      student: {
        id: "stu-1",
        firstName: "Bob",
        lastName: "J",
        profilePhotoUrl: null,
        grNumber: "GR-1",
        city: null,
        enrollmentDate: null,
        email: "bob@school.edu",
        application: null,
      },
    } as never)
    const res = await getProfileBasicData("other-user")
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.viewerPermission).toBe("STAFF")
  })

  it("flags the viewer as ADMIN when a school admin views any other user", async () => {
    asAuthed("ADMIN")
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: "other-user",
      username: "bob",
      email: "bob@school.edu",
      image: null,
      role: "STUDENT",
      bio: null,
      website: null,
      timezone: null,
      pronouns: null,
      socialLinks: null,
      statusEmoji: null,
      statusMessage: null,
      createdAt: new Date("2024-01-01"),
    } as never)
    const res = await getProfileBasicData("other-user")
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.viewerPermission).toBe("ADMIN")
  })

  it("falls back to the student table when no User row exists (wizard-created students)", async () => {
    asAuthed()
    vi.mocked(db.user.findFirst).mockResolvedValue(null)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-1",
      firstName: "Bob",
      lastName: "Jones",
      profilePhotoUrl: null,
      grNumber: "GR-1",
      city: "Riyadh",
      enrollmentDate: new Date("2025-09-01"),
      email: "bob@school.edu",
      createdAt: new Date("2025-09-01"),
    } as never)

    const res = await getProfileBasicData("stu-1")
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.role).toBe("STUDENT")
    expect(res.data.grNumber).toBe("GR-1")
  })
})

describe("Profile mutation actions", () => {
  describe("updateProfile", () => {
    it("rejects unauthenticated callers", async () => {
      asUnauthed()
      const res = await updateProfile({ displayName: "Alice", locale: "en" })
      expect(res.success).toBe(false)
    })

    it("returns VALIDATION_ERROR for invalid input", async () => {
      asAuthed()
      const res = await updateProfile({
        displayName: "",
        locale: "en",
      } as never)
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
    })

    it("persists the new display name and clears empty avatar to null", async () => {
      asAuthed()
      vi.mocked(db.user.update).mockResolvedValue({} as never)
      const res = await updateProfile({
        displayName: "Alice",
        avatarUrl: "",
        locale: "en",
      })
      expect(res.success).toBe(true)
      const call = vi.mocked(db.user.update).mock.calls[0][0] as {
        data: { username: string; image: string | null }
      }
      expect(call.data).toEqual({ username: "Alice", image: null })
    })
  })

  describe("updateProfileBio", () => {
    it("clears the bio when an empty value is supplied", async () => {
      asAuthed()
      vi.mocked(db.user.update).mockResolvedValue({} as never)
      const res = await updateProfileBio({ bio: "" })
      expect(res.success).toBe(true)
      const call = vi.mocked(db.user.update).mock.calls[0][0] as {
        data: { bio: string | null }
      }
      expect(call.data.bio).toBeNull()
    })

    it("rejects bios over 500 characters", async () => {
      asAuthed()
      const res = await updateProfileBio({ bio: "a".repeat(501) })
      expect(res.success).toBe(false)
    })
  })

  describe("updateGitHubProfile", () => {
    it("persists every supported field", async () => {
      asAuthed()
      vi.mocked(db.user.update).mockResolvedValue({} as never)
      const res = await updateGitHubProfile({
        displayName: "Bob",
        bio: "Hello",
        website: "https://bob.dev",
        timezone: "UTC",
        statusEmoji: ":wave:",
        statusMessage: "Coding",
        pronouns: "he/him",
      })
      expect(res.success).toBe(true)
      const call = vi.mocked(db.user.update).mock.calls[0][0] as {
        data: Record<string, unknown>
      }
      expect(call.data.username).toBe("Bob")
      expect(call.data.website).toBe("https://bob.dev")
      expect(call.data.statusEmoji).toBe(":wave:")
    })
  })

  describe("uploadProfileAvatar", () => {
    it("rejects unauthenticated callers", async () => {
      asUnauthed()
      const fd = new FormData()
      const res = await uploadProfileAvatar(fd)
      expect(res.success).toBe(false)
    })

    it("rejects requests with no file", async () => {
      asAuthed()
      const res = await uploadProfileAvatar(new FormData())
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
    })

    it("rejects unsupported MIME types", async () => {
      asAuthed()
      const fd = new FormData()
      fd.append("avatar", new File(["x"], "a.bmp", { type: "image/bmp" }))
      const res = await uploadProfileAvatar(fd)
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("INVALID_FILE_TYPE")
    })

    it("rejects oversized files (> 5 MB)", async () => {
      asAuthed()
      const big = new Uint8Array(5 * 1024 * 1024 + 1)
      const fd = new FormData()
      fd.append("avatar", new File([big], "a.png", { type: "image/png" }))
      const res = await uploadProfileAvatar(fd)
      expect(res.success).toBe(false)
      if (!res.success) expect(res.error).toBe("UPLOAD_FAILED")
    })
  })
})

describe("Pinned items", () => {
  it("scopes by schoolId and userId", async () => {
    asAuthed()
    vi.mocked(db.pinnedItem.findMany).mockResolvedValue([])
    await getPinnedItems()
    const call = vi.mocked(db.pinnedItem.findMany).mock.calls[0][0] as {
      where: { schoolId: string; userId: string }
    }
    expect(call.where.schoolId).toBe(SCHOOL_ID)
    expect(call.where.userId).toBe(USER_ID)
  })

  it("hides private pinned items when viewing a different user", async () => {
    asAuthed()
    vi.mocked(db.pinnedItem.findMany).mockResolvedValue([])
    await getPinnedItems("other-user")
    const call = vi.mocked(db.pinnedItem.findMany).mock.calls[0][0] as {
      where: { isPublic?: boolean }
    }
    expect(call.where.isPublic).toBe(true)
  })

  it("rejects more than six pinned items", async () => {
    asAuthed()
    const items = Array.from({ length: 7 }, (_, i) => ({
      itemType: "PROJECT" as const,
      itemId: `id-${i}`,
      title: `Title ${i}`,
      isPublic: true,
    }))
    const res = await updatePinnedItems(items)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBe("VALIDATION_ERROR")
      expect(res.details).toBe("MAX_PINNED_EXCEEDED")
    }
  })

  it("replaces existing items in a delete-then-create transaction-like flow", async () => {
    asAuthed()
    vi.mocked(db.pinnedItem.deleteMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(db.pinnedItem.createMany).mockResolvedValue({ count: 2 } as never)
    const res = await updatePinnedItems([
      { itemType: "PROJECT", itemId: "p1", title: "P1", isPublic: true },
      { itemType: "COURSE", itemId: "c1", title: "C1", isPublic: false },
    ])
    expect(res.success).toBe(true)
    expect(db.pinnedItem.deleteMany).toHaveBeenCalled()
    expect(db.pinnedItem.createMany).toHaveBeenCalled()
  })
})

describe("Recent activity", () => {
  it("scopes by schoolId + userId and limits results", async () => {
    asAuthed()
    vi.mocked(db.userActivity.findMany).mockResolvedValue([])
    await getRecentActivity(undefined, 5)
    const call = vi.mocked(db.userActivity.findMany).mock.calls[0][0] as {
      where: { schoolId: string; userId: string }
      take: number
    }
    expect(call.where.schoolId).toBe(SCHOOL_ID)
    expect(call.where.userId).toBe(USER_ID)
    expect(call.take).toBe(5)
  })

  it("logUserActivity persists with the session schoolId + userId", async () => {
    asAuthed()
    vi.mocked(db.userActivity.create).mockResolvedValue({} as never)
    await logUserActivity({
      activityType: "PROFILE_UPDATED",
      title: "Updated bio",
    })
    const call = vi.mocked(db.userActivity.create).mock.calls[0][0] as {
      data: { schoolId: string; userId: string; activityType: string }
    }
    expect(call.data.schoolId).toBe(SCHOOL_ID)
    expect(call.data.userId).toBe(USER_ID)
    expect(call.data.activityType).toBe("PROFILE_UPDATED")
  })
})

describe("getUserProfileRole", () => {
  it("maps STUDENT to 'student'", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "STUDENT",
    } as never)
    expect(await getUserProfileRole("u1")).toBe("student")
  })

  it("maps TEACHER to 'teacher'", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "TEACHER",
    } as never)
    expect(await getUserProfileRole("u1")).toBe("teacher")
  })

  it("maps GUARDIAN to 'parent'", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({
      role: "GUARDIAN",
    } as never)
    expect(await getUserProfileRole("u1")).toBe("parent")
  })

  it("maps STAFF/ADMIN/ACCOUNTANT to 'staff'", async () => {
    asAuthed()
    for (const role of ["STAFF", "ADMIN", "ACCOUNTANT"] as const) {
      vi.mocked(db.user.findUnique).mockResolvedValue({ role } as never)
      expect(await getUserProfileRole("u1")).toBe("staff")
    }
  })

  it("returns null for unknown roles", async () => {
    asAuthed()
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "USER" } as never)
    expect(await getUserProfileRole("u1")).toBeNull()
  })

  it("returns null when no session and no userId is given", async () => {
    asUnauthed()
    expect(await getUserProfileRole()).toBeNull()
  })
})
