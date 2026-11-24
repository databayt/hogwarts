// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: hourly at :05 (cf/crons.json `5 * * * *`) — the morning readiness digest.
//
// A school whose first class today starts 60-120 minutes from now gets one
// digest: each class supervisor their class's counts, each admin the school's,
// linking to /school/analysis?date=<today>. Once per school day. The rules and
// words: school/readiness/alerts-core.ts; the scan: school/readiness/digest.ts.

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { runReadinessDigest } from "@/components/school-dashboard/school/readiness/digest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "readiness-digest")) {
    return new NextResponse("unauthorized", { status: 401 })
  }
  try {
    const scan = await runReadinessDigest(new Date())
    return NextResponse.json({ ok: true, ...scan })
  } catch (err) {
    console.error("[cron/readiness-digest] scan failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
