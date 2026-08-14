// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import type { Transaction } from "../types"

/**
 * Ceiling on how many rows the history page loads at once.
 *
 * The table filters, sorts and paginates on the client, so every row it can
 * show has to be in the payload. That is fine at the scale a linked personal
 * account actually reaches, but it must not be unbounded — hence a window,
 * reported alongside `total` so the UI can say how much it is holding back.
 * Never let this truncate silently: that is the bug this query replaces.
 */
export const TRANSACTION_WINDOW = 500

export interface TransactionHistory {
  /** Most recent `TRANSACTION_WINDOW` rows, newest first. */
  transactions: Transaction[]
  /** Every row the caller owns, however many were actually loaded. */
  total: number
}

/**
 * The caller's transactions across all of their linked accounts.
 *
 * Deliberately NOT in `actions/bank.actions.ts`: that module is `"use server"`,
 * so each export there is a public POST endpoint. A read belongs in a
 * server-only query module.
 *
 * Bank accounts are personal, so ownership is the authorization boundary —
 * resolved from the session here rather than trusted from a caller-supplied
 * id — and the rows are additionally scoped by `schoolId` like every other
 * finance query.
 */
export const getTransactionHistory = cache(
  async (): Promise<TransactionHistory> => {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) return { transactions: [], total: 0 }

    const where = {
      bankAccount: { userId },
      ...(session.user.schoolId && { schoolId: session.user.schoolId }),
    }

    const [rows, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: TRANSACTION_WINDOW,
      }),
      db.transaction.count({ where }),
    ])

    return { transactions: rows.map(toTransaction), total }
  }
)

/**
 * Prisma row -> the UI `Transaction` the table renders.
 *
 * These shapes genuinely differ: the row stores location as five flat columns
 * and `subcategory` as a single nullable string, while the view type wants a
 * nested `location` object and a list. The old path appeared to work only
 * because it pushed rows through `parseStringify`, which erased the mismatch
 * into `any` -- the details sheet's Location block could never render.
 *
 * Converting `amount` off Decimal here is also required: a Decimal cannot
 * cross into a Client Component.
 */
function toTransaction(row: {
  id: string
  bankAccountId: string
  amount: Prisma.Decimal
  date: Date
  name: string
  merchantName: string | null
  category: string
  subcategory: string | null
  type: string
  pending: boolean
  paymentChannel: string | null
  locationAddress: string | null
  locationCity: string | null
  locationState: string | null
  locationZip: string | null
  locationCountry: string | null
  isoCurrencyCode: string
}): Transaction {
  const location = [
    row.locationAddress,
    row.locationCity,
    row.locationState,
    row.locationZip,
    row.locationCountry,
  ].some(Boolean)
    ? {
        address: row.locationAddress ?? undefined,
        city: row.locationCity ?? undefined,
        region: row.locationState ?? undefined,
        postalCode: row.locationZip ?? undefined,
        country: row.locationCountry ?? undefined,
      }
    : undefined

  return {
    id: row.id,
    bankAccountId: row.bankAccountId,
    amount: row.amount.toNumber(),
    isoCurrencyCode: row.isoCurrencyCode,
    date: row.date,
    name: row.name,
    merchantName: row.merchantName ?? undefined,
    category: row.category,
    subcategory: row.subcategory ? [row.subcategory] : undefined,
    type: row.type === "credit" ? "credit" : "debit",
    pending: row.pending,
    paymentChannel: PAYMENT_CHANNELS.includes(row.paymentChannel as never)
      ? (row.paymentChannel as "online" | "in_store" | "other")
      : undefined,
    location,
  }
}

const PAYMENT_CHANNELS = ["online", "in_store", "other"] as const
