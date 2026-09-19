// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { BORROW_SELECT, toBorrowingDto } from "../lib/book-dto"

/**
 * What this reader has out, newest loan first — open loans before returned
 * ones, which is the order `/library/my-profile` lists them in.
 *
 * GET /api/mobile/library/my-borrowings
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId } = auth

    const records = await db.borrowRecord.findMany({
      where: { schoolId, userId },
      select: BORROW_SELECT,
      orderBy: [{ returnDate: { sort: "asc", nulls: "first" } }, { borrowDate: "desc" }],
    })

    return NextResponse.json({ data: records.map(toBorrowingDto) })
  } catch (error) {
    console.error("[mobile/library/my-borrowings] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
