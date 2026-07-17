// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ONE-TIME, SELF-VERIFYING MIGRATION — deflate any toCents-inflated ledger rows
 * ============================================================================
 *
 * BACKGROUND
 *   The finance posting rules used to wrap amounts in toCents() (× 100) before
 *   writing LedgerEntry.debit/credit, which is Decimal(12,2) WHOLE units. Commit
 *   916327882 dropped toCents, so NEW postings are whole units. This script
 *   corrects any EXISTING rows the old code inflated.
 *
 * SCOPE — narrow on purpose, proven against the source record (no guessing)
 *   Only the WIRED posting rules can ever have written real inflated rows, and
 *   only `postFeePayment` (sourceModule='fees', sourceRecordId = Payment.id) has
 *   a verifiable money source. So this script ONLY considers fees JournalEntries
 *   that carry a `sourceRecordId`, joins the Payment, and deflates an entry IFF
 *   its cash-leg debit equals Payment.amount × 100. A row already at × 1 (or any
 *   row that does not match exactly) is LEFT UNTOUCHED. This makes the script:
 *     • safe against seeded/demo ledger data (those rows have sourceRecordId=NULL
 *       and are skipped entirely), and
 *     • idempotent (a correct row never matches the ×100 condition).
 *
 *   IMPORTANT — verified on prod (square-hall-52214783) 2026-06-20: all 200
 *   journal entries have sourceRecordId=NULL (seeded whole-unit demo data), so
 *   ZERO rows are inflated and this script is currently a NO-OP. It exists as a
 *   safety net for any real fee payment that posts through the OLD code before
 *   the toCents fix deploys.
 *
 *   Scope re-verified 2026-07-17 — the original note said expenses/payroll were
 *   out of scope because their posters were "orphaned". That premise is stale
 *   (they were wired the next day, 2026-06-21: 5b789ec28 / 771166fc7), but the
 *   conclusion still holds for a better reason: the toCents fix (916327882)
 *   landed 2026-06-20, BEFORE any of those posters could run, so they have never
 *   written an inflated row. `toCents` now has zero production callers.
 *   postWalletTopup and postSalaryPayment additionally cannot run at all —
 *   nothing invokes topupWallet/processPayments (no UI, no cron, no API route).
 *   If a disbursement or wallet-top-up UI is ever built, they still cannot
 *   inflate (toCents is gone); this script stays fees-scoped by design.
 *
 * WHAT IT DOES (per school, in one transaction, only when APPLY=1)
 *   1. For each fees JournalEntry with a sourceRecordId whose cash-leg debit ==
 *      Payment.amount × 100, divides every line of that entry by 100.
 *   2. Recomputes AccountBalance from the corrected, posted ledger (per account +
 *      entryDate signed delta, debit-normal for ASSET/EXPENSE) — mirrors
 *      lib/accounting/utils.ts:createJournalEntry. The cache can't be naively
 *      ÷100'd because it also aggregates whole-unit seeded entries.
 *
 * SAFETY
 *   • DRY_RUN is the default — only reports. Set APPLY=1 to write.
 *   • Per-row verification means it cannot corrupt correct data; still, run it
 *     Neon-branch-first (snapshot → dry run → apply on branch → verify every
 *     posted entry balances + reconciliation ledger ≈ payments → apply prod →
 *     delete branch).
 *   • Target DB resolves from MIGRATION_DATABASE_URL if set (preferred — explicit),
 *     else DATABASE_URL. The chosen URL host is printed so you can confirm it is
 *     the intended branch/prod before APPLY.
 *
 * USAGE
 *   tsx scripts/migrate-ledger-cents-to-whole-units.ts                 # dry run
 *   MIGRATION_DATABASE_URL=<branch-url> APPLY=1 tsx scripts/migrate-ledger-cents-to-whole-units.ts
 */

import { Prisma, PrismaClient } from "@prisma/client"

const TARGET_URL =
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL || ""

const clientOptions: Prisma.PrismaClientOptions = {}
if (process.env.MIGRATION_DATABASE_URL) {
  clientOptions.datasources = {
    db: { url: process.env.MIGRATION_DATABASE_URL },
  }
}
const db = new PrismaClient(clientOptions)

const APPLY = process.env.APPLY === "1"
const ONLY_SCHOOL = process.env.SCHOOL_ID || null

const isDebitNormal = (type: string) => type === "ASSET" || type === "EXPENSE"
const n = (d: unknown) => Number(d as never)
const hostOf = (url: string) =>
  url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown)"

async function migrateSchool(schoolId: string, label: string) {
  // fees posting-rule entries (sourceRecordId set) with their Payment + lines.
  const entries = await db.journalEntry.findMany({
    where: { schoolId, sourceModule: "fees", sourceRecordId: { not: null } },
    select: {
      id: true,
      sourceRecordId: true,
      ledgerEntries: {
        select: {
          id: true,
          debit: true,
          credit: true,
          account: { select: { code: true } },
        },
      },
    },
  })

  if (entries.length === 0) {
    console.log(`  [${label}] no fee posting-rule entries — nothing in scope.`)
    return { applied: 0 }
  }

  // Resolve the source Payment amounts in one query.
  const paymentIds = entries.map((e) => e.sourceRecordId!).filter(Boolean)
  const payments = await db.payment.findMany({
    where: { id: { in: paymentIds } },
    select: { id: true, amount: true },
  })
  const payAmount = new Map(payments.map((p) => [p.id, n(p.amount)]))

  const inflatedEntryIds: string[] = []
  for (const e of entries) {
    const amount = payAmount.get(e.sourceRecordId!)
    if (amount == null) continue
    // cash leg = the debit line (createFeePaymentEntry: DR cash, CR receivable)
    const cashDebit = Math.max(...e.ledgerEntries.map((l) => n(l.debit)), 0)
    if (Math.round(cashDebit) === Math.round(amount * 100) && amount > 0) {
      inflatedEntryIds.push(e.id)
    }
  }

  console.log(
    `  [${label}] fee posting-rule entries=${entries.length} verified-inflated=${inflatedEntryIds.length}`
  )

  if (inflatedEntryIds.length === 0 || !APPLY) {
    if (!APPLY && inflatedEntryIds.length > 0)
      console.log(
        `            DRY RUN — would deflate ${inflatedEntryIds.length} entries. Set APPLY=1.`
      )
    return { applied: 0 }
  }

  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "LedgerEntry"
      SET debit = debit / 100, credit = credit / 100
      WHERE "journalEntryId" = ANY(${inflatedEntryIds})
    `

    // Recompute AccountBalance from the corrected, posted ledger.
    const posted = await tx.ledgerEntry.findMany({
      where: { schoolId, journalEntry: { isPosted: true } },
      select: {
        debit: true,
        credit: true,
        accountId: true,
        account: { select: { type: true } },
        journalEntry: { select: { entryDate: true } },
      },
    })
    const acc = new Map<
      string,
      { accountId: string; asOfDate: Date; balance: number }
    >()
    for (const le of posted) {
      const key = `${le.accountId}__${le.journalEntry.entryDate.toISOString()}`
      const change = isDebitNormal(le.account.type)
        ? n(le.debit) - n(le.credit)
        : n(le.credit) - n(le.debit)
      const cur = acc.get(key) ?? {
        accountId: le.accountId,
        asOfDate: le.journalEntry.entryDate,
        balance: 0,
      }
      cur.balance += change
      acc.set(key, cur)
    }
    await tx.accountBalance.deleteMany({ where: { schoolId } })
    if (acc.size > 0) {
      await tx.accountBalance.createMany({
        data: [...acc.values()].map((v) => ({
          schoolId,
          accountId: v.accountId,
          balance: v.balance,
          asOfDate: v.asOfDate,
        })),
      })
    }
  })

  console.log(
    `            ✓ APPLIED — deflated ${inflatedEntryIds.length} entries, balances recomputed.`
  )
  return { applied: inflatedEntryIds.length }
}

async function main() {
  console.log("")
  console.log(
    "ledger cents → whole-units migration (self-verifying, fees-scoped)"
  )
  console.log(`  target DB host: ${hostOf(TARGET_URL)}`)
  console.log(APPLY ? "  MODE: APPLY (writing)" : "  MODE: DRY RUN (no writes)")
  console.log(
    "  only deflates fee entries whose cash leg == Payment.amount × 100.\n"
  )

  const schools = await db.school.findMany({
    where: ONLY_SCHOOL ? { id: ONLY_SCHOOL } : {},
    select: { id: true, name: true },
  })

  let total = 0
  for (const s of schools)
    total += (await migrateSchool(s.id, s.name ?? s.id)).applied
  console.log(
    `\nDone. schools=${schools.length} ${APPLY ? `entriesDeflated=${total}` : "(dry run)"}\n`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
