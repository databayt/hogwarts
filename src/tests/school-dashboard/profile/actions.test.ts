// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getContributionData,
  getPinnedItems,
  getRecentActivity,
  logUserActivity,
  recomputeMyBadges,
  updateGitHubProfile,
  updatePinnedItems,
  uploadProfileAvatar,
} from "@/components/school-dashboard/profile/actions"

vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    student: { findFirst: vi.fn(), update: vi.fn() },
    teacher: { findFirst: vi.fn(), update: vi.fn() },
    guardian: { findFirst: vi.fn() },
    staffMember: { update: vi.fn() },
    pinnedItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    userActivity: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
    profileBadge: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    organizationMembership: { count: vi.fn() },
    attendance: { findMany: vi.fn(), count: vi.fn() },
    result: { findMany: vi.fn(), count: vi.fn() },
    assignmentSubmission: { findMany: vi.fn() },
    borrowRecord: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    achievement: { findMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe("updateGitHubProfile", () => {
  it("rejects unauthenticated callers", async () => {
    asUnauthed()
    const res = await updateGitHubProfile({ displayName: "X" })
    expect(res.success).toBe(false)
  })

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

describe("uploadProfileAvatar (validation)", () => {
  it("rejects unauthenticated callers", async () => {
    asUnauthed()
    const res = await uploadProfileAvatar(new FormData())
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

  it("replaces existing items via a transaction", async () => {
    asAuthed()
    vi.mocked(db.pinnedItem.deleteMany).mockReturnValue({} as never)
    vi.mocked(db.pinnedItem.createMany).mockReturnValue({} as never)
    const res = await updatePinnedItems([
      { itemType: "PROJECT", itemId: "p1", title: "P1", isPublic: true },
      { itemType: "COURSE", itemId: "c1", title: "C1", isPublic: false },
    ])
    expect(res.success).toBe(true)
    expect(db.$transaction).toHaveBeenCalled()
  })
})

describe("Recent activity (authz + scope)", () => {
  it("scopes by schoolId + userId and clamps the limit", async () => {
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

  it("rejects a STUDENT reading another user's activity (IDOR)", async () => {
    asAuthed("STUDENT")
    const res = await getRecentActivity("someone-else")
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("UNAUTHORIZED")
    expect(db.userActivity.findMany).not.toHaveBeenCalled()
  })

  it("allows an ADMIN to read another user's activity", async () => {
    asAuthed("ADMIN")
    vi.mocked(db.userActivity.findMany).mockResolvedValue([])
    const res = await getRecentActivity("someone-else")
    expect(res.success).toBe(true)
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

describe("getContributionData (tenant-scoped role lookup)", () => {
  it("scopes the role lookup by schoolId (no cross-tenant enumeration)", async () => {
    asAuthed()
    vi.mocked(db.user.findFirst).mockResolvedValue({ role: "TEACHER" } as never)
    // teacher not found in school → fetcher returns before any activity query
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const res = await getContributionData({ userId: "target", year: 2025 })
    expect(res.success).toBe(true)
    const call = vi.mocked(db.user.findFirst).mock.calls[0][0] as {
      where: { id: string; schoolId: string }
    }
    expect(call.where).toMatchObject({ id: "target", schoolId: SCHOOL_ID })
  })

  it("returns NOT_FOUND when the target user is not in this school", async () => {
    asAuthed()
    vi.mocked(db.user.findFirst).mockResolvedValue(null)
    const res = await getContributionData({ userId: "other-tenant-user" })
    expect(res.success).toBe(false)
    if (!res.success) expect(res.error).toBe("NOT_FOUND")
  })

  it("rejects out-of-range years", async () => {
    asAuthed()
    const res = await getContributionData({ year: 1999 })
    expect(res.success).toBe(false)
  })
})

describe("recomputeMyBadges", () => {
  it("rejects unauthenticated callers", async () => {
    asUnauthed()
    const res = await recomputeMyBadges()
    expect(res.success).toBe(false)
  })

  it("recomputes badges for an authed user (idempotent, no-signal case)", async () => {
    asAuthed("STAFF")
    vi.mocked(db.organizationMembership.count).mockResolvedValue(0)
    vi.mocked(db.userActivity.count).mockResolvedValue(0)
    vi.mocked(db.profileBadge.findMany).mockResolvedValue([])
    const res = await recomputeMyBadges()
    expect(res.success).toBe(true)
    if (res.success) expect(res.data.awarded).toBe(0)
  })
})
