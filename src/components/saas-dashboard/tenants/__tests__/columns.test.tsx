import { describe, expect, it } from "vitest"

import { tenantColumns } from "../columns"

describe("tenantColumns", () => {
  it("defines expected filter meta for planType and isActive", () => {
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
