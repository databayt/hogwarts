// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ONE-TIME DATA MIGRATION — ledger cents → whole units
 * =====================================================
 *
 * WHY
 *   The finance posting rules used to wrap every amount in `toCents()` (× 100)
 *   before writing it to `LedgerEntry.debit/credit`, which is `Decimal(12,2)`
 *   WHOLE currency units (Payment.amount is whole units; banking/reconciliation
 *   reads the ledger raw and compares it to Payment sums). So the live ledger
 *   (postFeePayment via Stripe/Tap, postWalletTopup, postFeeAssignment) was
 *   inflated 100×. Commit 916327882 dropped `toCents`, so NEW postings are
 *   whole units. This script corrects the EXISTING inflated rows so prod is not
 *   left with a mix of 100× and 1× entries.
 *
 * SCOPE (deliberately a positive allowlist)
 *   Only `LedgerEntry` rows whose `JournalEntry.sourceModule` is one of the
 *   posting-rule modules that used `toCents` (see INFLATED_MODULES). Manual
 *   journal entries (sourceModule "MANUAL", entered by accountants in whole
 *   units via accounts/) are NEVER touched.
 *
 * WHAT IT DOES (per school, in one transaction, only when APPLY=1)
 *   1. Divides debit/credit by 100 for the in-scope LedgerEntry rows.
 *   2. RECOMPUTES `AccountBalance` from the corrected, posted ledger — it is a
 *      derived aggregate (per account + entryDate signed delta, debit-normal for
 *      ASSET/EXPENSE), so it cannot be naively ÷100'd. The recompute mirrors the
 *      engine in `lib/accounting/utils.ts:createJournalEntry`.
 *
 * SAFETY — READ BEFORE RUNNING
 *   • This is NOT idempotent. Running APPLY twice divides by 10,000. Run it
 *     EXACTLY ONCE per environment.
 *   • DRY_RUN is the default — it only reports. You must set APPLY=1 to write.
 *   • ALWAYS run Neon-branch-first:
 *        1. neon branches create  (snapshot of prod)
 *        2. point DATABASE_URL at the branch, run DRY_RUN, eyeball the magnitudes
 *           (a fee payment debit of 500000 is inflated; 5000 is already correct)
 *        3. APPLY=1 on the branch, then verify:
 *             - every posted JournalEntry still balances (debits == credits)
 *             - reconciliation (/finance/banking/reconciliation) ledger ≈ payments
 *             - trial balance is sane
 *        4. only then repeat APPLY=1 against prod, and DELETE the branch.
 *
 * USAGE
 *   tsx scripts/migrate-ledger-cents-to-whole-units.ts            # dry run, all schools
 *   SCHOOL_ID=<id> tsx scripts/migrate-ledger-cents-to-whole-units.ts
 *   APPLY=1 tsx scripts/migrate-ledger-cents-to-whole-units.ts    # WRITE (after branch-first)
 */

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

// Posting-rule sourceModule values that ran through toCents(). Lowercase to
// match the SourceModule enum the rules emit; "MANUAL" is intentionally absent.
const INFLATED_MODULES = ["fees", "payroll", "expenses", "invoice", "wallet"]

const APPLY = process.env.APPLY === "1"
const ONLY_SCHOOL = process.env.SCHOOL_ID || null

const isDebitNormal = (type: string) => type === "ASSET" || type === "EXPENSE"
const n = (d: unknown) => Number(d as never)

async function migrateSchool(schoolId: string, label: string) {
  const inScope = {
    schoolId,
    journalEntry: { sourceModule: { in: INFLATED_MODULES } },
  }

  const lines = await db.ledgerEntry.findMany({
    where: inScope,
    select: {
      debit: true,
      credit: true,
      journalEntry: { select: { sourceModule: true } },
    },
  })

  const manualCount = await db.journalEntry.count({
    where: { schoolId, sourceModule: { notIn: INFLATED_MODULES } },
  })

  if (lines.length === 0) {
    console.log(`  [${label}] no in-scope ledger rows — nothing to do.`)
    return { school: label, lines: 0, applied: false }
  }

  const debitSum = lines.reduce((s, l) => s + n(l.debit), 0)
  const creditSum = lines.reduce((s, l) => s + n(l.credit), 0)
  const byModule = INFLATED_MODULES.map((m) => {
    const c = lines.filter((l) => l.journalEntry.sourceModule === m).length
    return c ? `${m}:${c}` : null
  })
    .filter(Boolean)
    .join(" ")

  console.log(`  [${label}] in-scope lines=${lines.length} (${byModule})`)
  console.log(
    `            current debit Σ=${debitSum.toLocaleString()} credit Σ=${creditSum.toLocaleString()}` +
      ` → after ÷100 debit Σ=${(debitSum / 100).toLocaleString()} credit Σ=${(creditSum / 100).toLocaleString()}`
  )
  if (manualCount > 0) {
    console.log(
      `            note: ${manualCount} non-scope (manual/other) journal entries left untouched.`
    )
  }

  if (!APPLY) {
    console.log(
      `            DRY RUN — no changes written. Set APPLY=1 to write.`
    )
    return { school: label, lines: lines.length, applied: false }
  }

  await db.$transaction(async (tx) => {
    // 1. Deflate the in-scope ledger rows.
    await tx.$executeRaw`
      UPDATE "LedgerEntry" le
      SET debit = le.debit / 100, credit = le.credit / 100
      FROM "JournalEntry" je
      WHERE le."journalEntryId" = je.id
        AND le."schoolId" = ${schoolId}
        AND je."sourceModule" = ANY(${INFLATED_MODULES})
    `

    // 2. Recompute AccountBalance from the corrected, posted ledger.
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
    `            ✓ APPLIED — ${lines.length} rows deflated, balances recomputed.`
  )
  return { school: label, lines: lines.length, applied: true }
}

async function main() {
  console.log("")
  console.log("ledger cents → whole-units migration")
  console.log(APPLY ? "  MODE: APPLY (writing)" : "  MODE: DRY RUN (no writes)")
  console.log(
    "  ⚠ NOT idempotent — run exactly once per environment, Neon-branch-first.\n"
  )

  const schools = await db.school.findMany({
    where: ONLY_SCHOOL ? { id: ONLY_SCHOOL } : {},
    select: { id: true, name: true },
  })

  const results = []
  for (const s of schools) {
    results.push(await migrateSchool(s.id, s.name ?? s.id))
  }

  const applied = results.filter((r) => r.applied).length
  const touched = results.reduce((sum, r) => sum + (r.applied ? r.lines : 0), 0)
  console.log(
    `\nDone. schools=${schools.length} ${APPLY ? `applied=${applied} rowsDeflated=${touched}` : "(dry run)"}\n`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
