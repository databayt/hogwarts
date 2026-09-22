// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { runReportPipeline } from "@/lib/report"
import { hogwartsReportAdapterFor } from "@/lib/report/adapter"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * "Report an issue" from the phone — the web's footer link, whose server
 * action is `reportIssue`.
 *
 * The same pipeline, fed the same fields: the description, the page it was
 * seen on (the web URL of the screen, so a report lands against the page a
 * browser user would name), the viewport, the direction and the client. The
 * one difference is who is reporting: the web reads that from its session,
 * and this route hands the pipeline the user the bearer token proved, via
 * `hogwartsReportAdapterFor`. Scoring, limits and the human gate after it are
 * untouched.
 *
 * POST /api/mobile/report
 * Body: { description, page_url, viewport, direction: "ltr"|"rtl", client }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "0.0.0.0"

    const result = await runReportPipeline(
      {
        description: String(body.description ?? ""),
        pageUrl: String(body.page_url ?? ""),
        category: "other",
        viewport: String(body.viewport ?? "0x0"),
        direction: body.direction === "rtl" ? "rtl" : "ltr",
        browser: String(body.client ?? "hogwarts-android"),
        hasScreenshot: false,
      },
      hogwartsReportAdapterFor({
        id: auth.userId,
        role: auth.role,
        email: auth.email ?? null,
      }),
      { ip }
    )

    // As `reportIssue` answers the dialog: an issue number only when the
    // report became a verified issue, and nothing that tells a prober why a
    // report was dropped.
    if (result.ok && result.bucket === "verified-report" && result.issueNumber) {
      return NextResponse.json({ ok: true, issue_number: result.issueNumber })
    }
    return NextResponse.json({ ok: result.ok })
  } catch (error) {
    console.error("[mobile/report] POST failed:", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
