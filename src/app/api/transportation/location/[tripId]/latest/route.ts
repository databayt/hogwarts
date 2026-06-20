// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Latest live position for a trip — the live map's polling fallback when the
// Socket.IO server is unavailable. Session-auth + school-scoped read.

import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHENTICATED" },
      { status: 401 }
    )
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_SCHOOL" },
      { status: 400 }
    )
  }

  const { tripId } = await params

  const latest = await db.tripLocation.findFirst({
    where: { schoolId, tripId },
    orderBy: { timestamp: "desc" },
    select: {
      lat: true,
      lng: true,
      heading: true,
      speed: true,
      timestamp: true,
    },
  })

  if (!latest) {
    return NextResponse.json({ ok: true, location: null }, { status: 200 })
  }

  return NextResponse.json(
    {
      ok: true,
      location: {
        lat: Number(latest.lat),
        lng: Number(latest.lng),
        heading: latest.heading,
        speed: latest.speed,
        timestamp: latest.timestamp.toISOString(),
      },
    },
    { status: 200 }
  )
}
