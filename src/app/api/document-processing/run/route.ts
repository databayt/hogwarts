// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { processNextJobs } from "@/lib/document-extraction/queue-runner"

/**
 * POST /api/document-processing/run
 * Trigger processing of pending document jobs
 * Auth: DEVELOPER or ADMIN only
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (
      !session?.user ||
      !["DEVELOPER", "ADMIN"].includes(session.user.role ?? "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const maxJobs = Math.min(Number(body.maxJobs) || 10, 50)
    const schoolId = body.schoolId || session.user.schoolId

    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Missing school context" },
        { status: 400 }
      )
    }

    const result = await processNextJobs({
      maxJobs,
      schoolId: session.user.role === "DEVELOPER" ? schoolId : schoolId,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Processing failed",
      },
      { status: 500 }
    )
  }
}
