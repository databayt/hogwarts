// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for Prospect → Lead promotion.
 *
 * The function this covers was referenced in the Prisma schema's own comments
 * long before it existed, so the first thing worth asserting is simply that the
 * two required foreign keys — Lead.schoolId and LeadActivity.createdById — are
 * satisfied for a lead that belongs to no tenant and was created by no person.
 * That is the whole reason it could not be written casually.
 *
 * Idempotence is the second: the webhook and the chat capture will both call
 * this on the same prospect, and a duplicated lead is a duplicated outreach to
 * a real principal.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  PLATFORM_SCHOOL_ID,
  promoteToLead,
  SYSTEM_USER_ID,
} from "@/lib/sales/promote"

vi.mock("@/lib/db", () => {
  const tx = {
    lead: { create: vi.fn() },
    prospect: { update: vi.fn() },
    leadActivity: { create: vi.fn() },
  }
  return {
    db: {
      prospect: { findUnique: vi.fn(), update: tx.prospect.update },
      school: { upsert: vi.fn() },
      user: { upsert: vi.fn() },
      lead: { create: tx.lead.create },
      leadActivity: { create: tx.leadActivity.create },
      $transaction: vi.fn(async (fn: any) => fn(tx)),
      __tx: tx,
    },
  }
})

const anyDb = db as any
const tx = () => anyDb.__tx

const prospect = {
  id: "p1",
  name: "مدرسة القبس",
  principalName: "أ. محمد",
  email: "info@alqabs.example",
  phone: "+249912345678",
  website: "https://alqabs.example",
  country: "SD",
  city: "Port Sudan",
  decisionMakerRole: "principal",
  enrichmentScore: 72,
  pitchHook: "Paper admission, 400 students",
  source: "gmaps",
  promotedLeadId: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  tx().lead.create.mockResolvedValue({ id: "lead-1" })
  tx().prospect.update.mockResolvedValue({})
  tx().leadActivity.create.mockResolvedValue({})
})

describe("promoteToLead", () => {
  it("creates a lead scoped to the sentinel tenant", async () => {
    anyDb.prospect.findUnique.mockResolvedValue(prospect)

    const res = await promoteToLead("p1")

    expect(res).toEqual({ ok: true, leadId: "lead-1", created: true })
    const arg = tx().lead.create.mock.calls[0][0].data
    // The FK that made this function un-writable until now.
    expect(arg.schoolId).toBe(PLATFORM_SCHOOL_ID)
    expect(arg.source).toBe("WEBSITE")
    expect(arg.leadType).toBe("SCHOOL")
    expect(arg.email).toBe(prospect.email)
    expect(arg.company).toBe(prospect.name)
    // A principal can sign, so the lead is worth a person's time sooner.
    expect(arg.priority).toBe("HIGH")
    expect(arg.nextFollowUpAt).toBeInstanceOf(Date)
  })

  it("satisfies LeadActivity.createdById with the system actor", async () => {
    anyDb.prospect.findUnique.mockResolvedValue(prospect)
    await promoteToLead("p1")
    const act = tx().leadActivity.create.mock.calls[0][0].data
    expect(act.createdById).toBe(SYSTEM_USER_ID)
    expect(act.schoolId).toBe(PLATFORM_SCHOOL_ID)
    expect(act.type).toBe("status_change")
  })

  it("creates the sentinels on demand, so no environment needs seeding first", async () => {
    anyDb.prospect.findUnique.mockResolvedValue(prospect)
    await promoteToLead("p1")
    expect(anyDb.school.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PLATFORM_SCHOOL_ID },
        // isActive:false keeps the sentinel out of the north-star tenant count.
        create: expect.objectContaining({
          isActive: false,
          domain: PLATFORM_SCHOOL_ID,
        }),
      })
    )
    expect(anyDb.user.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: SYSTEM_USER_ID } })
    )
  })

  it("is idempotent — a second call returns the same lead, creating nothing", async () => {
    anyDb.prospect.findUnique.mockResolvedValue({
      ...prospect,
      promotedLeadId: "lead-1",
    })

    const res = await promoteToLead("p1")

    expect(res).toEqual({ ok: true, leadId: "lead-1", created: false })
    expect(tx().lead.create).not.toHaveBeenCalled()
    expect(anyDb.school.upsert).not.toHaveBeenCalled()
  })

  it("refuses a prospect nobody can reach", async () => {
    anyDb.prospect.findUnique.mockResolvedValue({
      ...prospect,
      email: null,
      phone: null,
    })
    const res = await promoteToLead("p1")
    expect(res).toEqual({ ok: false, reason: "no_contact_channel" })
    expect(tx().lead.create).not.toHaveBeenCalled()
  })

  it("reports a missing prospect rather than throwing", async () => {
    anyDb.prospect.findUnique.mockResolvedValue(null)
    expect(await promoteToLead("nope")).toEqual({
      ok: false,
      reason: "prospect_not_found",
    })
  })

  it("marks the prospect promoted and back-links the lead in the same transaction", async () => {
    anyDb.prospect.findUnique.mockResolvedValue(prospect)
    await promoteToLead("p1")
    expect(tx().prospect.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "promoted", promotedLeadId: "lead-1" },
    })
    expect(anyDb.$transaction).toHaveBeenCalledTimes(1)
  })
})
