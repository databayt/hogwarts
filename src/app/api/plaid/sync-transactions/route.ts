/**
 * Plaid Transaction Sync API
 *
 * Fetches new transactions from Plaid and syncs to local database.
 *
 * SYNC STRATEGY:
 * 1. Find last synced transaction date (cursor-based incremental sync)
 * 2. Fetch only transactions since that date from Plaid
 * 3. De-duplicate against existing transaction IDs
 * 4. Insert only new transactions in batch
 * 5. Update account balances from Plaid
 *
 * WHY INCREMENTAL SYNC:
 * - Plaid charges per API call, not per transaction
 * - Reduces API response size and processing time
 * - Avoids duplicate transaction handling
 *
 * WHY ABS() FOR AMOUNTS:
 * Plaid uses positive = debit (outflow), negative = credit (inflow)
 * We store absolute value with separate type field for clarity
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - Bank account must belong to current user AND current school
 * - Transaction schoolId enforced on every insert
 * - Prevents cross-tenant data access
 *
 * GOTCHAS:
 * - Plaid dates are strings (YYYY-MM-DD), must convert to Date
 * - Transaction IDs are Plaid's, stored in accountId field (legacy naming)
 * - Pending transactions may change - sync updates don't handle this yet
 * - Rate limits: 250 requests/minute, batch processing recommended
 */

import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { auth } from '@/auth'
import { db } from '@/lib/db'

// Initialize Plaid client with environment-specific configuration
// Uses PLAID_ENV to switch between sandbox/development/production
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const schoolId = session.user.schoolId

    const body = await request.json()
    const { bankAccountId } = body

    // Get bank account with access token
    const bankAccount = await db.bankAccount.findUnique({
      where: {
        id: bankAccountId,
        userId: session.user.id,
        schoolId,
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    })

    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Get latest transactions - use last transaction date as cursor
    // WHY: Incremental sync reduces Plaid API calls and processing time
    // Falls back to 1 month ago if no previous transactions (first sync)
    const now = new Date()
    const startDate = bankAccount.transactions[0]?.date ||
      new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: bankAccount.accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    // Filter out existing transactions to prevent duplicates
    // WHY: Plaid may return overlapping transactions on date boundaries
    const existingTransactionIds = await db.transaction.findMany({
      where: {
        bankAccountId: bankAccount.id,
        schoolId,
        accountId: {
          in: transactionsResponse.data.transactions.map(t => t.transaction_id),
        },
      },
      select: { accountId: true },
    })

    const existingIds = new Set(existingTransactionIds.map(t => t.accountId))
    const newTransactions = transactionsResponse.data.transactions.filter(
      t => !existingIds.has(t.transaction_id)
    )

    // Store new transactions
    if (newTransactions.length > 0) {
      const transactions = newTransactions.map((transaction) => ({
        accountId: transaction.transaction_id,
        bankAccountId: bankAccount.id,
        schoolId,
        name: transaction.name,
        amount: Math.abs(transaction.amount),
        date: new Date(transaction.date),
        paymentChannel: transaction.payment_channel,
        category: transaction.category?.[0] || 'Other',
        subcategory: transaction.category?.[1],
        type: transaction.amount > 0 ? 'debit' : 'credit',
        pending: transaction.pending,
        merchantName: transaction.merchant_name,
      }))

      await db.transaction.createMany({
        data: transactions,
      })
    }

    // Update account balances
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bankAccount.accessToken,
    })

    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === bankAccount.accountId
    )

    if (accountData) {
      await db.bankAccount.update({
        where: { id: bankAccount.id },
        data: {
          currentBalance: accountData.balances.current || 0,
          availableBalance: accountData.balances.available || 0,
        },
      })
    }

    return NextResponse.json({
      message: 'Transactions synced successfully',
      newTransactions: newTransactions.length,
    })
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}