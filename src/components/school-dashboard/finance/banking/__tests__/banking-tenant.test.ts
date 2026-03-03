// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId: "school-123" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    bankAccount: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
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

// Import after mocks are set up
const { getAccounts: getMyBankAccounts, removeBank } =
  await import("../my-banks/actions")
const { getAccounts: getTransferAccounts, getRecentTransfers } =
  await import("../payment-transfer/actions")

describe("banking tenant isolation", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("my-banks", () => {
    it("getAccounts includes schoolId in query", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      vi.mocked(db.bankAccount.findMany).mockResolvedValue([])

      await getMyBankAccounts({ userId: "user-1" })

      expect(db.bankAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("getAccounts returns empty when no schoolId", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getMyBankAccounts({ userId: "user-1" })
      expect(result).toEqual([])
      expect(db.bankAccount.findMany).not.toHaveBeenCalled()
    })

    it("removeBank includes schoolId in ownership check", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      vi.mocked(db.bankAccount.findFirst).mockResolvedValue({
        id: "acct-1",
        userId: "user-1",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.bankAccount.delete).mockResolvedValue({} as any)

      await removeBank({ accountId: "acct-1" })

      expect(db.bankAccount.findFirst).toHaveBeenCalledWith({
        where: {
          id: "acct-1",
          userId: "user-1",
          schoolId: mockSchoolId,
        },
      })
    })
  })

  describe("payment-transfer", () => {
    it("getAccounts includes schoolId in query", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      vi.mocked(db.bankAccount.findMany).mockResolvedValue([])

      await getTransferAccounts({ userId: "user-1" })

      expect(db.bankAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user-1",
            schoolId: mockSchoolId,
          }),
        })
      )
    })

    it("getRecentTransfers includes schoolId in query", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      vi.mocked(db.transaction.findMany).mockResolvedValue([])

      await getRecentTransfers({ userId: "user-1" })

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })
})
