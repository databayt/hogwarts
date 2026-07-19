// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Wallet Seed
 * Creates the school wallet plus student/guardian wallets with a short
 * top-up / fee-payment transaction history each, so every /finance/wallet
 * route renders real data. Was the last finance sub-module with zero seed
 * coverage (all wallet pages showed empty states).
 *
 * Phase 12b: Wallets (after Banking)
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, UserRef } from "./types"
import { logPhase, logSuccess, randomElement, randomNumber } from "./utils"

// Descriptions are stored in Arabic — the demo school's storage language.
const CREDIT_DESCRIPTIONS = [
  "شحن المحفظة عبر التحويل البنكي",
  "شحن المحفظة نقدًا في مكتب المدرسة",
  "استرداد رصيد من رسوم ملغاة",
  "إيداع من ولي الأمر",
]

const DEBIT_DESCRIPTIONS = [
  "سداد قسط الرسوم الدراسية",
  "رسوم النقل المدرسي",
  "رسوم الأنشطة اللاصفية",
  "شراء زي مدرسي",
]

export async function seedWallets(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<void> {
  logPhase(12, "Wallets", "School + student wallets with transaction history")

  // Idempotency count-guard — safe to re-run the full seed.
  const existing = await prisma.wallet.count({ where: { schoolId } })
  if (existing > 0) {
    logSuccess("Wallets already seeded — skipping", existing)
    return
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { currency: true },
  })
  const currency = school?.currency ?? "SDG"
  const createdBy = adminUsers[0]?.id ?? "seed"

  let walletCount = 0
  let txnCount = 0

  const createWalletWithHistory = async (
    walletType: "SCHOOL" | "STUDENT" | "PARENT",
    ownerId: string,
    targetBalance: number
  ) => {
    // Build history first: top-ups followed by spends, then reconcile the
    // final CREDIT so running balance ends exactly at targetBalance ≥ 0.
    const txns: { type: "CREDIT" | "DEBIT"; amount: number; desc: string }[] =
      []
    const txnTotal = randomNumber(3, 6)
    let balance = 0
    for (let i = 0; i < txnTotal; i++) {
      const credit = i === 0 || Math.random() < 0.5
      const amount = credit
        ? randomNumber(20, 120) * 50
        : Math.min(randomNumber(5, 40) * 50, balance)
      if (amount <= 0) continue
      balance += credit ? amount : -amount
      txns.push({
        type: credit ? "CREDIT" : "DEBIT",
        amount,
        desc: credit
          ? randomElement(CREDIT_DESCRIPTIONS)
          : randomElement(DEBIT_DESCRIPTIONS),
      })
    }
    if (balance < targetBalance) {
      txns.push({
        type: "CREDIT",
        amount: targetBalance - balance,
        desc: CREDIT_DESCRIPTIONS[0],
      })
      balance = targetBalance
    }

    const wallet = await prisma.wallet.upsert({
      where: {
        schoolId_walletType_ownerId: { schoolId, walletType, ownerId },
      },
      update: {},
      create: { schoolId, walletType, ownerId, balance, currency },
    })
    walletCount++

    let running = 0
    const start = new Date()
    start.setMonth(start.getMonth() - 3)
    for (let i = 0; i < txns.length; i++) {
      const t = txns[i]
      running += t.type === "CREDIT" ? t.amount : -t.amount
      const at = new Date(start)
      at.setDate(start.getDate() + i * randomNumber(4, 12))
      await prisma.walletTransaction.create({
        data: {
          schoolId,
          walletId: wallet.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: running,
          description: t.desc,
          sourceModule: t.type === "CREDIT" ? "topup" : "fees",
          createdBy,
          createdAt: at,
        },
      })
      txnCount++
    }
  }

  // One school wallet + wallets for a sample of students (their user id is
  // the owner per the Wallet.ownerId convention).
  await createWalletWithHistory("SCHOOL", schoolId, 250000)

  const sample = students.filter((s) => s.userId).slice(0, 30)
  for (const student of sample) {
    await createWalletWithHistory(
      "STUDENT",
      student.userId,
      randomNumber(0, 60) * 50
    )
  }

  logSuccess("Wallets", walletCount, `${txnCount} transactions, ${currency}`)
}
