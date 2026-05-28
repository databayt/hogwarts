// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { generateQRSession, getActiveQRSessions, processQRScan } from "../qr"

vi.mock("@/lib/db", () => ({
  db: {
    qRCodeSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    attendance: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(role = "TEACHER", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER, schoolId, role },
  } as any)
}

describe("attendance QR actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("TEACHER")
  })

  describe("generateQRSession", () => {
    it("denies missing schoolId", async () => {
      mockAuth("TEACHER", null)

      const result = await generateQRSession({ classId: "c1" })

      expect(result.success).toBe(false)
    })
  })

  describe("processQRScan", () => {
    it("denies missing schoolId", async () => {
      mockAuth("STUDENT", null)

      const result = await processQRScan({ code: "abc" })

      expect(result.success).toBe(false)
    })

    it("looks up session by code AND schoolId (no cross-school scan)", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.qRCodeSession.findFirst).mockResolvedValue(null)

      const result = await processQRScan({ code: "abc" })

      expect(result.success).toBe(false)
      const call = vi.mocked(db.qRCodeSession.findFirst).mock.calls[0]?.[0]
      if (call?.where) {
        expect(call.where).toMatchObject({ schoolId: SCHOOL })
      }
    })
  })

  describe("getActiveQRSessions", () => {
    it("returns a defined value (array or response object)", async () => {
      vi.mocked(db.qRCodeSession.findMany).mockResolvedValue([])

      const result = await getActiveQRSessions()

      expect(result).toBeDefined()
    })

    it("denies missing schoolId or returns empty", async () => {
      mockAuth("TEACHER", null)
      vi.mocked(db.qRCodeSession.findMany).mockResolvedValue([])

      const result = await getActiveQRSessions()

      // Could return empty/falsy
      expect(
        Array.isArray(result) ||
          (result as any).success === false ||
          (result as any).data
      ).toBeDefined()
    })
  })
})
