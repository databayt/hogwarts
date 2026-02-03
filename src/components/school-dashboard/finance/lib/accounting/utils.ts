/**
 * Accounting Integration Utilities
 *
 * Core utilities for double-entry bookkeeping
 */

import { db } from "@/lib/db"

import type {
  AccountBalance,
  JournalEntryInput,
  JournalEntryLine,
  PostingResult,
} from "./types"
import { AccountType } from "./types"

/**
 * Validate that debits equal credits
 */
export function validateDoubleEntry(lines: JournalEntryLine[]): boolean {
  const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0)

  // Allow for minor rounding differences (1 cent)
  return Math.abs(totalDebits - totalCredits) < 1
}

/**
 * Generate next journal entry number
 */
export async function generateEntryNumber(
  schoolId: string,
  fiscalYearId: string
): Promise<string> {
  const fiscalYear = await db.fiscalYear.findUnique({
    where: { id: fiscalYearId },
    select: { name: true },
  })

  const count = await db.journalEntry.count({
    where: { schoolId, fiscalYearId },
  })

  // Extract year from name format "FY 2024-2025" -> "2024"
  const yearCode =
    fiscalYear?.name?.match(/\d{4}/)?.[0] || new Date().getFullYear().toString()
  const sequence = String(count + 1).padStart(6, "0")

  return `JE-${yearCode}-${sequence}`
}

/**
 * Create journal entry with ledger entries
 */
export async function createJournalEntry(
  schoolId: string,
  input: JournalEntryInput,
  createdBy: string
): Promise<PostingResult> {
  try {
    // Validate double entry
    if (!validateDoubleEntry(input.lines)) {
      return {
        success: false,
        errors: ["Debits do not equal credits. Journal entry must balance."],
      }
    }

    // Get or create fiscal year
    let fiscalYearId = input.fiscalYearId
    if (!fiscalYearId) {
      const currentYear = new Date().getFullYear()
      const fiscalYearName = `FY ${currentYear}-${currentYear + 1}`
      let fiscalYear = await db.fiscalYear.findFirst({
        where: {
          schoolId,
          name: fiscalYearName,
        },
      })

      if (!fiscalYear) {
        fiscalYear = await db.fiscalYear.create({
          data: {
            schoolId,
            name: fiscalYearName,
            startDate: new Date(currentYear, 0, 1),
            endDate: new Date(currentYear, 11, 31),
            isCurrent: true,
          },
        })
      }

      fiscalYearId = fiscalYear.id
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber(schoolId, fiscalYearId)

    // Create journal entry with ledger entries in a transaction
    const journalEntry = await db.$transaction(async (tx) => {
      // Create journal entry
      const entry = await tx.journalEntry.create({
        data: {
          schoolId,
          entryNumber,
          entryDate: input.entryDate,
          description: input.description,
          reference: input.reference,
          sourceModule: input.sourceModule,
          sourceRecordId: input.sourceRecordId,
          fiscalYearId,
          createdBy,
          isPosted: input.autoPost || false,
          postedAt: input.autoPost ? new Date() : null,
          postedBy: input.autoPost ? createdBy : null,
        },
      })

      // Create ledger entries
      for (const line of input.lines) {
        await tx.ledgerEntry.create({
          data: {
            schoolId,
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: line.debit,
            credit: line.credit,
            description: line.description || input.description,
          },
        })
      }

      // Update account balances if posted
      if (input.autoPost) {
        for (const line of input.lines) {
          const account = await tx.chartOfAccount.findUnique({
            where: { id: line.accountId },
          })

          if (!account) continue

          // Determine if account has normal debit balance
          const isDebitNormal = [
            AccountType.ASSET,
            AccountType.EXPENSE,
          ].includes(account.type as AccountType)

          const debitChange = line.debit
          const creditChange = line.credit

          let balanceChange: number
          if (isDebitNormal) {
            balanceChange = debitChange - creditChange
          } else {
            balanceChange = creditChange - debitChange
          }

          // Update or create account balance
          const asOfDate = input.entryDate
          const existingBalance = await tx.accountBalance.findFirst({
            where: {
              schoolId,
              accountId: line.accountId,
              asOfDate,
            },
          })

          if (existingBalance) {
            await tx.accountBalance.update({
              where: { id: existingBalance.id },
              data: {
                balance: Number(existingBalance.balance) + balanceChange,
              },
            })
          } else {
            await tx.accountBalance.create({
              data: {
                schoolId,
                accountId: line.accountId,
                asOfDate,
                balance: balanceChange,
              },
            })
          }
        }
      }

      return entry
    })

    return {
      success: true,
      journalEntryId: journalEntry.id,
    }
  } catch (error) {
    console.error("Error creating journal entry:", error)
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    }
  }
}

/**
 * Post an unposted journal entry
 */
export async function postJournalEntry(
  journalEntryId: string,
  postedBy: string
): Promise<PostingResult> {
  try {
    const entry = await db.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { ledgerEntries: true },
    })

    if (!entry) {
      return {
        success: false,
        errors: ["Journal entry not found"],
      }
    }

    if (entry.isPosted) {
      return {
        success: false,
        errors: ["Journal entry is already posted"],
      }
    }

    await db.$transaction(async (tx) => {
      // Mark as posted
      await tx.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          isPosted: true,
          postedAt: new Date(),
          postedBy,
        },
      })

      // Update account balances
      for (const ledgerEntry of entry.ledgerEntries) {
        const account = await tx.chartOfAccount.findUnique({
          where: { id: ledgerEntry.accountId },
        })

        if (!account) continue

        const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
          account.type as AccountType
        )

        let balanceChange: number
        if (isDebitNormal) {
          balanceChange = Number(ledgerEntry.debit) - Number(ledgerEntry.credit)
        } else {
          balanceChange = Number(ledgerEntry.credit) - Number(ledgerEntry.debit)
        }

        const asOfDate = entry.entryDate
        const existingBalance = await tx.accountBalance.findFirst({
          where: {
            schoolId: entry.schoolId,
            accountId: ledgerEntry.accountId,
            asOfDate,
          },
        })

        if (existingBalance) {
          await tx.accountBalance.update({
            where: { id: existingBalance.id },
            data: {
              balance: Number(existingBalance.balance) + balanceChange,
            },
          })
        } else {
          await tx.accountBalance.create({
            data: {
              schoolId: entry.schoolId,
              accountId: ledgerEntry.accountId,
              asOfDate,
              balance: balanceChange,
            },
          })
        }
      }
    })

    return {
      success: true,
      journalEntryId: entry.id,
    }
  } catch (error) {
    console.error("Error posting journal entry:", error)
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    }
  }
}

/**
 * Reverse a journal entry
 */
export async function reverseJournalEntry(
  journalEntryId: string,
  reversedBy: string,
  reason: string
): Promise<PostingResult> {
  try {
    const originalEntry = await db.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: { ledgerEntries: { include: { account: true } } },
    })

    if (!originalEntry) {
      return {
        success: false,
        errors: ["Original journal entry not found"],
      }
    }

    if (!originalEntry.isPosted) {
      return {
        success: false,
        errors: ["Cannot reverse an unposted entry"],
      }
    }

    if (originalEntry.isReversed) {
      return {
        success: false,
        errors: ["Entry is already reversed"],
      }
    }

    // Create reversing entry
    const reversingLines: JournalEntryLine[] = originalEntry.ledgerEntries.map(
      (line) => ({
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        debit: Number(line.credit), // Swap debits and credits
        credit: Number(line.debit),
        description: `Reversal: ${line.description}`,
      })
    )

    const reversingEntry = await createJournalEntry(
      originalEntry.schoolId,
      {
        entryDate: new Date(),
        description: `REVERSAL: ${originalEntry.description} - ${reason}`,
        reference: originalEntry.entryNumber,
        sourceModule: originalEntry.sourceModule as any,
        sourceRecordId: originalEntry.sourceRecordId || undefined,
        lines: reversingLines,
        fiscalYearId: originalEntry.fiscalYearId,
        autoPost: true,
      },
      reversedBy
    )

    if (reversingEntry.success) {
      // Mark original as reversed
      await db.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          isReversed: true,
          reversedAt: new Date(),
          reversalEntryId: reversingEntry.journalEntryId,
        },
      })
    }

    return reversingEntry
  } catch (error) {
    console.error("Error reversing journal entry:", error)
    return {
      success: false,
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    }
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  schoolId: string,
  accountId: string,
  fiscalYearId: string
): Promise<number> {
  // Get fiscal year to find date range
  const fiscalYear = await db.fiscalYear.findUnique({
    where: { id: fiscalYearId },
    select: { startDate: true, endDate: true },
  })

  if (!fiscalYear) return 0

  // Get latest balance within fiscal year
  const balance = await db.accountBalance.findFirst({
    where: {
      schoolId,
      accountId,
      asOfDate: {
        gte: fiscalYear.startDate,
        lte: fiscalYear.endDate,
      },
    },
    orderBy: {
      asOfDate: "desc",
    },
  })

  return Number(balance?.balance || 0)
}

/**
 * Calculate trial balance
 */
export async function calculateTrialBalance(
  schoolId: string,
  fiscalYearId: string
): Promise<AccountBalance[]> {
  // Get fiscal year to find date range
  const fiscalYear = await db.fiscalYear.findUnique({
    where: { id: fiscalYearId },
    select: { startDate: true, endDate: true },
  })

  if (!fiscalYear) return []

  // Get all accounts with their latest balances within fiscal year
  const accounts = await db.chartOfAccount.findMany({
    where: { schoolId, isActive: true },
  })

  const balancePromises = accounts.map(async (account) => {
    const balance = await db.accountBalance.findFirst({
      where: {
        schoolId,
        accountId: account.id,
        asOfDate: {
          gte: fiscalYear.startDate,
          lte: fiscalYear.endDate,
        },
      },
      orderBy: {
        asOfDate: "desc",
      },
    })

    const isDebitNormal = [AccountType.ASSET, AccountType.EXPENSE].includes(
      account.type as AccountType
    )

    const netBalance = Number(balance?.balance || 0)

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      debitBalance: isDebitNormal && netBalance > 0 ? netBalance : 0,
      creditBalance: !isDebitNormal && netBalance > 0 ? netBalance : 0,
      netBalance,
      isDebitNormal,
    }
  })

  return Promise.all(balancePromises)
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100)
}

/**
 * Convert to cents (smallest currency unit)
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convert from cents to dollars
 */
export function fromCents(cents: number): number {
  return cents / 100
}
