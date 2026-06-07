// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"

import { createLiveClass } from "../list-actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("../list-permissions", () => ({
  canManageLiveClasses: vi.fn(() => true),
  canDeleteLiveClasses: vi.fn(() => true),
}))
vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    conference: { create: vi.fn() },
    conferenceLink: { upsert: vi.fn() },
  },
}))

const SCHOOL = "school-1"

const baseInput = {
  title: "Algebra review",
  teacherId: "t-1",
  subjectId: "sub-1",
  sectionId: "sec-1",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  meetingProvider: "Google Meet",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-01"),
  startTime: "09:00",
  endTime: "10:00",
  status: "scheduled" as const,
  description: "",
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-admin", role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as never)
  vi.mocked(resolveActiveTerm).mockResolvedValue({
    term: { id: "term-1" },
  } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t-1" } as never)
  vi.mocked(db.conference.create).mockResolvedValue({
    id: "lcs-1",
  } as never)
  vi.mocked(db.conferenceLink.upsert).mockResolvedValue({} as never)
})

describe("createLiveClass — saveAsDefault", () => {
  it("upserts the recurring ConferenceLink keyed by school+subject+section+term", async () => {
    const result = await createLiveClass({ ...baseInput, saveAsDefault: true })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_subjectId_sectionId_termId: {
            schoolId: SCHOOL,
            subjectId: "sub-1",
            sectionId: "sec-1",
            termId: "term-1",
          },
        },
        create: expect.objectContaining({
          provider: "external",
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
        update: expect.objectContaining({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      })
    )
  })

  it("does NOT persist a default link when saveAsDefault is false", async () => {
    const result = await createLiveClass({ ...baseInput, saveAsDefault: false })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).not.toHaveBeenCalled()
  })

  it("does NOT persist a default link when subject or section is missing", async () => {
    const result = await createLiveClass({
      ...baseInput,
      subjectId: null,
      saveAsDefault: true,
    })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).not.toHaveBeenCalled()
  })

  it("still creates the session if the default-link upsert throws (best-effort)", async () => {
    vi.mocked(db.conferenceLink.upsert).mockRejectedValue(
      new Error("db down")
    )
    const result = await createLiveClass({ ...baseInput, saveAsDefault: true })
    expect(result.success).toBe(true)
    expect(db.conference.create).toHaveBeenCalled()
  })
})
