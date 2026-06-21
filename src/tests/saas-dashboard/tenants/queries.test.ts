// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import * as dbMod from "@/lib/db"
import { getTenants } from "@/components/saas-dashboard/tenants/queries"

// Bypass Next.js unstable_cache which requires the Next.js runtime
vi.mock("@/components/table/lib/unstable-cache", () => ({
  unstable_cache:
    <T extends unknown[]>(cb: (...args: T) => Promise<unknown>) =>
    () =>
      cb(),
}))

vi.mock("nuqs/server", () => ({
  createSearchParamsCache: vi.fn(() => ({})),
  parseAsInteger: { withDefault: vi.fn(() => ({})) },
  parseAsString: { withDefault: vi.fn(() => ({})) },
}))

vi.mock("@/lib/db", () => {
  return {
    db: {
      school: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: vi.fn((arr: Promise<unknown>[]) => Promise.all(arr)),
    },
  }
})

describe("tenants queries", () => {
  it("returns empty data and zero pageCount when no rows", async () => {
    const res = await getTenants({ page: 1, perPage: 10, sort: [], search: "" })
    expect(res.data).toEqual([])
    expect(res.pageCount).toBe(0)
  })

  it("applies search, plan and status filters and returns pageCount", async () => {
    const mockFindMany = vi.fn().mockResolvedValue([
      {
        id: "1",
        name: "Alpha",
        domain: "alpha",
        isActive: true,
        planType: "basic",
        createdAt: new Date(),
      },
    ])
    const mockCount = vi.fn().mockResolvedValue(1)
    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (arr: Promise<unknown>[]) => Promise.all(arr),
      school: { findMany: mockFindMany, count: mockCount },
    } as any)

    const res = await getTenants({
      page: 1,
      perPage: 10,
      search: "alp",
      plan: "basic",
      status: "true",
      sort: [{ id: "createdAt", desc: true }],
    })
    expect(mockFindMany).toHaveBeenCalled()
    expect(res.pageCount).toBe(1)
    expect(res.data[0].name).toBe("Alpha")
  })
})
