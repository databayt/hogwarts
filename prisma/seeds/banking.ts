/**
 * Banking Seed
 * Creates Bank Accounts and Transactions
 *
 * Phase 11: Banking
 */

import type { PrismaClient } from "@prisma/client"

import type { UserRef } from "./types"
import { logPhase, logSuccess } from "./utils"

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

const BANK_ACCOUNTS = [
  {
    name: "Operating Account",
    nameAr: "حساب التشغيل",
    officialName: "Hogwarts Academy Operating Account",
    bankName: "Bank of Khartoum",
    type: "depository",
    subtype: "checking",
    currentBalance: 500000,
    availableBalance: 485000,
  },
  {
    name: "Savings Account",
    nameAr: "حساب الادخار",
    officialName: "Hogwarts Academy Reserve Fund",
    bankName: "Bank of Khartoum",
    type: "depository",
    subtype: "savings",
    currentBalance: 1500000,
    availableBalance: 1500000,
  },
  {
    name: "Petty Cash",
    nameAr: "الصندوق الصغير",
    officialName: "Petty Cash Fund",
    bankName: "Internal",
    type: "depository",
    subtype: "cash",
    currentBalance: 10000,
    availableBalance: 10000,
  },
]

// ============================================================================
// BANKING SEEDING
// ============================================================================

/**
 * Seed bank accounts
 */
export async function seedBankAccounts(
  prisma: PrismaClient,
  schoolId: string,
  adminUsers: UserRef[]
): Promise<number> {
  logPhase(11, "BANKING", "البنوك والحسابات")

  let count = 0
  const adminUser = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]

  for (const account of BANK_ACCOUNTS) {
    try {
      // Generate unique IDs for bank integration fields
      const bankId = `bank_${account.name.toLowerCase().replace(/\s+/g, "_")}`
      const accountId = `acc_${Date.now()}_${count}`

      await prisma.bankAccount.upsert({
        where: {
          schoolId_accountId: {
            schoolId,
            accountId,
          },
        },
        update: {
          name: account.name,
          officialName: account.officialName,
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
        },
        create: {
          schoolId,
          userId: adminUser.id,
          bankId,
          accountId,
          accessToken: "demo_access_token", // Placeholder for demo
          institutionId: "bk_sudan",
          name: account.name,
          officialName: account.officialName,
          mask: "****1234",
          currentBalance: account.currentBalance,
          availableBalance: account.availableBalance,
          type: account.type,
          subtype: account.subtype,
        },
      })
      count++
    } catch {
      // Skip if account already exists
    }
  }

  logSuccess("Bank Accounts", count, "Operating, Savings, Petty Cash")

  return count
}

/**
 * Seed all banking data
 */
export async function seedBanking(
  prisma: PrismaClient,
  schoolId: string,
  adminUsers: UserRef[]
): Promise<number> {
  return await seedBankAccounts(prisma, schoolId, adminUsers)
}
