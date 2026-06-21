// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import * as dbMod from "@/lib/db"
import { fetchLogs } from "@/components/saas-dashboard/observability/provider"

describe("observability/provider tenant scoping", () => {
  it("passes tenantId as schoolId in where clause", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOG_PROVIDER", "db")
    const mockFindMany = vi.fn().mockResolvedValue([])
    const mockCount = vi.fn().mockResolvedValue(0)
    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (arr: any[]) => Promise.all(arr),
      auditLog: {
        findMany: (...args: any[]) => mockFindMany(...args),
        count: mockCount,
      },
      user: { findMany: vi.fn().mockResolvedValue([]) },
      school: { findMany: vi.fn().mockResolvedValue([]) },
    } as any)

    await fetchLogs({ page: 1, perPage: 10, tenantId: "tenant-123" })
    const arg = mockFindMany.mock.calls[0][0]
    expect(arg.where.schoolId).toBe("tenant-123")
  })
})
