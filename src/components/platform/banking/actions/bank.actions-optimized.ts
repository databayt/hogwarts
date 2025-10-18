'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { cache } from 'react'
import { plaidClient } from '../lib/plaid'
import { parseStringify } from '../lib/utils'
import { CountryCode } from 'plaid'

// Cache tags for granular revalidation
const CACHE_TAGS = {
  accounts: 'bank-accounts',
  transactions: 'bank-transactions',
  institutions: 'bank-institutions',
}

// Cached function for getting accounts with React cache
export const getAccounts = cache(async ({ userId }: { userId: string }) => {
  try {
    const accounts = await db.bankAccount.findMany({
      where: { userId },
      include: {
        transactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    })

    const totalBanks = accounts.length
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + Number(account.currentBalance)
    }, 0)

    return parseStringify({
      data: accounts,
      totalBanks,
      totalCurrentBalance,
    })
  } catch (error) {
    console.error('Error getting accounts:', error)
    return null
  }
})

// Optimized account fetching with Next.js unstable_cache
export const getAccount = unstable_cache(
  async (accountId: string) => {
    try {
      const account = await db.bankAccount.findUnique({
        where: { id: accountId },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
            take: 50
          }
        }
      })

      return parseStringify(account)
    } catch (error) {
      console.error('Error getting account:', error)
      return null
    }
  },
  ['get-account'],
  {
    tags: [CACHE_TAGS.accounts],
    revalidate: 60, // Revalidate every minute for fresh data
  }
)

// Cached bank info with longer TTL since institution data rarely changes
export const getBankInfo = unstable_cache(
  async (accountId: string) => {
    try {
      const account = await db.bankAccount.findUnique({
        where: { id: accountId },
        select: { institutionId: true }
      })

      if (!account) {
        return null
      }

      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: account.institutionId,
        country_codes: ['US'] as CountryCode[],
      })

      const institution = institutionResponse.data.institution

      return parseStringify({
        name: institution.name,
        logo: institution.logo,
        primaryColor: institution.primary_color,
      })
    } catch (error) {
      console.error('Error getting bank info:', error)
      return null
    }
  },
  ['get-bank-info'],
  {
    tags: [CACHE_TAGS.institutions],
    revalidate: 3600, // Cache for 1 hour
  }
)

// Optimized bank account creation with proper revalidation
export async function createBankAccount({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: {
  userId: string
  bankId: string
  accountId: string
  accessToken: string
  fundingSourceUrl?: string
  shareableId?: string
}) {
  try {
    // Verify user authentication
    const session = await auth()
    if (!session?.user?.id || session.user.id !== userId) {
      throw new Error('Unauthorized')
    }

    // Verify schoolId exists
    if (!session.user.schoolId) {
      throw new Error('School ID not found in session')
    }

    const schoolId = session.user.schoolId

    // Get account details from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === accountId
    )

    if (!accountData) {
      throw new Error('Account not found')
    }

    // Create bank account in database
    const bankAccount = await db.bankAccount.create({
      data: {
        userId,
        schoolId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
        institutionId: accountsResponse.data.item.institution_id!,
        name: accountData.name,
        officialName: accountData.official_name || undefined,
        mask: accountData.mask || undefined,
        currentBalance: accountData.balances.current || 0,
        availableBalance: accountData.balances.available || 0,
        type: accountData.type,
        subtype: accountData.subtype || '',
      },
    })

    // Sync initial transactions in the background
    syncTransactions({ accountId: bankAccount.id }).catch(console.error)

    // Revalidate all related caches
    revalidateTag(CACHE_TAGS.accounts)
    revalidatePath(`/[lang]/banking`)
    revalidatePath(`/[lang]/banking/my-banks`)

    return parseStringify(bankAccount)
  } catch (error) {
    console.error('Error creating bank account:', error)
    throw error // Re-throw for proper error handling in UI
  }
}

// Optimized transaction sync with batch processing
export async function syncTransactions({
  accountId,
  startDate,
  endDate
}: {
  accountId: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const account = await db.bankAccount.findUnique({
      where: { id: accountId },
      select: { id: true, accessToken: true, accountId: true }
    })

    if (!account) {
      throw new Error('Account not found')
    }

    // Default date range: last 90 days
    const now = endDate || new Date()
    const start = startDate || new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: account.accessToken,
      start_date: start.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
      options: {
        count: 500, // Max transactions per request
        offset: 0,
      }
    })

    const transactions = transactionsResponse.data.transactions

    // Batch upsert transactions for better performance
    const upsertPromises = transactions.map(transaction =>
      db.transaction.upsert({
        where: { id: transaction.transaction_id },
        create: {
          id: transaction.transaction_id,
          accountId: transaction.account_id,
          bankAccountId: account.id,
          name: transaction.name,
          amount: transaction.amount,
          date: new Date(transaction.date),
          category: transaction.category?.[0] || 'Other',
          subcategory: transaction.category?.[1] || undefined,
          type: transaction.amount > 0 ? 'debit' : 'credit',
          pending: transaction.pending,
          merchantName: transaction.merchant_name || undefined,
          paymentChannel: transaction.payment_channel || undefined,
          isoCurrencyCode: transaction.iso_currency_code || 'USD',
        },
        update: {
          name: transaction.name,
          amount: transaction.amount,
          pending: transaction.pending,
        },
      })
    )

    // Process in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < upsertPromises.length; i += batchSize) {
      await Promise.all(upsertPromises.slice(i, i + batchSize))
    }

    // Update account balances
    const latestAccount = await plaidClient.accountsGet({
      access_token: account.accessToken,
    })

    const updatedAccountData = latestAccount.data.accounts.find(
      acc => acc.account_id === account.accountId
    )

    if (updatedAccountData) {
      await db.bankAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: updatedAccountData.balances.current || 0,
          availableBalance: updatedAccountData.balances.available || 0,
        }
      })
    }

    // Revalidate transaction-related caches
    revalidateTag(CACHE_TAGS.transactions)
    revalidateTag(CACHE_TAGS.accounts)

    return { success: true, count: transactions.length }
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Prefetch accounts for faster navigation
export async function prefetchAccounts(userId: string) {
  // This will populate the cache for subsequent requests
  void getAccounts({ userId })
}