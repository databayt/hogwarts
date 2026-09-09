"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { borrowBook, returnBook } from "../actions"

interface Props {
  bookId: string
  userId: string
  schoolId: string
  availableCopies: number
  hasBorrowedBook: boolean
  borrowRecordId?: string
  dictionary?: Record<string, string>
}

/**
 * The pill at the foot of the tinted card.
 *
 * Not a `<Button>`: every variant that component offers is themed against the
 * page ground, and this one sits on the book's own colour. The reference's
 * pills are the same shape in all three states — solid white to act, outlined
 * to undo, dimmed when there is nothing to do — so they are written out here
 * rather than bent out of a variant that assumes a light background.
 */

const PILL =
  "inline-flex h-11 w-full items-center justify-center rounded-full px-6 font-semibold transition-opacity disabled:opacity-50"

export default function BorrowBook({
  bookId,
  userId,
  schoolId,
  availableCopies,
  hasBorrowedBook,
  borrowRecordId,
  dictionary: lib,
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleBorrow = async () => {
    setIsLoading(true)

    try {
      const result = await borrowBook({
        bookId,
        userId,
        schoolId,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(
          result.message || lib?.borrowFailed || "Failed to borrow book"
        )
      }
    } catch {
      toast.error(lib?.unexpectedError || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!borrowRecordId) return

    setIsLoading(true)

    try {
      const result = await returnBook({
        borrowRecordId,
        schoolId,
      })

      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(
          result.message || lib?.returnFailed || "Failed to return book"
        )
      }
    } catch {
      toast.error(lib?.unexpectedError || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (hasBorrowedBook) {
    return (
      <div className="space-y-3">
        <p className="inline-flex items-center gap-1.5 text-sm text-white">
          <Check className="size-4" />
          {lib?.borrowedThisBook || "You have borrowed this book"}
        </p>
        <button
          type="button"
          onClick={handleReturn}
          disabled={isLoading}
          className={`${PILL} border border-white/70 text-white hover:bg-white/15`}
        >
          {isLoading
            ? lib?.returning || "Returning..."
            : lib?.returnBook || "Return Book"}
        </button>
      </div>
    )
  }

  if (availableCopies === 0) {
    return (
      // `opacity-100` cancels the base `disabled:opacity-50`. This pill is
      // disabled for its whole life rather than for the length of a request,
      // so the two compound: a 20%-white fill at half strength is 10%, which
      // on a dark cover is no pill at all. It reads as unavailable by being
      // flat and unfilled, not by being faint.
      <button
        type="button"
        disabled
        className={`${PILL} bg-white/20 text-white opacity-100`}
      >
        {lib?.currentlyUnavailable || "Currently Unavailable"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleBorrow}
      disabled={isLoading}
      className={`${PILL} bg-white text-black hover:opacity-90`}
    >
      {isLoading
        ? lib?.borrowing || "Borrowing..."
        : lib?.borrowBook || "Borrow Book"}
    </button>
  )
}
