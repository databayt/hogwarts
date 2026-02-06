/**
 * Banking Seed
 * Creates Bank Accounts and Transactions
 *
 * Phase 11: Banking
 */

import type { PrismaClient } from "@prisma/client"

import type { UserRef } from "./types"
import { logPhase, logSuccess, randomElement, randomNumber } from "./utils"

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

const BANK_ACCOUNTS = [
  {
    name: "حساب التشغيل", // EN: "Operating Account"
    officialName: "حساب تشغيل المدرسة التجريبية",
    bankName: "بنك الخرطوم",
    type: "depository",
    subtype: "checking",
    currentBalance: 500000,
    availableBalance: 485000,
  },
  {
    name: "حساب الادخار", // EN: "Savings Account"
    officialName: "صندوق احتياطي المدرسة التجريبية",
    bankName: "بنك الخرطوم",
    type: "depository",
    subtype: "savings",
    currentBalance: 1500000,
    availableBalance: 1500000,
  },
  {
    name: "الصندوق الصغير", // EN: "Petty Cash"
    officialName: "صندوق المصروفات النثرية",
    bankName: "داخلي",
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

// ============================================================================
// TRANSACTIONS
// ============================================================================

const TRANSACTION_CATEGORIES = [
  // Credit (income)
  { name: "رسوم دراسية", category: "tuition", type: "credit" },
  { name: "رسوم تسجيل", category: "registration", type: "credit" },
  { name: "رسوم أنشطة", category: "activities", type: "credit" },
  { name: "مبيعات مقصف", category: "cafeteria", type: "credit" },
  { name: "تبرعات", category: "donation", type: "credit" },
  // Debit (expenses)
  { name: "رواتب المعلمين", category: "salary", type: "debit" },
  { name: "رواتب الموظفين", category: "salary", type: "debit" },
  { name: "فاتورة كهرباء", category: "utilities", type: "debit" },
  { name: "فاتورة مياه", category: "utilities", type: "debit" },
  { name: "صيانة مباني", category: "maintenance", type: "debit" },
  { name: "مستلزمات مكتبية", category: "supplies", type: "debit" },
  { name: "كتب ومراجع", category: "educational", type: "debit" },
  { name: "معدات مختبر", category: "equipment", type: "debit" },
  { name: "خدمات إنترنت", category: "technology", type: "debit" },
  { name: "نقل مدرسي", category: "transport", type: "debit" },
]

const MERCHANT_NAMES = [
  "مكتبة النيل الأزرق",
  "شركة الخرطوم للكهرباء",
  "شركة المياه الوطنية",
  "مؤسسة التقنية الحديثة",
  "شركة الصيانة المتكاملة",
  "مطبعة السودان",
  "شركة النقل المدرسي",
  "مؤسسة الإمداد التعليمي",
]

/**
 * Seed bank transactions (~100 over 3 months)
 */
async function seedBankTransactions(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  // Get existing bank accounts
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { schoolId },
    select: { id: true, accountId: true, name: true },
  })

  if (bankAccounts.length === 0) return 0

  // Clean existing transactions
  await prisma.transaction.deleteMany({ where: { schoolId } })

  const operatingAccount = bankAccounts[0] // Primary account
  const transactions: Array<{
    schoolId: string
    accountId: string
    bankAccountId: string
    name: string
    amount: number
    date: Date
    paymentChannel: string
    category: string
    subcategory: string | null
    type: string
    pending: boolean
    merchantName: string | null
    isoCurrencyCode: string
  }> = []

  // Generate ~100 transactions over Oct-Dec 2025
  for (let i = 0; i < 100; i++) {
    const template = TRANSACTION_CATEGORIES[i % TRANSACTION_CATEGORIES.length]
    const dayOffset = Math.floor((i / 100) * 90) // Spread over 90 days
    const date = new Date("2025-10-01")
    date.setDate(date.getDate() + dayOffset)

    // Amount ranges by type
    let amount: number
    if (template.type === "credit") {
      amount =
        template.category === "tuition"
          ? randomNumber(15000, 28000)
          : randomNumber(500, 5000)
    } else {
      amount =
        template.category === "salary"
          ? randomNumber(80000, 250000)
          : randomNumber(1000, 15000)
    }

    const channel =
      template.type === "credit"
        ? randomElement(["online", "in_store"])
        : randomElement(["online", "other"])

    transactions.push({
      schoolId,
      accountId: operatingAccount.accountId,
      bankAccountId: operatingAccount.id,
      name: template.name,
      amount,
      date,
      paymentChannel: channel,
      category: template.category,
      subcategory: null,
      type: template.type,
      pending: i >= 95, // Last 5 are pending
      merchantName:
        template.type === "debit"
          ? MERCHANT_NAMES[i % MERCHANT_NAMES.length]
          : null,
      isoCurrencyCode: "SDG",
    })
  }

  // Insert in batches
  let totalCreated = 0
  for (let i = 0; i < transactions.length; i += 50) {
    const batch = transactions.slice(i, i + 50)
    const result = await prisma.transaction.createMany({
      data: batch,
      skipDuplicates: true,
    })
    totalCreated += result.count
  }

  logSuccess("Transactions", totalCreated, "Oct-Dec 2025, SDG")
  return totalCreated
}

/**
 * Seed all banking data
 */
export async function seedBanking(
  prisma: PrismaClient,
  schoolId: string,
  adminUsers: UserRef[]
): Promise<number> {
  const accountCount = await seedBankAccounts(prisma, schoolId, adminUsers)
  await seedBankTransactions(prisma, schoolId)
  return accountCount
}
