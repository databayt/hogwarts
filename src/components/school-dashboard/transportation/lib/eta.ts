// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Bell-time ETA helpers. Given an optimized route (per-stop cumulative travel
// seconds measured from the school anchor) and the school's bell time, compute
// each stop's clock ETA — working BACKWARD for PICKUP (arrive at school by
// open − buffer) and FORWARD for DROPOFF (depart at close + buffer).
//
// Pure module (no DB) except `getSchoolBellTimes`, which reads the active
// period grid. Kept here so the arithmetic is unit-testable in isolation.

import { db } from "@/lib/db"

export type RouteDir = "PICKUP" | "DROPOFF"

export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minutesToHHmm(min: number): string {
  const norm = ((Math.round(min) % 1440) + 1440) % 1440
  const h = Math.floor(norm / 60)
  const m = norm % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export interface CumulativeStop {
  stopId: string
  /** Travel seconds between this stop and the school along the route path. */
  cumulativeSecondsFromSchool: number
  distanceFromPrevKm: number
}

export interface StopEta {
  stopId: string
  eta: string // "HH:mm"
  distanceFromPrevKm: number
}

/**
 * Assign each stop a clock ETA relative to the school bell time.
 * - PICKUP: the bus must reach school by `bellTime − bufferMinutes`; each stop's
 *   pickup time is that arrival minus its travel time to school.
 * - DROPOFF: the bus departs school at `bellTime + bufferMinutes`; each stop's
 *   drop time is departure plus its travel time from school.
 */
export function computeStopEtas(args: {
  direction: RouteDir
  bellTime: string
  bufferMinutes: number
  stops: CumulativeStop[]
}): StopEta[] {
  const { direction, bellTime, bufferMinutes, stops } = args
  const bellMin = hhmmToMinutes(bellTime)
  const anchor =
    direction === "PICKUP" ? bellMin - bufferMinutes : bellMin + bufferMinutes

  return stops.map((s) => {
    const offsetMin = s.cumulativeSecondsFromSchool / 60
    const etaMin =
      direction === "PICKUP" ? anchor - offsetMin : anchor + offsetMin
    return {
      stopId: s.stopId,
      eta: minutesToHHmm(etaMin),
      distanceFromPrevKm: s.distanceFromPrevKm,
    }
  })
}

/**
 * Resolve the school's open/close bell times from the active period grid.
 * Open = earliest Period.startTime, close = latest Period.endTime, scoped to the
 * active term's school year when available (else any period for the school).
 * `@db.Time` columns come back as epoch-dated Dates — read the time in UTC.
 * Returns null when the school has no periods configured.
 */
export async function getSchoolBellTimes(
  schoolId: string
): Promise<{ open: string; close: string } | null> {
  // Prefer the active term's school year so we read the live bell grid.
  const activeTerm = await db.term
    .findFirst({
      where: { schoolId, isActive: true },
      select: { yearId: true },
    })
    .catch(() => null)

  const periods = await db.period.findMany({
    where: {
      schoolId,
      ...(activeTerm?.yearId ? { yearId: activeTerm.yearId } : {}),
    },
    select: { startTime: true, endTime: true },
  })
  if (periods.length === 0) return null

  const toMin = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes()
  let openMin = Infinity
  let closeMin = -Infinity
  for (const p of periods) {
    openMin = Math.min(openMin, toMin(p.startTime))
    closeMin = Math.max(closeMin, toMin(p.endTime))
  }
  if (!Number.isFinite(openMin) || !Number.isFinite(closeMin)) return null
  return { open: minutesToHHmm(openMin), close: minutesToHHmm(closeMin) }
}
