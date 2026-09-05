// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `createOrLinkGuardian` is the ONE guardian writer for every intake channel:
 * the admission dashboard at enrollment, the /students wizard's personal step
 * and the CSV imports. These tests pin the WhatsApp handling both one-by-one
 * paths now share — a second phone row typed "whatsapp", skipped when it is
 * the same number as the phone (both wizards auto-fill it that way), so the
 * primary row is never retyped and the phone field never reads back empty.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createOrLinkGuardian } from "@/lib/guardian-utils"

vi.mock("@/lib/credentials", () => ({
  mintTempPassword: vi.fn(),
  sanitizeUsername: vi.fn((v: string) => v),
}))

function makeTx() {
  return {
    guardianType: {
      upsert: vi.fn().mockResolvedValue({ id: "gt-father", name: "father" }),
    },
    guardian: {
      upsert: vi.fn().mockResolvedValue({ id: "g-1", userId: null }),
      create: vi.fn().mockResolvedValue({ id: "g-1", userId: null }),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    guardianPhoneNumber: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({}),
    },
    studentGuardian: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue({ id: "sg-1" }),
    },
    user: { findFirst: vi.fn(), create: vi.fn() },
  }
}

const base = {
  schoolId: "school-1",
  studentId: "stu-1",
  typeName: "father",
  firstName: "Omar",
  lastName: "Ali",
  email: null,
  occupation: null,
  isPrimary: true,
}

describe("createOrLinkGuardian — WhatsApp", () => {
  beforeEach(() => vi.clearAllMocks())

  it("writes a second phone row typed whatsapp when the number differs", async () => {
    const tx = makeTx()
    await createOrLinkGuardian(tx as never, {
      ...base,
      phone: "+249911111111",
      whatsapp: "+249922222222",
    })
    const upserts = tx.guardianPhoneNumber.upsert.mock.calls.map(
      (c) => (c[0] as { create: Record<string, unknown> }).create
    )
    expect(upserts).toHaveLength(2)
    expect(upserts[0]).toMatchObject({
      phoneNumber: "+249911111111",
      isPrimary: true,
    })
    expect(upserts[1]).toMatchObject({
      phoneNumber: "+249922222222",
      phoneType: "whatsapp",
      isPrimary: false,
    })
  })

  it("skips the whatsapp row when it is the same number as the phone", async () => {
    const tx = makeTx()
    await createOrLinkGuardian(tx as never, {
      ...base,
      phone: "+249911111111",
      whatsapp: "+249911111111",
    })
    expect(tx.guardianPhoneNumber.upsert).toHaveBeenCalledTimes(1)
    const only = tx.guardianPhoneNumber.upsert.mock.calls[0][0] as {
      create: { phoneType?: string }
    }
    expect(only.create.phoneType).toBeUndefined()
  })

  it("never puts a phone number into Guardian.emailAddress", async () => {
    const tx = makeTx()
    await createOrLinkGuardian(tx as never, {
      ...base,
      phone: null,
      whatsapp: "+249911111111",
    })
    expect(tx.guardian.upsert).not.toHaveBeenCalled()
    expect(tx.guardian.create).toHaveBeenCalledTimes(1)
    const created = tx.guardian.create.mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    expect(created.data.emailAddress).toBeUndefined()
  })
})
