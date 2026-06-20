// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Prune live-tracking breadcrumbs older than 7 days. TripLocation is high-volume
 * (~1 row / 3-5s / in-progress trip), so this is not optional at scale.
 * Schedule: `0 3 * * *`.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "cleanup-trip-locations")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const cutoff = new Date(Date.now() - 7 * 86_400_000)
    const result = await db.tripLocation.deleteMany({
      where: { timestamp: { lt: cutoff } },
    })
    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (err) {
    console.error("[cleanup-trip-locations] failed", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
