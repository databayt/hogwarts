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

import {
  canonicalGuardianRole,
  createOrLinkGuardian,
  guardianTypeNamesForRole,
  PARENT_GUARDIAN_TYPE_NAMES,
} from "@/lib/guardian-utils"

vi.mock("@/lib/credentials", () => ({
  mintTempPassword: vi.fn(),
  sanitizeUsername: vi.fn((v: string) => v),
}))

function makeTx() {
  return {
    guardianType: {
      findFirst: vi.fn().mockResolvedValue(null),
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

describe("guardian roles — every stored spelling of father/mother", () => {
  it("maps the seeded Arabic and capitalised names onto the two roles", () => {
    expect(canonicalGuardianRole("الأب")).toBe("father")
    expect(canonicalGuardianRole("الأم")).toBe("mother")
    expect(canonicalGuardianRole("Father")).toBe("father")
    expect(canonicalGuardianRole(" MOTHER ")).toBe("mother")
    expect(canonicalGuardianRole("father")).toBe("father")
  })

  it("leaves non-parent types alone", () => {
    expect(canonicalGuardianRole("guardian")).toBeNull()
    expect(canonicalGuardianRole("الجد/الجدة")).toBeNull()
    expect(canonicalGuardianRole("")).toBeNull()
    expect(canonicalGuardianRole(null)).toBeNull()
  })

  it("exposes the spellings for case-sensitive `in` filters", () => {
    expect(PARENT_GUARDIAN_TYPE_NAMES).toEqual(
      expect.arrayContaining(["father", "mother", "الأب", "الأم", "Father"])
    )
    expect(guardianTypeNamesForRole("mother")).toContain("الأم")
    expect(guardianTypeNamesForRole("mother")).not.toContain("الأب")
  })
})

describe("createOrLinkGuardian — guardian type reuse", () => {
  beforeEach(() => vi.clearAllMocks())

  it("links under the school's existing Arabic-named type instead of minting an English twin", async () => {
    const tx = makeTx()
    tx.guardianType.findFirst.mockResolvedValue({ id: "gt-ab", name: "الأب" })

    await createOrLinkGuardian(tx as never, { ...base, phone: "0912000000" })

    expect(tx.guardianType.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: "school-1",
          name: { in: expect.arrayContaining(["father", "الأب"]) },
        }),
      })
    )
    expect(tx.guardianType.upsert).not.toHaveBeenCalled()
    expect(tx.studentGuardian.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ guardianTypeId: "gt-ab" }),
      })
    )
  })

  it("creates the requested type when the school has no spelling of the role", async () => {
    const tx = makeTx()

    await createOrLinkGuardian(tx as never, { ...base, phone: "0912000000" })

    expect(tx.guardianType.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { schoolId: "school-1", name: "father" },
      })
    )
  })

  it("reuses a father already linked under the English twin type when the save resolves to the Arabic row", async () => {
    // Student created by the wizard before the fix: father linked under
    // "father". The school's older type row is "الأب", so the re-save
    // resolves to it. Same role → same father, not a duplicate.
    const tx = makeTx()
    tx.guardianType.findFirst.mockResolvedValue({ id: "gt-ab", name: "الأب" })
    tx.guardianPhoneNumber.findMany.mockResolvedValue([{ guardianId: "g-1" }])
    tx.studentGuardian.findMany.mockResolvedValue([]) // no OTHER-role link
    tx.guardian.findFirst.mockResolvedValue({ id: "g-1", userId: null })

    await createOrLinkGuardian(tx as never, { ...base, phone: "0912000222" })

    expect(tx.studentGuardian.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guardianId: { in: ["g-1"] },
          guardianType: {
            name: { notIn: expect.arrayContaining(["father", "الأب"]) },
          },
        }),
      })
    )
    expect(tx.guardian.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "g-1", schoolId: "school-1" } })
    )
    expect(tx.guardian.create).not.toHaveBeenCalled()
    expect(tx.studentGuardian.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_studentId_guardianId: {
            schoolId: "school-1",
            studentId: "stu-1",
            guardianId: "g-1",
          },
        },
      })
    )
  })

  it("still refuses to turn the father into the mother when both share a phone", async () => {
    const tx = makeTx()
    tx.guardianType.findFirst.mockResolvedValue({ id: "gt-am", name: "الأم" })
    tx.guardianPhoneNumber.findMany.mockResolvedValue([{ guardianId: "g-1" }])
    // g-1 is linked to this student under a father-role type → conflicting
    tx.studentGuardian.findMany.mockResolvedValue([{ guardianId: "g-1" }])
    tx.guardian.create.mockResolvedValue({ id: "g-2", userId: null })

    await createOrLinkGuardian(tx as never, {
      ...base,
      typeName: "mother",
      firstName: "Hiba",
      phone: "0912000222",
    })

    expect(tx.studentGuardian.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guardianType: {
            name: { notIn: expect.arrayContaining(["mother", "الأم"]) },
          },
        }),
      })
    )
    expect(tx.guardian.findFirst).not.toHaveBeenCalled()
    expect(tx.guardian.create).toHaveBeenCalledTimes(1)
  })

  it("does not search for aliases of a non-parent type", async () => {
    const tx = makeTx()
    tx.guardianType.upsert.mockResolvedValue({ id: "gt-g", name: "guardian" })

    await createOrLinkGuardian(tx as never, {
      ...base,
      typeName: "guardian",
      phone: "0912000000",
    })

    expect(tx.guardianType.findFirst).not.toHaveBeenCalled()
    expect(tx.guardianType.upsert).toHaveBeenCalled()
  })
})
