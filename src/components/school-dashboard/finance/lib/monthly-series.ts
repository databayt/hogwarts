// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Monthly revenue / expense series for the finance hub charts.
 *
 * The hub used to render the shared dashboard charts with NO data, so they
 * fell back to shadcn's sample series — fabricated "revenue" and "expenses"
 * with English month names on a finance page. This is the real aggregate:
 * one grouped query per side, bucketed by the SCHOOL's calendar month.
 *
 * Prisma stores DateTime as `timestamp(3)` holding UTC wall time, so a value
 * is first tagged as UTC and then shifted into the school zone before
 * `date_trunc('month', …)`; without that first step Postgres would read the
 * stored UTC digits as if they were already local and every payment near a
 * month boundary would land in the wrong month for a non-UTC school.
 */

import "server-only"

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { schoolMonthsBack } from "@/lib/timezone"

export interface MonthlyPoint {
  /** `YYYY-MM` in the school's zone — stable key, locale-free. */
  ym: string
  /** UTC instant the school-month begins; format it with the viewer's locale. */
  monthStart: Date
  revenue: number
  expenses: number
}

interface BucketRow {
  ym: string
  total: number | null
}

/**
 * Last `months` school-months (oldest first, current month last), zero-filled
 * so the charts always get a continuous axis. Revenue = SUCCESS payments;
 * expenses = APPROVED + PAID expenses (a rejected or pending claim is not a
 * cost yet).
 */
export async function getMonthlyRevenueExpenses(
  schoolId: string,
  timeZone: string,
  months = 12,
  now: Date = new Date()
): Promise<MonthlyPoint[]> {
  const since = schoolMonthsBack(timeZone, now, months - 1)

  const [payments, expenses] = await Promise.all([
    db.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(
               date_trunc('month', ("paymentDate" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}),
               'YYYY-MM'
             ) AS ym,
             SUM("amount")::float8 AS total
      FROM "Payment"
      WHERE "schoolId" = ${schoolId}
        AND "status"::text = 'SUCCESS'
        AND "paymentDate" >= ${since}
      GROUP BY 1
    `),
    db.$queryRaw<BucketRow[]>(Prisma.sql`
      SELECT to_char(
               date_trunc('month', ("expenseDate" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}),
               'YYYY-MM'
             ) AS ym,
             SUM("amount")::float8 AS total
      FROM "Expense"
      WHERE "schoolId" = ${schoolId}
        AND "status"::text IN ('APPROVED', 'PAID')
        AND "expenseDate" >= ${since}
      GROUP BY 1
    `),
  ])

  const revenueByYm = new Map(payments.map((r) => [r.ym, Number(r.total ?? 0)]))
  const expensesByYm = new Map(
    expenses.map((r) => [r.ym, Number(r.total ?? 0)])
  )

  const series: MonthlyPoint[] = []
  for (let back = months - 1; back >= 0; back--) {
    const monthStart = schoolMonthsBack(timeZone, now, back)
    const ym = ymOf(monthStart, timeZone)
    series.push({
      ym,
      monthStart,
      revenue: revenueByYm.get(ym) ?? 0,
      expenses: expensesByYm.get(ym) ?? 0,
    })
  }
  return series
}

/** `YYYY-MM` of an instant in the given zone (matches Postgres' to_char). */
function ymOf(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(instant)
  const year = parts.find((p) => p.type === "year")?.value ?? "0000"
  const month = parts.find((p) => p.type === "month")?.value ?? "00"
  return `${year}-${month}`
}
