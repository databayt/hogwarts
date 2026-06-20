// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live GPS ingest for an in-progress trip. Two auth paths:
//   1. Bearer SchoolApiToken (vehicle tracker device) — scope transportation.location
//   2. Session cookie (driver's phone) — must be the trip's driver OR hold
//      record_boarding permission
// schoolId is ALWAYS taken from the token/tenant context, NEVER the request body
// (mirrors the geofence webhook). Persists a breadcrumb, broadcasts trip:location,
// and emits trip:approaching when the bus nears a pending stop.

import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"
import { z } from "zod"

import { verifyApiToken } from "@/lib/api-tokens"
import { db } from "@/lib/db"
import { haversineMeters } from "@/lib/haversine"
import {
  checkRateLimitAsync,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"
import { notifyGuardiansOfTripEvent } from "@/components/school-dashboard/transportation/actions/notifications"
import { checkTransportationPermission } from "@/components/school-dashboard/transportation/authorization"
import { emitTripEvent } from "@/components/school-dashboard/transportation/lib/realtime"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const SCOPE = "transportation.location"
const APPROACH_DEDUP_MS = 5 * 60 * 1000 // re-alert a stop at most every 5 min

const bodySchema = z.object({
  tripId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  battery: z.number().int().min(0).max(100).optional(),
})

export async function POST(request: NextRequest) {
  const rl = await checkRateLimitAsync(
    request,
    RATE_LIMITS.GEO_LOCATION,
    "transport-location"
  )
  if (!rl.allowed) return createRateLimitResponse(rl.resetTime)

  // Resolve schoolId from the auth path (token first, then session).
  let schoolId: string | null = null
  let sessionUserId: string | null = null
  let sessionRole: UserRole | null = null
  const authHeader = request.headers.get("authorization") ?? ""
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(authHeader.trim())

  if (tokenMatch) {
    const v = await verifyApiToken(tokenMatch[1].trim(), SCOPE)
    if (!v.ok) {
      const status = v.reason === "INSUFFICIENT_SCOPE" ? 403 : 401
      return NextResponse.json({ ok: false, error: v.reason }, { status })
    }
    schoolId = v.token.schoolId
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHENTICATED" },
        { status: 401 }
      )
    }
    sessionUserId = session.user.id
    sessionRole = (session.user.role as UserRole | undefined) ?? null
    const tenant = await getTenantContext()
    schoolId = tenant.schoolId
    if (!schoolId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_SCHOOL" },
        { status: 400 }
      )
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    )
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }
  const { tripId, lat, lng, accuracy, heading, speed, battery } = parsed.data

  const trip = await db.trip.findFirst({
    where: { id: tripId, schoolId, deletedAt: null },
    select: {
      id: true,
      status: true,
      driverId: true,
      vehicleId: true,
      routeId: true,
    },
  })
  if (!trip) {
    return NextResponse.json(
      { ok: false, error: "TRIP_NOT_FOUND" },
      { status: 404 }
    )
  }
  if (trip.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { ok: false, error: "TRIP_INVALID_STATE" },
      { status: 409 }
    )
  }

  // Session path: must be the trip's driver OR hold record_boarding.
  if (sessionUserId) {
    const userId = sessionUserId
    const role = (sessionRole ?? "USER") as UserRole
    const isDriver = trip.driverId
      ? await db.driver.findFirst({
          where: { id: trip.driverId, schoolId, userId },
          select: { id: true },
        })
      : null
    const allowed =
      Boolean(isDriver) ||
      checkTransportationPermission(
        { userId, role, schoolId },
        "record_boarding"
      )
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 403 }
      )
    }
  }

  try {
    await db.tripLocation.create({
      data: {
        schoolId,
        tripId,
        driverId: trip.driverId,
        vehicleId: trip.vehicleId,
        lat,
        lng,
        accuracy,
        heading,
        speed,
        battery,
      },
    })
  } catch {
    return NextResponse.json(
      { ok: false, error: "WRITE_FAILED" },
      { status: 500 }
    )
  }

  // Broadcast the live position (best-effort).
  await emitTripEvent(tripId, "trip:location", {
    tripId,
    lat,
    lng,
    heading,
    speed,
    timestamp: new Date().toISOString(),
  })

  // "Bus approaching" — alert each pending stop the bus has come within range of,
  // at most once per APPROACH_DEDUP window (the rate limiter doubles as a TTL gate).
  try {
    const settings = await db.transportationSettings.findUnique({
      where: { schoolId },
      select: { approachAlertMeters: true },
    })
    const radius = settings?.approachAlertMeters ?? 500
    const pending = await db.tripBoarding.findMany({
      where: { schoolId, tripId, status: "PENDING" },
      select: {
        studentId: true,
        stop: { select: { id: true, latitude: true, longitude: true } },
      },
    })
    // Group riders by their geolocated stop.
    const byStop = new Map<
      string,
      { lat: number; lng: number; studentIds: string[] }
    >()
    for (const b of pending) {
      const s = b.stop
      if (!s?.latitude || !s?.longitude) continue
      const entry = byStop.get(s.id) ?? {
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        studentIds: [],
      }
      entry.studentIds.push(b.studentId)
      byStop.set(s.id, entry)
    }
    for (const [stopId, info] of byStop) {
      const dist = haversineMeters(
        { lat, lng },
        { lat: info.lat, lng: info.lng }
      )
      if (dist > radius) continue
      const gate = await checkRateLimitAsync(
        request,
        { windowMs: APPROACH_DEDUP_MS, maxRequests: 1 },
        `transport-approach:${tripId}:${stopId}`
      )
      if (!gate.allowed) continue
      const mps = speed && speed > 1 ? speed : 8.3 // ~30km/h default
      await emitTripEvent(tripId, "trip:approaching", {
        tripId,
        stopId,
        etaMinutes: Math.max(1, Math.round(dist / mps / 60)),
      })
      // Guardian "bus approaching" alert (in-app + WhatsApp), scoped to the
      // riders waiting at this stop.
      void notifyGuardiansOfTripEvent({
        schoolId,
        tripId,
        routeId: trip.routeId,
        kind: "bus_approaching",
        studentIds: info.studentIds,
      })
    }
  } catch {
    // approaching alerts are best-effort
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
