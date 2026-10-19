// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * settleRegistrationFee — the one settler behind the Stripe / Tap webhooks and
 * the dashboard's cash / bank / wallet confirmation. Pins the 2026-10-19
 * guards: a withdrawn / rejected application is never marked paid, and a
 * gateway capture that cannot be absorbed (second capture, dead application)
 * alerts ADMIN + ACCOUNTANT to refund instead of being logged and forgotten.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { settleRegistrationFee } from "@/components/school-marketing/application/offer/settle"

vi.mock("server-only", () => ({}))

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    notification: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue({ created: 1 }),
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ created: 1 }),
  resolveSchoolLang: vi.fn().mockResolvedValue("ar"),
}))

const BASE = {
  applicationId: "app-1",
  schoolId: "school-1",
  amount: 500,
}

const APP = {
  firstName: "Sara",
  middleName: null,
  lastName: "Ali",
  applicationNumber: "APP-2026-0001",
  userId: "u1",
  email: "family@test.com",
  lang: "ar",
}

describe("settleRegistrationFee", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.notification.findFirst).mockResolvedValue(null)
  })

  it("flips only an unpaid, live application", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.application.findFirst).mockResolvedValue(APP as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "stripe",
      reference: "cs_1",
    })

    expect(result).toBe("settled")
    expect(db.application.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "app-1",
          schoolId: "school-1",
          registrationFeePaid: false,
          status: { notIn: ["WITHDRAWN", "REJECTED"] },
        },
      })
    )
  })

  it("treats a replay of the settling capture as already_paid, silently", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue({
      ...APP,
      registrationFeePaid: true,
      registrationFeeReference: "cs_1",
      status: "SELECTED",
    } as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "stripe",
      reference: "cs_1",
    })

    expect(result).toBe("already_paid")
    expect(dispatchNotificationsToAudience).not.toHaveBeenCalled()
  })

  it("flags a second, different capture for refund", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue({
      ...APP,
      registrationFeePaid: true,
      registrationFeeReference: "cs_1",
      status: "SELECTED",
    } as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "stripe",
      reference: "cs_2",
    })

    expect(result).toBe("needs_refund")
    expect(dispatchNotificationsToAudience).toHaveBeenCalledWith(
      expect.objectContaining({
        targetRoles: ["ADMIN", "ACCOUNTANT"],
        metadata: expect.objectContaining({
          refundNeeded: true,
          reason: "duplicate",
          reference: "cs_2",
        }),
      })
    )
  })

  it("alerts once per capture — a reloaded return page does not re-send", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue({
      ...APP,
      registrationFeePaid: false,
      registrationFeeReference: null,
      status: "WITHDRAWN",
    } as never)
    vi.mocked(db.notification.findFirst).mockResolvedValue({
      id: "n1",
    } as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "tap",
      reference: "chg_1",
    })

    expect(result).toBe("needs_refund")
    expect(db.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: "school-1" }),
      })
    )
    expect(dispatchNotificationsToAudience).not.toHaveBeenCalled()
  })

  it("flags a capture on a withdrawn application for refund", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue({
      ...APP,
      registrationFeePaid: false,
      registrationFeeReference: null,
      status: "WITHDRAWN",
    } as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "tap",
      reference: "chg_1",
    })

    expect(result).toBe("needs_refund")
    expect(dispatchNotificationsToAudience).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ reason: "not_live" }),
      })
    )
  })

  it("refuses a manual confirmation on a withdrawn application without alerting", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue({
      ...APP,
      registrationFeePaid: false,
      registrationFeeReference: "REG-1",
      status: "WITHDRAWN",
    } as never)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "cash",
      reference: "REG-1",
      actorId: "acct-1",
    })

    expect(result).toBe("not_live")
    expect(dispatchNotificationsToAudience).not.toHaveBeenCalled()
  })

  it("returns not_found for another school's application", async () => {
    vi.mocked(db.application.updateMany).mockResolvedValue({ count: 0 })
    vi.mocked(db.application.findFirst).mockResolvedValue(null)

    const result = await settleRegistrationFee({
      ...BASE,
      method: "stripe",
      reference: "cs_1",
    })

    expect(result).toBe("not_found")
  })
})
