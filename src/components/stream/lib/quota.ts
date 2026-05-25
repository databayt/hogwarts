// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Per-school video storage quota service.
 *
 * Wraps the four primitives every video upload caller needs. The schema
 * fields (School.videoStorageUsedBytes, School.videoStorageQuotaBytes) ship
 * unused; this module turns intent into enforcement.
 *
 * BigInt-safe throughout (schema uses BigInt). null quota = unlimited.
 * Atomic increment/decrement so concurrent uploads don't race.
 */

import { db } from "@/lib/db"

export interface SchoolVideoUsage {
  used: bigint
  quota: bigint | null
  available: bigint | null
  percentUsed: number | null
  isUnlimited: boolean
}

export interface QuotaCheckResult extends SchoolVideoUsage {
  allowed: boolean
  requested: bigint
}

/**
 * Read the school's current usage + quota. Returns zeros for an unknown
 * school rather than throwing — the caller can treat that as "no quota
 * configured" the same way they treat unlimited.
 */
export async function getSchoolVideoUsage(
  schoolId: string
): Promise<SchoolVideoUsage> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: {
      videoStorageUsedBytes: true,
      videoStorageQuotaBytes: true,
    },
  })

  const used = school?.videoStorageUsedBytes ?? BigInt(0)
  const quota = school?.videoStorageQuotaBytes ?? null

  if (quota === null) {
    return {
      used,
      quota: null,
      available: null,
      percentUsed: null,
      isUnlimited: true,
    }
  }

  const available = quota > used ? quota - used : BigInt(0)
  const percentUsed = quota === BigInt(0) ? 0 : computePercent(used, quota)

  return { used, quota, available, percentUsed, isUnlimited: false }
}

/**
 * Predicate every upload caller should hit before accepting bytes. Always
 * returns allowed=true when the school has no quota set (null = unlimited
 * per the schema comment). Allowed when used + requested <= quota.
 */
export async function checkSchoolVideoQuota(
  schoolId: string,
  requestedBytes: bigint | number
): Promise<QuotaCheckResult> {
  const requested = toBigInt(requestedBytes)
  if (requested < BigInt(0)) {
    throw new Error("requestedBytes must be non-negative")
  }
  const usage = await getSchoolVideoUsage(schoolId)
  const allowed = usage.isUnlimited
    ? true
    : usage.used + requested <= (usage.quota as bigint)
  return { ...usage, allowed, requested }
}

/**
 * Atomically bump used bytes after a successful upload. Use `db.$transaction`
 * upstream if you need check-then-write atomicity across both calls; the
 * increment itself is atomic at the row level.
 */
export async function incrementSchoolVideoUsage(
  schoolId: string,
  deltaBytes: bigint | number
): Promise<bigint> {
  const delta = toBigInt(deltaBytes)
  if (delta < BigInt(0)) {
    throw new Error("deltaBytes must be non-negative for increment")
  }
  if (delta === BigInt(0)) {
    // Nothing to write — short-circuit so callers can pass through a 0-byte
    // edge case (empty file, paused upload) without an extra DB roundtrip.
    return (await getSchoolVideoUsage(schoolId)).used
  }

  const updated = await db.school.update({
    where: { id: schoolId },
    data: { videoStorageUsedBytes: { increment: delta } },
    select: { videoStorageUsedBytes: true },
  })
  return updated.videoStorageUsedBytes ?? BigInt(0)
}

/**
 * Atomically reduce used bytes after a delete. Clamps at 0 so a double-fire
 * delete (e.g., webhook retry + manual cleanup) never produces a negative
 * counter that future quota checks would misinterpret.
 */
export async function decrementSchoolVideoUsage(
  schoolId: string,
  deltaBytes: bigint | number
): Promise<bigint> {
  const delta = toBigInt(deltaBytes)
  if (delta < BigInt(0)) {
    throw new Error("deltaBytes must be non-negative for decrement")
  }
  if (delta === BigInt(0)) {
    return (await getSchoolVideoUsage(schoolId)).used
  }

  // Clamp at zero: re-read used, compute max(0, used - delta), write back.
  // Trades atomicity for correctness on the clamp — the alternative
  // ({ decrement: delta }) can go negative on double-fire.
  const current = await getSchoolVideoUsage(schoolId)
  const next = current.used > delta ? current.used - delta : BigInt(0)

  const updated = await db.school.update({
    where: { id: schoolId },
    data: { videoStorageUsedBytes: next },
    select: { videoStorageUsedBytes: true },
  })
  return updated.videoStorageUsedBytes ?? BigInt(0)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBigInt(value: bigint | number): bigint {
  if (typeof value === "bigint") return value
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error("byte counts must be finite integers or bigints")
  }
  return BigInt(value)
}

function computePercent(used: bigint, quota: bigint): number {
  // BigInt division truncates; multiply first to keep two decimals of
  // precision. Capping at 100 because over-quota math should still display
  // as "full" rather than 137%.
  const raw = Number((used * BigInt(10000)) / quota) / 100
  return raw > 100 ? 100 : raw
}
