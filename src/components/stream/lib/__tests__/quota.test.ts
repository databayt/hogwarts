// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  checkSchoolVideoQuota,
  decrementSchoolVideoUsage,
  getSchoolVideoUsage,
  incrementSchoolVideoUsage,
} from "../quota"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const SCHOOL_ID = "school-1"
const GB = BigInt(1024) * BigInt(1024) * BigInt(1024)

function stubSchool(opts: {
  used?: bigint | null
  quota?: bigint | null
}) {
  vi.mocked(db.school.findUnique).mockResolvedValue({
    videoStorageUsedBytes: opts.used ?? null,
    videoStorageQuotaBytes: opts.quota ?? null,
  } as never)
}

// ---------------------------------------------------------------------------
// getSchoolVideoUsage
// ---------------------------------------------------------------------------

describe("getSchoolVideoUsage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns unlimited when quota is null (schema default for new schools)", async () => {
    stubSchool({ used: BigInt(500), quota: null })
    const usage = await getSchoolVideoUsage(SCHOOL_ID)
    expect(usage.isUnlimited).toBe(true)
    expect(usage.quota).toBe(null)
    expect(usage.available).toBe(null)
    expect(usage.percentUsed).toBe(null)
    expect(usage.used).toBe(BigInt(500))
  })

  it("returns zero used + unlimited for an unknown school (no row found)", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue(null as never)
    const usage = await getSchoolVideoUsage(SCHOOL_ID)
    expect(usage.used).toBe(BigInt(0))
    expect(usage.isUnlimited).toBe(true)
  })

  it("computes available + percentUsed when quota is configured", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(4) })
    const usage = await getSchoolVideoUsage(SCHOOL_ID)
    expect(usage.isUnlimited).toBe(false)
    expect(usage.quota).toBe(GB * BigInt(4))
    expect(usage.available).toBe(GB * BigInt(3))
    expect(usage.percentUsed).toBe(25)
  })

  it("clamps percentUsed at 100 when over quota (display-friendly)", async () => {
    stubSchool({ used: GB * BigInt(5), quota: GB * BigInt(4) })
    const usage = await getSchoolVideoUsage(SCHOOL_ID)
    expect(usage.percentUsed).toBe(100)
    expect(usage.available).toBe(BigInt(0))
  })

  it("returns 0 percent + 0 available for a zero quota (school admin set 0 explicitly)", async () => {
    stubSchool({ used: BigInt(100), quota: BigInt(0) })
    const usage = await getSchoolVideoUsage(SCHOOL_ID)
    expect(usage.percentUsed).toBe(0)
    expect(usage.available).toBe(BigInt(0))
  })
})

// ---------------------------------------------------------------------------
// checkSchoolVideoQuota
// ---------------------------------------------------------------------------

describe("checkSchoolVideoQuota", () => {
  beforeEach(() => vi.clearAllMocks())

  it("allows any size when quota is null (unconfigured = unlimited)", async () => {
    stubSchool({ used: BigInt(0), quota: null })
    const r = await checkSchoolVideoQuota(SCHOOL_ID, GB * BigInt(100))
    expect(r.allowed).toBe(true)
  })

  it("allows a request that exactly fills the remaining space (inclusive)", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(2) })
    const r = await checkSchoolVideoQuota(SCHOOL_ID, GB)
    expect(r.allowed).toBe(true)
  })

  it("denies a request one byte over the available space", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(2) })
    const r = await checkSchoolVideoQuota(SCHOOL_ID, GB + BigInt(1))
    expect(r.allowed).toBe(false)
  })

  it("accepts plain JS numbers for the requestedBytes arg (callers won't always have BigInts)", async () => {
    stubSchool({ used: BigInt(0), quota: BigInt(10_000) })
    const r = await checkSchoolVideoQuota(SCHOOL_ID, 5_000)
    expect(r.allowed).toBe(true)
    expect(r.requested).toBe(BigInt(5000))
  })

  it("throws when requestedBytes is negative", async () => {
    stubSchool({ used: BigInt(0), quota: GB })
    await expect(checkSchoolVideoQuota(SCHOOL_ID, -1)).rejects.toThrow(
      /non-negative/
    )
  })

  it("returns the full usage shape so callers can render error messages without a second query", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(2) })
    const r = await checkSchoolVideoQuota(SCHOOL_ID, GB * BigInt(2))
    expect(r.allowed).toBe(false)
    expect(r.used).toBe(GB)
    expect(r.quota).toBe(GB * BigInt(2))
    expect(r.available).toBe(GB)
    expect(r.percentUsed).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// incrementSchoolVideoUsage
// ---------------------------------------------------------------------------

describe("incrementSchoolVideoUsage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("issues an atomic `increment` to keep concurrent uploads race-safe", async () => {
    vi.mocked(db.school.update).mockResolvedValue({
      videoStorageUsedBytes: GB,
    } as never)

    const next = await incrementSchoolVideoUsage(SCHOOL_ID, GB)
    expect(next).toBe(GB)
    expect(db.school.update).toHaveBeenCalledWith({
      where: { id: SCHOOL_ID },
      data: { videoStorageUsedBytes: { increment: GB } },
      select: { videoStorageUsedBytes: true },
    })
  })

  it("short-circuits a 0-byte delta (no DB write, returns current usage)", async () => {
    stubSchool({ used: BigInt(123), quota: GB })
    const next = await incrementSchoolVideoUsage(SCHOOL_ID, 0)
    expect(next).toBe(BigInt(123))
    expect(db.school.update).not.toHaveBeenCalled()
  })

  it("throws on a negative delta (use decrement instead)", async () => {
    await expect(incrementSchoolVideoUsage(SCHOOL_ID, -1)).rejects.toThrow(
      /non-negative/
    )
  })
})

// ---------------------------------------------------------------------------
// decrementSchoolVideoUsage
// ---------------------------------------------------------------------------

describe("decrementSchoolVideoUsage", () => {
  beforeEach(() => vi.clearAllMocks())

  it("subtracts delta from current usage", async () => {
    stubSchool({ used: GB * BigInt(3), quota: GB * BigInt(10) })
    vi.mocked(db.school.update).mockResolvedValue({
      videoStorageUsedBytes: GB * BigInt(2),
    } as never)

    const next = await decrementSchoolVideoUsage(SCHOOL_ID, GB)
    expect(next).toBe(GB * BigInt(2))
    expect(db.school.update).toHaveBeenCalledWith({
      where: { id: SCHOOL_ID },
      data: { videoStorageUsedBytes: GB * BigInt(2) },
      select: { videoStorageUsedBytes: true },
    })
  })

  it("clamps at 0 when delta exceeds current usage (double-fire delete safety)", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(10) })
    vi.mocked(db.school.update).mockResolvedValue({
      videoStorageUsedBytes: BigInt(0),
    } as never)

    const next = await decrementSchoolVideoUsage(SCHOOL_ID, GB * BigInt(5))
    expect(next).toBe(BigInt(0))
    const writeArgs = vi.mocked(db.school.update).mock.calls[0][0]
    expect(writeArgs.data).toEqual({ videoStorageUsedBytes: BigInt(0) })
  })

  it("short-circuits a 0-byte delta", async () => {
    stubSchool({ used: GB, quota: GB * BigInt(10) })
    const next = await decrementSchoolVideoUsage(SCHOOL_ID, 0)
    expect(next).toBe(GB)
    expect(db.school.update).not.toHaveBeenCalled()
  })

  it("throws on a negative delta (use increment instead)", async () => {
    await expect(decrementSchoolVideoUsage(SCHOOL_ID, -1)).rejects.toThrow(
      /non-negative/
    )
  })
})
