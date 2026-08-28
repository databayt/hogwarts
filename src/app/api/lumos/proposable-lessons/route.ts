// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import {
  MAX_PROPOSABLE_RESULTS,
  searchProposableLessons,
} from "@/components/lumos/teach/get-proposable-lessons"

/**
 * GET /api/lumos/proposable-lessons?subjectIds=&chapterId=&take=&locale=
 *
 * The lesson tier of the propose dialog's grade → subject → chapter → lesson
 * picker. Deliberately a route handler and NOT a server action: auth() rotates
 * the session cookie inside action requests, which makes Next flag the action
 * as revalidated and ship a full RSC re-render of the current page with every
 * response. As a GET returning JSON, one subject's lessons cost one indexed
 * query and a few KB — the dialog then filters that page client-side, on the
 * translated text the user can actually see.
 *
 * Authorization lives entirely in `searchProposableLessons` (proposer roles
 * only, scoped to the school's active SubjectSelections); `subjectIds` are
 * intersected with that scope and `chapterId` is filtered through it.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = req.nextUrl.searchParams
  const takeParam = Number(params.get("take"))
  const take =
    Number.isFinite(takeParam) && takeParam > 0
      ? Math.min(takeParam, MAX_PROPOSABLE_RESULTS)
      : MAX_PROPOSABLE_RESULTS

  const subjectIds = (params.get("subjectIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  const localeParam = params.get("locale")
  const locale =
    localeParam === "en" || localeParam === "ar" ? localeParam : undefined

  const result = await searchProposableLessons({
    subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
    chapterId: params.get("chapterId") ?? undefined,
    take,
    lang: locale,
  })

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  })
}
