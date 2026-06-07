// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { ComplianceProvider, ConnectorMode } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createSharedCredentialGroup,
  retryComplianceSubmission,
  updateComplianceConfig,
} from "@/components/school-dashboard/compliance/actions"

vi.mock("@/lib/db", () => ({
  db: {
    schoolComplianceConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    complianceSubmission: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    sharedComplianceCredentialGroup: {
      create: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/compliance/encryption", () => ({
  encryptSecret: vi.fn(() => ({ ciphertext: "enc", keyVersion: 1 })),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(
  role: string | null = "ADMIN",
  schoolId: string | null = SCHOOL
) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: USER, schoolId, role } } as any) : null
  )
}

describe("compliance server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("updateComplianceConfig", () => {
    const valid = {
      provider: ComplianceProvider.ADEK_ESIS,
      enabled: true,
      mode: ConnectorMode.DRY_RUN,
      submissionTimeUtc: "10:00",
      parentContactSlaMinutes: 120,
      notifyAdminOnFailure: true,
    }

    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await updateComplianceConfig(valid)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("NOT_AUTHENTICATED")
    })

    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await updateComplianceConfig(valid)

      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.errorCode).toBe("MISSING_SCHOOL_CONTEXT")
    })

    it("denies non-admin (TEACHER)", async () => {
      mockAuth("TEACHER")

      const result = await updateComplianceConfig(valid)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("FORBIDDEN")
    })

    it("rejects invalid Zod input", async () => {
      const result = await updateComplianceConfig({
        ...valid,
        submissionTimeUtc: "invalid",
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("VALIDATION_FAILED")
    })

    it("upserts config on valid input", async () => {
      vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue(null)
      vi.mocked(db.schoolComplianceConfig.upsert).mockResolvedValue({
        id: "cfg-1",
      } as any)

      const result = await updateComplianceConfig(valid)

      expect(result.success).toBe(true)
      expect(db.schoolComplianceConfig.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId_provider: {
              schoolId: SCHOOL,
              provider: ComplianceProvider.ADEK_ESIS,
            },
          }),
        })
      )
    })
  })

  describe("retryComplianceSubmission", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await retryComplianceSubmission({ submissionId: "s1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("NOT_AUTHENTICATED")
    })

    it("denies non-admin", async () => {
      mockAuth("STAFF")

      const result = await retryComplianceSubmission({ submissionId: "s1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("FORBIDDEN")
    })

    it("denies cross-school retry (submission's schoolId mismatch)", async () => {
      vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue({
        id: "sub-1",
        schoolId: "other-school",
        provider: ComplianceProvider.ADEK_ESIS,
        submissionDate: new Date(),
        attemptNumber: 1,
      } as any)

      const result = await retryComplianceSubmission({ submissionId: "sub-1" })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("CONFIG_NOT_FOUND")
    })

    it("creates new attempt row with incremented attemptNumber", async () => {
      vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue({
        id: "sub-1",
        schoolId: SCHOOL,
        provider: ComplianceProvider.ADEK_ESIS,
        submissionDate: new Date("2026-05-28"),
        attemptNumber: 1,
      } as any)
      vi.mocked(db.schoolComplianceConfig.findUnique).mockResolvedValue({
        enabled: true,
        mode: ConnectorMode.DRY_RUN,
      } as any)
      vi.mocked(db.complianceSubmission.findFirst).mockResolvedValue({
        attemptNumber: 2,
      } as any)
      vi.mocked(db.complianceSubmission.create).mockResolvedValue({
        id: "sub-2",
        attemptNumber: 3,
      } as any)

      const result = await retryComplianceSubmission({ submissionId: "sub-1" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.attemptNumber).toBe(3)
      }
    })
  })

  describe("createSharedCredentialGroup", () => {
    it("denies non-DEVELOPER (ADMIN can't create cross-tenant groups)", async () => {
      mockAuth("ADMIN")

      const result = await createSharedCredentialGroup({
        name: "Aldar Group",
        provider: ComplianceProvider.ADEK_ESIS,
        secretJson: '{"apiKey":"x"}',
      })

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorCode).toBe("FORBIDDEN")
    })

    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await createSharedCredentialGroup({
        name: "x",
        provider: ComplianceProvider.ADEK_ESIS,
        secretJson: "x",
      })

      expect(result.success).toBe(false)
    })

    it("DEVELOPER can create the group", async () => {
      mockAuth("DEVELOPER", null)
      vi.mocked(db.sharedComplianceCredentialGroup.create).mockResolvedValue({
        id: "grp-1",
      } as any)

      const result = await createSharedCredentialGroup({
        name: "Aldar Group",
        provider: ComplianceProvider.ADEK_ESIS,
        secretJson: '{"apiKey":"x"}',
      })

      expect(result.success).toBe(true)
      expect(db.sharedComplianceCredentialGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Aldar Group",
            encryptedSecret: "enc",
            keyVersion: 1,
          }),
        })
      )
    })
  })
})
