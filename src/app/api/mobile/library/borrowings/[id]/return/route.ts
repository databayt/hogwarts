// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"
import { BORROW_SELECT, toBorrowingDto } from "../../../lib/book-dto"

/**
 * Give a book back — `actions.ts#returnBook`, narrowed to the reader's own
 * loan. Stamps the return, marks the record RETURNED and frees the copy in
 * one transaction.
 *
 * The web has no renew, so neither does this. A reader who wants longer
 * returns the book and borrows it again, which is what the shelf sees anyway.
 *
 * POST /api/mobile/library/borrowings/:id/return
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId } = auth
    const { id } = await params

    const record = await db.borrowRecord.findFirst({
      where: { id, schoolId, userId },
      select: { id: true, bookId: true, status: true },
    })
    if (!record) {
      return NextResponse.json({ error: "Borrowing not found" }, { status: 404 })
    }
    if (record.status === "RETURNED") {
      return NextResponse.json({ error: "already_returned" }, { status: 409 })
    }

    const [updated] = await db.$transaction([
      db.borrowRecord.update({
        where: { id: record.id },
        data: { returnDate: new Date(), status: "RETURNED" },
        select: BORROW_SELECT,
      }),
      db.schoolBook.update({
        where: { id: record.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ])

    return NextResponse.json(toBorrowingDto(updated))
  } catch (error) {
    console.error("[mobile/library/borrowings/:id/return] POST failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
