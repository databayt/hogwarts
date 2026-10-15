// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import * as dbMod from "@/lib/db"
import { getTenants } from "@/components/saas-dashboard/tenants/queries"

describe("getTenants integration (where/orderBy mapping)", () => {
  it("maps filters and sorting to Prisma args", async () => {
    const mockFindMany = vi.fn().mockResolvedValue([])
    const mockCount = vi.fn().mockResolvedValue(0)
    vi.spyOn(dbMod, "db", "get").mockReturnValue({
      $transaction: (fns: any[]) => Promise.all(fns.map((fn) => fn)),
      school: { findMany: mockFindMany, count: mockCount },
    } as any)

    await getTenants({
      page: 2,
      perPage: 20,
      search: "alpha",
      name: "alp",
      domain: "school",
      planType: "basic",
      isActive: "true",
      sort: [{ id: "createdAt", desc: true }],
    })

    const arg = mockFindMany.mock.calls[0]?.[0]
    expect(arg).toBeTruthy()
    expect(arg.where.name.contains).toBe("alp")
    expect(arg.where.domain.contains).toBe("school")
    // Legacy "basic" reads as free and matches every stored spelling of it.
    expect(arg.where.planType.in).toEqual(
      expect.arrayContaining(["free", "basic", "BASIC"])
    )
    expect(arg.where.isActive).toBe(true)
    expect(arg.orderBy[0].createdAt).toBe("desc")
  })
})
