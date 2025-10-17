import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { auth } from '@/auth'
import { db } from '@/lib/db'

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

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bankAccountId } = body

    // Get bank account with access token
    const bankAccount = await db.bankAccount.findUnique({
      where: {
        id: bankAccountId,
        userId: session.user.id,
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

    // Get latest transactions
    const now = new Date()
    const startDate = bankAccount.transactions[0]?.date ||
      new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: bankAccount.accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    // Filter out existing transactions
    const existingTransactionIds = await db.transaction.findMany({
      where: {
        bankAccountId: bankAccount.id,
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