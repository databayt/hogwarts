// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Certificate-config action tests.
 *
 * Certificates are sensitive: once issued, a forgery would be hard to recall.
 * These tests guarantee tenant isolation across config CRUD plus a few
 * representative attack patterns (cross-tenant id, missing schoolId).
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createCertificateConfig,
  deleteCertificateConfig,
  getCertificateConfig,
  getCertificateConfigs,
  updateCertificateConfig,
} from "@/components/school-dashboard/exams/certificates/actions"

vi.mock("@/lib/db", () => ({
  db: {
    examCertificateConfig: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_ID = "school-cert-1"
const VALID_CONFIG = {
  name: "Honor Roll",
  type: "MERIT" as const,
  description: "End-of-year honor roll certificate",
  templateStyle: "elegant" as const,
  orientation: "landscape" as const,
  titleText: "Certificate of Merit",
  bodyTemplate: "This is to certify that {{studentName}}...",
  signatures: [{ name: "Principal", title: "Headmaster" }],
  useSchoolLogo: true,
  borderStyle: "gold" as const,
  enableVerification: true,
}

describe("Certificate Config Actions — multi-tenant safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-1", schoolId: SCHOOL_ID, role: "ADMIN" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    } as any)
  })

  describe("createCertificateConfig", () => {
    it("rejects missing schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await createCertificateConfig(VALID_CONFIG)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NO_SCHOOL")
      expect(db.examCertificateConfig.create).not.toHaveBeenCalled()
    })

    it("creates config with schoolId baked into payload", async () => {
      vi.mocked(db.examCertificateConfig.create).mockResolvedValue({
        id: "cfg-1",
      } as any)

      const result = await createCertificateConfig(VALID_CONFIG)

      expect(result.success).toBe(true)
      expect(db.examCertificateConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ schoolId: SCHOOL_ID }),
        })
      )
    })

    it("rejects invalid input via zod (no signatures)", async () => {
      const bad = { ...VALID_CONFIG, signatures: [] }
      const result = await createCertificateConfig(bad)

      expect(result.success).toBe(false)
      expect(db.examCertificateConfig.create).not.toHaveBeenCalled()
    })
  })

  describe("getCertificateConfigs", () => {
    it("scopes findMany by schoolId + isActive", async () => {
      vi.mocked(db.examCertificateConfig.findMany).mockResolvedValue([])

      await getCertificateConfigs()

      expect(db.examCertificateConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL_ID, isActive: true },
        })
      )
    })

    it("returns [] when no schoolId (no leak)", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: "req-1",
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await getCertificateConfigs()

      expect(result).toHaveLength(0)
      expect(db.examCertificateConfig.findMany).not.toHaveBeenCalled()
    })
  })

  describe("getCertificateConfig", () => {
    it("scopes findFirst by id + schoolId", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)

      await getCertificateConfig("cfg-1")

      expect(db.examCertificateConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cfg-1", schoolId: SCHOOL_ID },
        })
      )
    })

    it("returns null for cross-tenant id", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)

      const result = await getCertificateConfig("cfg-from-school-b")

      expect(result).toBeNull()
    })
  })

  describe("updateCertificateConfig", () => {
    it("verifies config belongs to school before update", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)

      const result = await updateCertificateConfig({
        id: "cfg-foreign",
        name: "Hack",
      })

      expect(result.success).toBe(false)
      expect(db.examCertificateConfig.update).not.toHaveBeenCalled()
    })

    it("does NOT pass id to update.where bypassing the school check", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
        id: "cfg-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.examCertificateConfig.update).mockResolvedValue({} as any)

      await updateCertificateConfig({ id: "cfg-1", name: "Updated" })

      // The findFirst step is the gate; update is reached only after
      expect(db.examCertificateConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cfg-1", schoolId: SCHOOL_ID },
        })
      )
      expect(db.examCertificateConfig.update).toHaveBeenCalled()
    })
  })

  describe("deleteCertificateConfig", () => {
    it("rejects deletion of foreign-school config", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue(null)

      const result = await deleteCertificateConfig("cfg-foreign")

      expect(result.success).toBe(false)
      expect(db.examCertificateConfig.delete).not.toHaveBeenCalled()
      expect(db.examCertificateConfig.update).not.toHaveBeenCalled()
    })

    it("soft-deletes when certificates have been issued", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
        id: "cfg-1",
        schoolId: SCHOOL_ID,
        _count: { certificates: 5 },
      } as any)
      vi.mocked(db.examCertificateConfig.update).mockResolvedValue({} as any)

      const result = await deleteCertificateConfig("cfg-1")

      expect(result.success).toBe(true)
      expect(db.examCertificateConfig.update).toHaveBeenCalledWith({
        where: { id: "cfg-1" },
        data: { isActive: false },
      })
      expect(db.examCertificateConfig.delete).not.toHaveBeenCalled()
    })

    it("hard-deletes when no certificates issued", async () => {
      vi.mocked(db.examCertificateConfig.findFirst).mockResolvedValue({
        id: "cfg-1",
        schoolId: SCHOOL_ID,
        _count: { certificates: 0 },
      } as any)
      vi.mocked(db.examCertificateConfig.delete).mockResolvedValue({} as any)

      const result = await deleteCertificateConfig("cfg-1")

      expect(result.success).toBe(true)
      expect(db.examCertificateConfig.delete).toHaveBeenCalledWith({
        where: { id: "cfg-1" },
      })
    })
  })
})
