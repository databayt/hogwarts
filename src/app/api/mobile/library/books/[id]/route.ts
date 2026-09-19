// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"
import { BOOK_SELECT, toBookDto } from "../../lib/book-dto"

/**
 * One book. Scoped by the token's school, so an id from another tenant reads
 * as missing rather than forbidden — the caller learns nothing either way.
 *
 * GET /api/mobile/library/books/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId } = auth
    const { id } = await params

    const book = await db.schoolBook.findFirst({
      where: { id, schoolId },
      select: BOOK_SELECT,
    })
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 })
    }

    return NextResponse.json(toBookDto(book))
  } catch (error) {
    console.error("[mobile/library/books/:id] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
