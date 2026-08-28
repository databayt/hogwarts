// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { getSuggestedPrice } from "@/components/lumos/teach/get-proposable-lessons"

/**
 * GET /api/lumos/suggested-price?subjectId=&currency=
 *
 * What comparable videos on one course already charge, for the propose
 * dialog's price field. A route handler and not a server action for the same
 * reason as its proposable-* siblings: `auth()` rotates the session cookie
 * inside action requests, so an action would ship a full RSC re-render of the
 * page with every response.
 *
 * `getSuggestedPrice` re-resolves the caller's own scope, so a subject they
 * may not contribute to returns nothing rather than another school's pricing.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const subjectId = params.get("subjectId")
  const currency = params.get("currency")
  const suggestion =
    subjectId && currency ? await getSuggestedPrice(subjectId, currency) : null

  return NextResponse.json(
    { suggestion },
    { headers: { "Cache-Control": "no-store" } }
  )
}
