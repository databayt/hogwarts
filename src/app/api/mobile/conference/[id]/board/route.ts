// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse, type NextRequest } from "next/server"

import { ACTION_ERRORS } from "@/lib/action-errors"
import {
  getBoardFor,
  saveBoardFor,
} from "@/components/school-dashboard/live/actions/board-core"

import { authenticate, isAuthError } from "../../../lib/authenticate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET  /api/mobile/conference/:id/board → { success, data: { strokes } }
 * PUT  /api/mobile/conference/:id/board   { strokes } → { success, data: { count } }
 *
 * The board's memory for a teacher hosting from the app — the same row and
 * checks the web room's `saveBoard` / `getBoard` use (`board-core.ts`): a
 * HOST / CO_HOST seat in this session, with the school's board switch on.
 */
function status(error: string): number {
  if (error === ACTION_ERRORS.UNAUTHORIZED) return 403
  if (error === ACTION_ERRORS.NOT_FOUND) return 404
  if (error === ACTION_ERRORS.VALIDATION_ERROR) return 400
  return 500
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth
  const { id } = await params
  const res = await getBoardFor(
    { userId: auth.userId, schoolId: auth.schoolId },
    id
  )
  return NextResponse.json(res, {
    status: res.success ? 200 : status(res.error),
    headers: { "Cache-Control": "no-store" },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth
  const { id } = await params
  const body = (await request.json().catch(() => null)) as {
    strokes?: unknown
  } | null
  if (!body) {
    return NextResponse.json(
      { success: false, error: ACTION_ERRORS.VALIDATION_ERROR },
      { status: 400 }
    )
  }
  const res = await saveBoardFor(
    { userId: auth.userId, schoolId: auth.schoolId },
    id,
    body.strokes
  )
  return NextResponse.json(res, {
    status: res.success ? 200 : status(res.error),
    headers: { "Cache-Control": "no-store" },
  })
}
