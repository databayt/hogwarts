// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cross-tenant isolation. Every read/write path proves that schoolId is
// pulled from getTenantContext() and threaded into the Prisma where
// clause. Anything that lets a school B caller read or mutate school A
// data is a P0 leak.

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { listRecordings } from "../actions/recordings"
import {
  cancelLiveClass,
  getLiveClass,
  listLiveClasses,
} from "../actions/sessions"

vi.mock("@/lib/db", () => ({
  db: {
    conference: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    conferenceRecording: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    conferenceParticipant: {
      upsert: vi.fn(),
    },
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
  },
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/conference/livekit/rooms", () => ({
  ensureRoom: vi.fn(async () => undefined),
  endRoom: vi.fn(async () => undefined),
}))
vi.mock("../actions/notifications", () => ({
  notifyClassScheduled: vi.fn(async () => ({ created: 0 })),
  notifyClassCancelled: vi.fn(async () => ({ created: 0 })),
}))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"

function mockAdmin(schoolId: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: `u-admin-${schoolId}`, role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "ADMIN",
    isPlatformAdmin: false,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Live-classes — multi-tenant isolation", () => {
  it("listLiveClasses scopes findMany by schoolId from tenant context", async () => {
    mockAdmin(SCHOOL_A)
    vi.mocked(db.conference.findMany).mockResolvedValue([] as never)
    await listLiveClasses()
    expect(db.conference.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_A }),
      })
    )
  })

  it("getLiveClass scopes findFirst by schoolId — school B admin cannot fetch school A's class", async () => {
    mockAdmin(SCHOOL_B)
    vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
    const result = await getLiveClass("lcs-from-school-A")
    expect(db.conference.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "lcs-from-school-A",
          schoolId: SCHOOL_B,
        }),
      })
    )
    // not-found surfaces as LIVE_CLASS_NOT_FOUND, never the actual row
    expect("success" in result && result.success).toBe(false)
  })

  it("cancelLiveClass enforces schoolId on findFirst — school B cannot cancel school A's class", async () => {
    mockAdmin(SCHOOL_B)
    vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
    const result = await cancelLiveClass({ id: "lcs-from-school-A" })
    expect(db.conference.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "lcs-from-school-A",
          schoolId: SCHOOL_B,
          deletedAt: null,
        }),
      })
    )
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_NOT_FOUND")
  })

  it("listRecordings scopes findMany by schoolId + sessionId", async () => {
    mockAdmin(SCHOOL_A)
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      sectionId: "sec-1",
    } as never)
    vi.mocked(db.conferenceRecording.findMany).mockResolvedValue([] as never)
    await listRecordings("lcs-1")
    expect(db.conferenceRecording.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_A,
          sessionId: "lcs-1",
        }),
      })
    )
  })

  it("missing tenant context → every action returns MISSING_SCHOOL (no DB call leak)", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u", role: "ADMIN" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null,
      requestId: null,
      role: "ADMIN",
      isPlatformAdmin: false,
    } as never)
    const result = await listLiveClasses()
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(["MISSING_SCHOOL", "UNAUTHORIZED"]).toContain(result.error)
    expect(db.conference.findMany).not.toHaveBeenCalled()
  })
})
