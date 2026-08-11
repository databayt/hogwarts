// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"

import { fetchNotificationBellData } from "@/components/school-dashboard/notifications/poll-actions"

/**
 * GET /api/notifications/bell?locale=ar|en
 *
 * The notification bell's polling endpoint. This is deliberately a route
 * handler and NOT a server action: auth() rotates the session cookie inside
 * action requests, which makes Next flag the action as revalidated and ship
 * a full RSC re-render of the current page with EVERY poll response. As a
 * GET returning JSON, a poll costs two indexed queries and ~2KB.
 */
export async function GET(req: NextRequest) {
  const localeParam = req.nextUrl.searchParams.get("locale")
  const locale =
    localeParam === "en" || localeParam === "ar" ? localeParam : undefined

  const data = await fetchNotificationBellData(locale)
  if (!data) {
    // No session or no school context — same conditions the action treats as null
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  })
}
