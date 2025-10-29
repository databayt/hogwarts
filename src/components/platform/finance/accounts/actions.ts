/**
 * Accounts Module - Server Actions
 * Server-side operations for chart of accounts, journal entries, and accounting reports
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { accountSchema, journalEntrySchema, fiscalYearSchema } from './validation'
import type { AccountActionResult, JournalEntryActionResult } from './types'
import { StandardAccountCodes, JOURNAL_ENTRY_NUMBER_FORMAT } from './config'

/**
 * Create Account
 * Creates a new account in the chart of accounts
 */
export async function createAccount(formData: FormData): Promise<AccountActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      code: formData.get('code'),
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description') || undefined,
      parentAccountId: formData.get('parentAccountId') || null,
      isActive: formData.get('isActive') === 'true',
    }

    const validated = accountSchema.parse(data)

    // Check if account code already exists
    const existing = await db.chartOfAccount.findFirst({
      where: {
        schoolId: session.user.schoolId,
        code: validated.code,
      },
    })

    if (existing) {
      return { success: false, error: 'Account code already exists' }
    }

    // Derive normalBalance from account type
    const { NormalBalance } = await import('./config')
    const normalBalance = NormalBalance[validated.type]

    const account = await db.chartOfAccount.create({
      data: {
        ...validated,
        normalBalance,
        schoolId: session.user.schoolId,
      },
    })

    revalidatePath('/finance/accounts')
    return { success: true, data: account as any }
  } catch (error) {
    console.error('Error creating account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create account' }
  }
}

/**
 * Update Account
 * Updates an existing account
 */
export async function updateAccount(accountId: string, formData: FormData): Promise<AccountActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      code: formData.get('code'),
      name: formData.get('name'),
      type: formData.get('type'),
      description: formData.get('description') || undefined,
      parentAccountId: formData.get('parentAccountId') || null,
      isActive: formData.get('isActive') === 'true',
    }

    const validated = accountSchema.parse(data)

    // Derive normalBalance from account type
    const { NormalBalance } = await import('./config')
    const normalBalance = NormalBalance[validated.type]

    const account = await db.chartOfAccount.update({
      where: {
        id: accountId,
        schoolId: session.user.schoolId,
      },
      data: {
        ...validated,
        normalBalance,
      },
    })

    revalidatePath('/finance/accounts')
    return { success: true, data: account as any }
  } catch (error) {
    console.error('Error updating account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update account' }
  }
}

/**
 * Delete Account
 * Soft deletes an account (marks as inactive)
 */
export async function deleteAccount(accountId: string): Promise<AccountActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if account has been used in any ledger entries
    const usageCount = await db.ledgerEntry.count({
      where: { accountId },
    })

    if (usageCount > 0) {
      return {
        success: false,
        error: 'Cannot delete account that has been used in transactions. Mark as inactive instead.',
      }
    }

    const account = await db.chartOfAccount.update({
      where: {
        id: accountId,
        schoolId: session.user.schoolId,
      },
      data: { isActive: false },
    })

    revalidatePath('/finance/accounts')
    return { success: true, data: account as any }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete account' }
  }
}

/**
 * Create Journal Entry
 * Creates a new manual journal entry
 */
export async function createJournalEntry(formData: FormData): Promise<JournalEntryActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const entriesData = JSON.parse(formData.get('entries') as string)

    const data = {
      entryDate: formData.get('entryDate'),
      description: formData.get('description'),
      fiscalYearId: formData.get('fiscalYearId'),
      entries: entriesData,
    }

    const validated = journalEntrySchema.parse(data)

    // Generate journal entry number
    const today = new Date()
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const lastEntry = await db.journalEntry.findFirst({
      where: {
        schoolId: session.user.schoolId,
        entryNumber: {
          startsWith: `${JOURNAL_ENTRY_NUMBER_FORMAT.prefix}-${yearMonth}`,
        },
      },
      orderBy: { entryNumber: 'desc' },
    })

    let sequence = 1
    if (lastEntry) {
      const lastSequence = parseInt(lastEntry.entryNumber.split('-').pop() || '0')
      sequence = lastSequence + 1
    }

    const entryNumber = `${JOURNAL_ENTRY_NUMBER_FORMAT.prefix}-${yearMonth}-${String(sequence).padStart(JOURNAL_ENTRY_NUMBER_FORMAT.sequenceLength, '0')}`

    // Create journal entry with ledger entries
    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate: validated.entryDate,
        description: validated.description,
        fiscalYearId: validated.fiscalYearId,
        schoolId: session.user.schoolId,
        sourceModule: 'MANUAL',
        createdBy: session.user.id!,
        ledgerEntries: {
          create: validated.entries.map(entry => ({
            school: { connect: { id: session.user.schoolId! } },
            account: { connect: { id: entry.accountId } },
            debit: entry.debit,
            credit: entry.credit,
            description: entry.description,
          })),
        },
      },
      include: {
        ledgerEntries: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    revalidatePath('/finance/accounts/journal')
    return { success: true, data: journalEntry as any }
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create journal entry' }
  }
}

/**
 * Post Journal Entry
 * Posts a draft journal entry to the ledger
 */
export async function postJournalEntry(journalEntryId: string): Promise<JournalEntryActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const journalEntry = await db.journalEntry.findUnique({
      where: {
        id: journalEntryId,
        schoolId: session.user.schoolId,
      },
      include: {
        ledgerEntries: true,
      },
    })

    if (!journalEntry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (journalEntry.isPosted) {
      return { success: false, error: 'Journal entry is already posted' }
    }

    // Post the entry and update account balances
    const updated = await db.$transaction(async (tx) => {
      // Update journal entry with posting information
      const entry = await tx.journalEntry.update({
        where: { id: journalEntryId },
        data: {
          isPosted: true,
          postedAt: new Date(),
          postedBy: session.user?.id,
        },
        include: {
          ledgerEntries: {
            include: {
              account: {
                select: {
                  code: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      })

      // Update account balances for each ledger entry
      for (const ledgerEntry of journalEntry.ledgerEntries) {
        await tx.accountBalance.upsert({
          where: {
            accountId_fiscalYearId: {
              accountId: ledgerEntry.accountId,
              fiscalYearId: journalEntry.fiscalYearId,
            },
          },
          create: {
            accountId: ledgerEntry.accountId,
            fiscalYearId: journalEntry.fiscalYearId,
            schoolId: session.user.schoolId!,
            debitTotal: ledgerEntry.debit,
            creditTotal: ledgerEntry.credit,
            balance: ledgerEntry.debit - ledgerEntry.credit,
          },
          update: {
            debitTotal: {
              increment: ledgerEntry.debit,
            },
            creditTotal: {
              increment: ledgerEntry.credit,
            },
            balance: {
              increment: ledgerEntry.debit - ledgerEntry.credit,
            },
          },
        })
      }

      return entry
    })

    revalidatePath('/finance/accounts/journal')
    revalidatePath('/finance/accounts/ledger')
    return { success: true, data: updated as any }
  } catch (error) {
    console.error('Error posting journal entry:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to post journal entry' }
  }
}

/**
 * Get Chart of Accounts
 * Retrieves all accounts with hierarchical structure
 */
export async function getChartOfAccounts(filters?: { type?: string; isActive?: boolean }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const accounts = await db.chartOfAccount.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ code: 'asc' }],
    })

    return { success: true, data: accounts }
  } catch (error) {
    console.error('Error fetching chart of accounts:', error)
    return { success: false, error: 'Failed to fetch chart of accounts' }
  }
}

/**
 * Get Journal Entries
 * Retrieves journal entries with filtering
 */
export async function getJournalEntries(filters?: { isPosted?: boolean; fiscalYearId?: string }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const entries = await db.journalEntry.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.isPosted !== undefined && { isPosted: filters.isPosted }),
        ...(filters?.fiscalYearId && { fiscalYearId: filters.fiscalYearId }),
      },
      include: {
        ledgerEntries: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { entryDate: 'desc' },
      take: 50,
    })

    return { success: true, data: entries }
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return { success: false, error: 'Failed to fetch journal entries' }
  }
}
