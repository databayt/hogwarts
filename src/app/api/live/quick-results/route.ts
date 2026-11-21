// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"

import { getQuickAssessmentResults } from "@/components/school-dashboard/exams/quick/actions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/live/quick-results?id=<quickAssessmentId>
 *
 * The room's Quiz tab polls this every few seconds while a quick check is
 * open. A route handler and NOT the server action: `auth()` rotates the
 * session cookie inside an action request, which makes Next ship a full RSC
 * re-render of the current page with every poll response (the same reason the
 * notification bell polls `/api/notifications/bell`). As a GET it is a small
 * JSON body.
 *
 * It calls the action's own function, so the answer is identical and the
 * gate is the same one: a signed-in DEVELOPER / ADMIN / TEACHER of THIS
 * school (session + tenant resolved exactly as the action does), reading an
 * assessment of this school. Anyone else gets the action's refusal, mapped to
 * a status.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing id", code: "BAD_REQUEST" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    )
  }

  const result = await getQuickAssessmentResults(id)
  const status = result.success
    ? 200
    : result.code === "NO_SCHOOL"
      ? 401
      : result.code === "NOT_FOUND"
        ? 404
        : 500

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}
