// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getSettings, updateSettings } from "../actions/settings"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    transportationSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_A = "school-A"

// Exact defaults declared in actions/settings.ts (DEFAULTS const).
const DEFAULTS = {
  defaultPickupBufferMinutes: 10,
  defaultMonthlyFee: null,
  notifyGuardiansOnTripStart: true,
  notifyGuardiansOnTripFinish: true,
  notifyGuardiansOnTripCancel: true,
  lateThresholdMinutes: 15,
}

// A complete, schema-valid input for updateSettings.
const VALID_INPUT = {
  defaultPickupBufferMinutes: 20,
  defaultMonthlyFee: 150,
  notifyGuardiansOnTripStart: false,
  notifyGuardiansOnTripFinish: true,
  notifyGuardiansOnTripCancel: false,
  lateThresholdMinutes: 30,
}

function mockUser(
  role: string,
  schoolId: string | null = SCHOOL_A,
  userId = "user-1"
) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("transportation getSettings", () => {
  it("returns DEFAULT settings when no row exists (findUnique → null)", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.findUnique).mockResolvedValue(
      null as never
    )

    const result = await getSettings()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(DEFAULTS)
    }
    // Read is scoped by schoolId from tenant context.
    expect(db.transportationSettings.findUnique).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A },
    })
  })

  it("returns the persisted row values and maps Decimal fee to Number", async () => {
    mockUser("ADMIN")
    // Simulate a Prisma Decimal-like object for defaultMonthlyFee.
    const decimalFee = {
      toString: () => "275.5",
      valueOf: () => 275.5,
    }
    vi.mocked(db.transportationSettings.findUnique).mockResolvedValue({
      id: "settings-1",
      schoolId: SCHOOL_A,
      defaultPickupBufferMinutes: 5,
      defaultMonthlyFee: decimalFee,
      notifyGuardiansOnTripStart: false,
      notifyGuardiansOnTripFinish: false,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 25,
    } as never)

    const result = await getSettings()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        defaultPickupBufferMinutes: 5,
        defaultMonthlyFee: 275.5,
        notifyGuardiansOnTripStart: false,
        notifyGuardiansOnTripFinish: false,
        notifyGuardiansOnTripCancel: true,
        lateThresholdMinutes: 25,
      })
      // Decimal was coerced to a JS number, not the raw Decimal object.
      expect(typeof result.data.defaultMonthlyFee).toBe("number")
    }
  })

  it("returns null fee unchanged when stored fee is null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.findUnique).mockResolvedValue({
      id: "settings-1",
      schoolId: SCHOOL_A,
      defaultPickupBufferMinutes: 12,
      defaultMonthlyFee: null,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 15,
    } as never)

    const result = await getSettings()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.defaultMonthlyFee).toBeNull()
      expect(result.data.defaultPickupBufferMinutes).toBe(12)
    }
  })

  it("returns UNAUTHORIZED for a non-admin role (manage_settings gate)", async () => {
    mockUser("STAFF")

    const result = await getSettings()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.transportationSettings.findUnique).not.toHaveBeenCalled()
  })

  it("returns LOAD_FAILED when the read throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.findUnique).mockRejectedValue(
      new Error("db down") as never
    )

    const result = await getSettings()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("LOAD_FAILED")
  })
})

describe("transportation updateSettings", () => {
  it("upserts scoped by schoolId and returns mapped data", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.upsert).mockResolvedValue({
      id: "settings-1",
      schoolId: SCHOOL_A,
      defaultPickupBufferMinutes: 20,
      defaultMonthlyFee: { valueOf: () => 150, toString: () => "150" },
      notifyGuardiansOnTripStart: false,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: false,
      lateThresholdMinutes: 30,
    } as never)

    const result = await updateSettings(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        defaultPickupBufferMinutes: 20,
        defaultMonthlyFee: 150,
        notifyGuardiansOnTripStart: false,
        notifyGuardiansOnTripFinish: true,
        notifyGuardiansOnTripCancel: false,
        lateThresholdMinutes: 30,
      })
    }

    // upsert is keyed by schoolId and writes the parsed data on both branches.
    expect(db.transportationSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: SCHOOL_A },
        create: expect.objectContaining({
          schoolId: SCHOOL_A,
          defaultPickupBufferMinutes: 20,
          defaultMonthlyFee: 150,
          notifyGuardiansOnTripStart: false,
          notifyGuardiansOnTripFinish: true,
          notifyGuardiansOnTripCancel: false,
          lateThresholdMinutes: 30,
        }),
        update: expect.objectContaining({
          defaultPickupBufferMinutes: 20,
          defaultMonthlyFee: 150,
          notifyGuardiansOnTripStart: false,
          notifyGuardiansOnTripFinish: true,
          notifyGuardiansOnTripCancel: false,
          lateThresholdMinutes: 30,
        }),
      })
    )
  })

  it("coerces an undefined defaultMonthlyFee to null on write", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.upsert).mockResolvedValue({
      id: "settings-1",
      schoolId: SCHOOL_A,
      defaultPickupBufferMinutes: 10,
      defaultMonthlyFee: null,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 15,
    } as never)

    // defaultMonthlyFee omitted (schema marks it optional + nullable).
    const { defaultMonthlyFee: _omit, ...inputWithoutFee } = VALID_INPUT
    void _omit
    const result = await updateSettings({
      ...inputWithoutFee,
      defaultPickupBufferMinutes: 10,
      lateThresholdMinutes: 15,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: true,
    })

    expect(result.success).toBe(true)
    expect(db.transportationSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ defaultMonthlyFee: null }),
        update: expect.objectContaining({ defaultMonthlyFee: null }),
      })
    )
  })

  it("returns UNAUTHORIZED for a non-admin role (manage_settings gate)", async () => {
    mockUser("STAFF")

    const result = await updateSettings(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.transportationSettings.upsert).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR for input that fails the schema", async () => {
    mockUser("ADMIN")

    // defaultPickupBufferMinutes max is 240 — 999 is out of range.
    const result = await updateSettings({
      ...VALID_INPUT,
      defaultPickupBufferMinutes: 999,
    } as never)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.transportationSettings.upsert).not.toHaveBeenCalled()
  })

  it("returns TRANSPORTATION_SETTINGS_UPDATE_FAILED when the upsert throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.transportationSettings.upsert).mockRejectedValue(
      new Error("write conflict") as never
    )

    const result = await updateSettings(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("TRANSPORTATION_SETTINGS_UPDATE_FAILED")
    }
  })

  it("returns NOT_AUTHENTICATED when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    } as never)

    const result = await updateSettings(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
    expect(db.transportationSettings.upsert).not.toHaveBeenCalled()
  })

  it("returns MISSING_SCHOOL when tenant context has no schoolId", async () => {
    mockUser("ADMIN", null)

    const result = await updateSettings(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.transportationSettings.upsert).not.toHaveBeenCalled()
  })
})
