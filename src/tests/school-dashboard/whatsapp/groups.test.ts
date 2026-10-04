// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import * as evolution from "@/lib/whatsapp/evolution-client"
import {
  createAutoGroup,
  createWhatsAppGroup,
} from "@/components/school-dashboard/whatsapp/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    whatsAppSession: { findUnique: vi.fn() },
    whatsAppGroup: { findFirst: vi.fn(), create: vi.fn() },
    whatsAppGroupMember: { createMany: vi.fn() },
    section: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/whatsapp/evolution-client", () => ({
  createGroup: vi.fn(),
  updateGroupDescription: vi.fn(),
  formatPhoneForWhatsApp: (p: string) => p,
}))
vi.mock("@/components/school-dashboard/whatsapp/queries", () => ({
  getGuardianPhonesForSection: vi.fn(async () => [
    { phone: "+249900000001", guardianId: "g1", userId: "u1" },
  ]),
}))

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", schoolId: SCHOOL },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "ar",
  } as never)
  vi.mocked(db.whatsAppSession.findUnique).mockResolvedValue({
    id: "session-1",
    status: "connected",
    instanceName: "demo",
  } as never)
  vi.mocked(evolution.createGroup).mockResolvedValue({ id: "jid-1" } as never)
  vi.mocked(db.whatsAppGroup.create).mockResolvedValue({ id: "grp-1" } as never)
  vi.mocked(db.whatsAppGroup.findFirst).mockResolvedValue(null)
})

describe("WhatsApp groups without classes", () => {
  it("makes a section's parents group", async () => {
    vi.mocked(db.section.findFirst).mockResolvedValue({ name: "7-A" } as never)

    const result = await createAutoGroup({
      type: "section_parents",
      sectionId: "7a",
    })

    expect(result.success).toBe(true)
    expect(
      vi.mocked(db.whatsAppGroup.create).mock.calls[0][0].data
    ).toMatchObject({
      schoolId: SCHOOL,
      sectionId: "7a",
      type: "section_parents",
    })
  })

  it("no longer makes a class's parents group", async () => {
    const result = await createAutoGroup({
      type: "class_parents",
      classId: "class-1",
    })

    expect(result.success).toBe(false)
    expect(evolution.createGroup).not.toHaveBeenCalled()
  })

  it("refuses a group tied to another school's section", async () => {
    vi.mocked(db.section.findFirst).mockResolvedValue(null)

    const result = await createWhatsAppGroup({
      name: "Trip",
      type: "custom",
      sectionId: "other-school-section",
      participants: ["+249900000001"],
    })

    expect(result).toMatchObject({ success: false, code: "SECTION_NOT_FOUND" })
    expect(db.section.findFirst).toHaveBeenCalledWith({
      where: { id: "other-school-section", schoolId: SCHOOL },
      select: { id: true },
    })
    expect(evolution.createGroup).not.toHaveBeenCalled()
  })
})
