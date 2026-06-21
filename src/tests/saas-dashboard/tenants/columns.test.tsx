// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { getTenantColumns } from "@/components/saas-dashboard/tenants/columns"

describe("tenantColumns", () => {
  it("defines expected filter meta for planType and isActive", () => {
    const tenantColumns = getTenantColumns()
    const plan = tenantColumns.find(
      (c) => "accessorKey" in c && c.accessorKey === "planType"
    )
    const status = tenantColumns.find(
      (c) => "accessorKey" in c && c.accessorKey === "isActive"
    )
    expect(plan?.meta).toBeDefined()
    expect(status?.meta).toBeDefined()
  })
})
