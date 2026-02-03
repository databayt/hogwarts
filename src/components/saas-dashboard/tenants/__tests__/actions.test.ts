import { describe, expect, it, vi } from "vitest"

import * as tenants from "../actions"

vi.mock("@/lib/db", () => {
  return {
    db: {
      school: {
        findUnique: vi.fn().mockResolvedValue({
          id: "s1",
          name: "Test School",
          subdomain: "test",
          isActive: true,
          planType: "TRIAL",
        }),
        update: vi.fn().mockResolvedValue({
          id: "s1",
          name: "Test School",
          subdomain: "test",
          isActive: false,
          planType: "BASIC",
        }),
      },
      subscriptionHistory: {
        create: vi.fn().mockResolvedValue({ id: "sh1" }),
      },
      $transaction: vi.fn().mockImplementation((fn) =>
        fn({
          school: {
            update: vi.fn().mockResolvedValue({
              id: "s1",
              planType: "PREMIUM",
            }),
          },
          subscriptionHistory: {
            create: vi.fn().mockResolvedValue({ id: "sh1" }),
          },
        })
      ),
    },
  }
})

vi.mock("@/components/saas-dashboard/lib/saas-dashboard-auth", () => ({
  requireOperator: vi.fn().mockResolvedValue({ userId: "u1" }),
  requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}))

describe("tenants/actions.ts", () => {
  it("tenantToggleActive toggles tenant active status", async () => {
    const result = await tenants.tenantToggleActive({
      tenantId: "s1",
      reason: "Test toggle",
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "s1",
        isActive: false,
      }),
    })
  })

  it("tenantChangePlan changes tenant plan", async () => {
    const result = await tenants.tenantChangePlan({
      tenantId: "s1",
      planType: "PREMIUM",
      reason: "Upgrade",
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "s1",
        planType: "PREMIUM",
      }),
    })
  })

  it("tenantEndTrial ends tenant trial", async () => {
    const result = await tenants.tenantEndTrial({
      tenantId: "s1",
      reason: "Trial expired",
    })
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: "s1",
        planType: "BASIC",
      }),
    })
  })

  it("tenantStartImpersonation starts impersonation", async () => {
    const result = await tenants.tenantStartImpersonation({
      tenantId: "s1",
      reason: "Support request",
    })
    expect(result).toEqual({
      success: true,
      data: { success: true },
    })
  })

  it("tenantStopImpersonation stops impersonation", async () => {
    const result = await tenants.tenantStopImpersonation({
      reason: "Support complete",
    })
    expect(result).toEqual({
      success: true,
      data: { success: true },
    })
  })
})
