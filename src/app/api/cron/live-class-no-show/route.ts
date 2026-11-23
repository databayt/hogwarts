// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cron: every 5 minutes (cf/crons.json `*/5`) — «حصة بلا معلم».
//
// A class that started five minutes ago and has no teacher in it is told to the
// school's admins and the supervisors of its stage, once, with a link to the
// cover page (/live/<id>/cover). Quiet hours (cf/worker.js) run it on the hour
// only. The rule and the words: live/no-show.ts; the scan: live/no-show-core.ts.

import { NextResponse } from "next/server"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { runNoShowScan } from "@/components/school-dashboard/live/no-show-core"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  if (!isAuthorizedCron(req, "live-class-no-show")) {
    return new NextResponse("unauthorized", { status: 401 })
  }
  try {
    const scan = await runNoShowScan(new Date())
    return NextResponse.json({ ok: true, ...scan })
  } catch (err) {
    console.error("[cron/live-class-no-show] scan failed", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
