// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { uploadVideo } from "../video-actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lesson: {
      findUnique: vi.fn(),
    },
    video: {
      create: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockLessonFind = db.lesson.findUnique as ReturnType<typeof vi.fn>
const mockVideoCreate = db.video.create as ReturnType<typeof vi.fn>

const baseInput = {
  catalogLessonId: "lesson-1",
  title: "Algebra Intro",
  videoUrl: "https://example.com/video.mp4",
  provider: "SELF_HOSTED" as const,
  durationSeconds: 600,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockLessonFind.mockResolvedValue({
    id: "lesson-1",
    chapter: { subject: { slug: "math" } },
  })
  mockVideoCreate.mockResolvedValue({ id: "video-1" })
})

describe("uploadVideo — auth & permissions", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await uploadVideo(baseInput)
    expect(result.status).toBe("error")
    expect(mockVideoCreate).not.toHaveBeenCalled()
  })

  it.each(["STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "USER"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await uploadVideo(baseInput)
      expect(result.status).toBe("error")
      expect(mockVideoCreate).not.toHaveBeenCalled()
    }
  )

  it.each(["ADMIN", "TEACHER", "DEVELOPER"] as const)(
    "permits role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await uploadVideo(baseInput)
      expect(result.status).toBe("success")
      expect(mockVideoCreate).toHaveBeenCalledOnce()
    }
  )

  it("returns error without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await uploadVideo(baseInput)
    expect(result.status).toBe("error")
    expect(mockVideoCreate).not.toHaveBeenCalled()
  })
})

describe("uploadVideo — input validation", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("rejects missing title", async () => {
    const result = await uploadVideo({ ...baseInput, title: " " })
    expect(result.status).toBe("error")
  })

  it("rejects missing videoUrl", async () => {
    const result = await uploadVideo({ ...baseInput, videoUrl: "" })
    expect(result.status).toBe("error")
  })

  it("rejects PAID without price", async () => {
    const result = await uploadVideo({
      ...baseInput,
      pricing: "PAID",
      price: 0,
      currency: "USD",
    })
    expect(result.status).toBe("error")
  })

  it("rejects PAID without 3-letter currency", async () => {
    const result = await uploadVideo({
      ...baseInput,
      pricing: "PAID",
      price: 10,
      currency: "US",
    })
    expect(result.status).toBe("error")
  })

  it("accepts PAID with valid price + 3-letter currency", async () => {
    const result = await uploadVideo({
      ...baseInput,
      pricing: "PAID",
      price: 10,
      currency: "usd",
    })
    expect(result.status).toBe("success")
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          visibility: "PAID",
          price: 10,
          currency: "USD",
        }),
      })
    )
  })

  it("returns error for unknown lesson", async () => {
    mockLessonFind.mockResolvedValueOnce(null)
    const result = await uploadVideo(baseInput)
    expect(result.status).toBe("error")
    expect(mockVideoCreate).not.toHaveBeenCalled()
  })
})

describe("uploadVideo — multi-tenant write", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-1", role: "TEACHER" } })
  })

  it("writes schoolId from tenant context", async () => {
    mockTenant.mockResolvedValueOnce({
      schoolId: "school-7",
      subdomain: "seven",
    })
    await uploadVideo(baseInput)
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ schoolId: "school-7" }),
      })
    )
  })

  it("forces approvalStatus=PENDING regardless of role", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "DEVELOPER" } })
    await uploadVideo(baseInput)
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ approvalStatus: "PENDING" }),
      })
    )
  })

  it("writes uploader's userId as owner", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-42", role: "TEACHER" },
    })
    await uploadVideo(baseInput)
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "owner-42" }),
      })
    )
  })

  it("defaults visibility to SCHOOL when audience omitted", async () => {
    await uploadVideo(baseInput)
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: "SCHOOL" }),
      })
    )
  })

  it("respects PRIVATE/PUBLIC audience choice", async () => {
    await uploadVideo({ ...baseInput, audience: "PRIVATE" })
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: "PRIVATE" }),
      })
    )
    mockVideoCreate.mockClear()
    await uploadVideo({ ...baseInput, audience: "PUBLIC" })
    expect(mockVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: "PUBLIC" }),
      })
    )
  })
})
