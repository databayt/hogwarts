// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { getProposableChapters } from "@/components/lumos/teach/get-proposable-lessons"

/**
 * GET /api/lumos/proposable-chapters?subjectId=
 *
 * The chapter tier of the propose dialog's picker, loaded when a subject is
 * chosen. A route handler for the same reason as its lessons sibling — see
 * that file. `getProposableChapters` re-checks the subject against the
 * caller's own scope, so this returns nothing for another school's subject.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const subjectId = params.get("subjectId")
  const localeParam = params.get("locale")
  const locale =
    localeParam === "en" || localeParam === "ar" ? localeParam : undefined
  const chapters = subjectId
    ? await getProposableChapters(subjectId, locale)
    : []

  return NextResponse.json(
    { chapters },
    { headers: { "Cache-Control": "no-store" } }
  )
}
