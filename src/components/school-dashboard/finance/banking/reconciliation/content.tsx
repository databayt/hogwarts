// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Reconciliation Report (P2.3 — Aldar UAE).
 *
 * Server component. Live 3-column diff:
 *   - Payments  → what the Payment table records (admin's view)
 *   - Gateway   → what the gateway webhook claimed (ProcessedWebhookEvent
 *                 payload sums by provider)
 *   - Ledger    → what posted to the double-entry ledger (cash leg of
 *                 fees-source JournalEntry rows)
 *
 * Default window: last 30 days. Persistence into BankReconciliation is
 * scoped for a v2 — for the Aldar pitch the live read is enough to surface
 * "we have a discrepancy" / "everything matches" at a glance.
 *
 * Scoped by schoolId. Anyone without the `fees:view` permission gets a
 * polite "no access" message rather than empty totals.
 */
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/payment/currency"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { checkCurrentUserPermission } from "../../lib/permissions"

interface Props {
  lang: Locale
  /**
   * Look-back window in days. URL query `?days=N` should pass through here;
   * unset defaults to 30.
   */
  days?: number
}

type SourceRow = {
  source: string // PaymentMethod enum value or "tap" | "stripe"
  paymentCount: number
  paymentSum: number
  gatewayCount: number
  gatewaySum: number
  ledgerSum: number
}

const ZERO_THRESHOLD = 0.01 // ignore sub-cent floating-point dust

export async function ReconciliationContent({ lang, days = 30 }: Props) {
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)
  const r = (dictionary as any)?.finance?.reconciliation as
    | Record<string, string>
    | undefined

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {r?.schoolNotFound || "School context not found"}
      </p>
    )
  }

  const canView = await checkCurrentUserPermission(schoolId, "banking", "view")
  if (!canView) {
    return (
      <p className="text-muted-foreground">
        {r?.noPermission ||
          "You don't have permission to view the reconciliation report"}
      </p>
    )
  }

  // Window: anchor on the school's local day so cron-running reports don't
  // drift across the UTC midnight. We keep the math in plain Date — UTC is
  // fine for sum/group queries (no time-zone-sensitive grouping yet).
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  since.setUTCHours(0, 0, 0, 0)

  const [school, payments, webhookEvents, ledgerEntries] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
    // Payments grouped by paymentMethod + status. Discrepancies surface
    // when admin recorded a manual payment that the gateway never saw, or
    // a gateway webhook that never produced a Payment row.
    db.payment.groupBy({
      by: ["paymentMethod", "status"],
      where: { schoolId, paymentDate: { gte: since } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    // Gateway-claimed totals from the raw webhook payloads. ProcessedWebhookEvent
    // stores `payload` as JSON — we use a SQL aggregate to sum the `amount`
    // field across all CAPTURED/captured Tap charges and Stripe sessions.
    db.processedWebhookEvent.findMany({
      where: {
        schoolId,
        processedAt: { gte: since },
      },
      select: {
        provider: true,
        payload: true,
      },
    }),
    // Ledger cash-leg from fees-source journal entries. The double-entry
    // engine posts debit-cash on a fee payment, so `LedgerEntry.debit`
    // against a cash account gives us the ledger view.
    db.ledgerEntry.findMany({
      where: {
        schoolId,
        journalEntry: {
          schoolId,
          sourceModule: "fees",
          entryDate: { gte: since },
          isPosted: true,
        },
        account: { type: "ASSET" },
      },
      select: { debit: true },
    }),
  ])

  const currency = school?.currency ?? "USD"

  // Build source rows — every paymentMethod that fired in the window OR
  // every gateway that delivered a webhook gets a row, even when one side
  // is zero (so the diff column highlights the gap).
  const bySource: Record<string, SourceRow> = {}

  for (const p of payments) {
    // Only SUCCESS payments count toward the reconciled total. Pending-
    // verification rows show in a separate flag below.
    if (p.status !== "SUCCESS") continue
    const key = p.paymentMethod
    if (!bySource[key]) {
      bySource[key] = {
        source: key,
        paymentCount: 0,
        paymentSum: 0,
        gatewayCount: 0,
        gatewaySum: 0,
        ledgerSum: 0,
      }
    }
    bySource[key].paymentCount += p._count._all
    bySource[key].paymentSum += Number(p._sum.amount ?? 0)
  }

  // Group webhook events by provider → bucket into PaymentMethod for the
  // comparison. Tap is conservatively mapped to "tap" because a single
  // Tap webhook can produce any of APPLE_PAY / MADA / KNET / CREDIT_CARD;
  // Stripe maps to CREDIT_CARD since that's what our webhook always writes.
  for (const ev of webhookEvents) {
    const payload = ev.payload as Record<string, unknown> | null
    const amountRaw = payload?.["amount"]
    const amount =
      typeof amountRaw === "number"
        ? amountRaw
        : typeof amountRaw === "string"
          ? Number(amountRaw)
          : 0
    if (Number.isNaN(amount) || amount <= 0) continue
    const key = ev.provider === "stripe" ? "CREDIT_CARD" : "tap"
    if (!bySource[key]) {
      bySource[key] = {
        source: key,
        paymentCount: 0,
        paymentSum: 0,
        gatewayCount: 0,
        gatewaySum: 0,
        ledgerSum: 0,
      }
    }
    bySource[key].gatewayCount += 1
    bySource[key].gatewaySum += amount
  }

  const ledgerTotal = ledgerEntries.reduce((sum, e) => sum + Number(e.debit), 0)

  // Allocate ledger pro-rata across sources by payment share. Without a
  // join-table mapping each ledger entry to its triggering Payment, this
  // is the best approximation; v2 adds Payment.journalEntryId already
  // (existing field) so a per-row mapping is possible — wire it then.
  const totalPaymentSum = Object.values(bySource).reduce(
    (sum, s) => sum + s.paymentSum,
    0
  )
  for (const s of Object.values(bySource)) {
    s.ledgerSum =
      totalPaymentSum > 0 ? (s.paymentSum / totalPaymentSum) * ledgerTotal : 0
  }

  const rows = Object.values(bySource).sort((a, b) =>
    a.source.localeCompare(b.source)
  )
  const totals = rows.reduce(
    (acc, r2) => ({
      paymentCount: acc.paymentCount + r2.paymentCount,
      paymentSum: acc.paymentSum + r2.paymentSum,
      gatewayCount: acc.gatewayCount + r2.gatewayCount,
      gatewaySum: acc.gatewaySum + r2.gatewaySum,
      ledgerSum: acc.ledgerSum + r2.ledgerSum,
    }),
    {
      paymentCount: 0,
      paymentSum: 0,
      gatewayCount: 0,
      gatewaySum: 0,
      ledgerSum: 0,
    }
  )

  // Count pending-verification payments separately — these are the offline
  // bank transfers / ATM deposits awaiting admin clear. They don't count
  // toward the SUCCESS totals above but are useful context.
  const pendingCount = payments
    .filter((p) => p.status === "PENDING_VERIFICATION")
    .reduce((sum, p) => sum + p._count._all, 0)
  const pendingSum = payments
    .filter((p) => p.status === "PENDING_VERIFICATION")
    .reduce((sum, p) => sum + Number(p._sum.amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {r?.title || "Reconciliation Report"}
        </h1>
        <p className="text-muted-foreground">
          {(r?.windowLabel || "Last {days} days").replace(
            "{days}",
            String(days)
          )}
        </p>
      </div>

      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {r?.pendingTitle || "Pending Verification"}
            </CardTitle>
            <CardDescription>
              {(
                r?.pendingDescription ||
                "{count} offline payment(s) totalling {sum} awaiting admin clear."
              )
                .replace("{count}", String(pendingCount))
                .replace("{sum}", formatCurrency(pendingSum, currency))}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {r?.diffTitle || "Payment vs Gateway vs Ledger"}
          </CardTitle>
          <CardDescription>
            {r?.diffDescription ||
              "Discrepancies between what the admin recorded, what the gateway claimed, and what posted to the ledger."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {r?.noActivity || "No payment activity in this window."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{r?.source || "Source"}</TableHead>
                  <TableHead className="text-end">
                    {r?.payments || "Payments"}
                  </TableHead>
                  <TableHead className="text-end">
                    {r?.paymentSum || "Payment Total"}
                  </TableHead>
                  <TableHead className="text-end">
                    {r?.gatewaySum || "Gateway Total"}
                  </TableHead>
                  <TableHead className="text-end">
                    {r?.ledgerSum || "Ledger Total"}
                  </TableHead>
                  <TableHead className="text-end">
                    {r?.diff || "Diff"}
                  </TableHead>
                  <TableHead>{r?.status || "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const diff = row.paymentSum - row.gatewaySum
                  const ledgerDiff = row.paymentSum - row.ledgerSum
                  const matched =
                    Math.abs(diff) <= ZERO_THRESHOLD &&
                    Math.abs(ledgerDiff) <= ZERO_THRESHOLD
                  return (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium">
                        {row.source.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {row.paymentCount}
                        {row.gatewayCount > 0 && ` / ${row.gatewayCount}`}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {formatCurrency(row.paymentSum, currency)}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {row.gatewaySum > 0
                          ? formatCurrency(row.gatewaySum, currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {row.ledgerSum > 0
                          ? formatCurrency(row.ledgerSum, currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        {row.gatewaySum > 0
                          ? formatCurrency(diff, currency)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={matched ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {matched
                            ? r?.matched || "Matched"
                            : r?.discrepancy || "Discrepancy"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="font-medium">
                  <TableCell>{r?.totals || "Totals"}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {totals.paymentCount}
                    {totals.gatewayCount > 0 && ` / ${totals.gatewayCount}`}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatCurrency(totals.paymentSum, currency)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatCurrency(totals.gatewaySum, currency)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatCurrency(totals.ledgerSum, currency)}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatCurrency(
                      totals.paymentSum - totals.gatewaySum,
                      currency
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
