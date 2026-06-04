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
    studentClass: { findMany: vi.fn() },
    class: { findMany: vi.fn() },
    result: { aggregate: vi.fn() },
    achievement: { findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
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
  // attachRoleStats (inside getProfileBasicData) queries these — default empty
  // so role-relation profiles don't throw. Individual tests override as needed.
  vi.mocked(db.studentClass.findMany).mockResolvedValue([] as never)
  vi.mocked(db.class.findMany).mockResolvedValue([] as never)
  vi.mocked(db.achievement.findMany).mockResolvedValue([] as never)
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as never)
  vi.mocked(db.result.aggregate).mockResolvedValue({
    _avg: { percentage: null },
  } as never)
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

describe("getProfileBasicData real stats (attachRoleStats)", () => {
  it("derives real student counts, average, subjects and achievements", async () => {
    asAuthed("STUDENT")
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: USER_ID,
      username: "stu",
      email: "s@school.edu",
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
        firstName: "Sam",
        lastName: "Lee",
        profilePhotoUrl: null,
        grNumber: "GR-9",
        city: null,
        enrollmentDate: null,
        email: "s@school.edu",
        application: null,
      },
    } as never)
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { class: { name: "Math A", subjectId: "math" } },
      { class: { name: "Math B", subjectId: "math" } },
      { class: { name: "Science", subjectId: "sci" } },
    ] as never)
    vi.mocked(db.result.aggregate).mockResolvedValue({
      _avg: { percentage: 87.4 },
    } as never)
    vi.mocked(db.achievement.findMany).mockResolvedValue([
      {
        id: "a1",
        title: "Top of Class",
        description: "First place",
        achievementDate: new Date("2025-06-01"),
        category: "Academic",
        level: "National",
        position: "1st",
        issuedBy: "Board",
      },
    ] as never)

    const res = await getProfileBasicData(USER_ID)
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.classCount).toBe(3)
    expect(res.data.subjectCount).toBe(2)
    // one name per distinct subject (Map keeps the last name per subjectId)
    expect(res.data.subjects).toEqual(["Math B", "Science"])
    expect(res.data.averagePercentage).toBe(87)
    const ach = res.data.achievements as Array<Record<string, unknown>>
    expect(ach).toHaveLength(1)
    expect(ach[0].title).toBe("Top of Class")
    expect(ach[0].level).toBe("platinum") // National → platinum
    const call = vi.mocked(db.achievement.findMany).mock.calls[0][0] as {
      where: { studentId: string; schoolId: string }
    }
    expect(call.where).toMatchObject({
      studentId: "stu-1",
      schoolId: SCHOOL_ID,
    })
  })

  it("derives real teacher class count and students taught", async () => {
    asAuthed("TEACHER")
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: USER_ID,
      username: "t",
      email: "t@s.edu",
      image: null,
      role: "TEACHER",
      bio: null,
      website: null,
      timezone: null,
      pronouns: null,
      socialLinks: null,
      statusEmoji: null,
      statusMessage: null,
      createdAt: new Date("2024-01-01"),
      teacher: {
        id: "tch-1",
        firstName: "Tom",
        lastName: "R",
        profilePhotoUrl: null,
        employeeId: "E1",
        emailAddress: "t@s.edu",
        joiningDate: null,
      },
    } as never)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1", name: "Class 1", _count: { studentClasses: 20 } },
      { id: "c2", name: "Class 2", _count: { studentClasses: 15 } },
    ] as never)

    const res = await getProfileBasicData(USER_ID)
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.classCount).toBe(2)
    expect(res.data.studentsTaught).toBe(35)
    const classes = res.data.classes as Array<Record<string, unknown>>
    expect(classes[0]).toMatchObject({
      id: "c1",
      name: "Class 1",
      studentCount: 20,
    })
  })

  it("derives the real guardian children list and count", async () => {
    asAuthed("GUARDIAN")
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: USER_ID,
      username: "g",
      email: "g@s.edu",
      image: null,
      role: "GUARDIAN",
      bio: null,
      website: null,
      timezone: null,
      pronouns: null,
      socialLinks: null,
      statusEmoji: null,
      statusMessage: null,
      createdAt: new Date("2024-01-01"),
      guardian: {
        id: "grd-1",
        firstName: "Gina",
        lastName: "P",
        emailAddress: "g@s.edu",
      },
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      {
        student: {
          id: "s1",
          firstName: "Kid",
          lastName: "One",
          profilePhotoUrl: null,
        },
      },
      {
        student: {
          id: "s2",
          firstName: "Kid",
          lastName: "Two",
          profilePhotoUrl: null,
        },
      },
    ] as never)

    const res = await getProfileBasicData(USER_ID)
    expect(res.success).toBe(true)
    if (!res.success) return
    expect(res.data.childrenCount).toBe(2)
    const children = res.data.children as Array<Record<string, unknown>>
    expect(children).toHaveLength(2)
    expect(children[0]).toMatchObject({
      id: "s1",
      firstName: "Kid",
      lastName: "One",
    })
    const call = vi.mocked(db.studentGuardian.findMany).mock.calls[0][0] as {
      where: { guardianId: string; schoolId: string }
    }
    expect(call.where).toMatchObject({
      guardianId: "grd-1",
      schoolId: SCHOOL_ID,
    })
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

  it("logUserActivity rejects an empty title (Zod validation)", async () => {
    asAuthed()
    const res = await logUserActivity({
      activityType: "PROFILE_UPDATED",
      title: "",
    } as never)
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
    expect(db.userActivity.create).not.toHaveBeenCalled()
  })

  it("logUserActivity rejects an unknown activity type (Zod validation)", async () => {
    asAuthed()
    const res = await logUserActivity({
      activityType: "NOT_A_REAL_TYPE",
      title: "x",
    } as never)
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("VALIDATION_ERROR")
    expect(db.userActivity.create).not.toHaveBeenCalled()
  })

  it("logUserActivity rejects logging without a school context", async () => {
    asAuthedNoSchool()
    const res = await logUserActivity({
      activityType: "PROFILE_UPDATED",
      title: "x",
    })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("MISSING_SCHOOL")
  })
})
