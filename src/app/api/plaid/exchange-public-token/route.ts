import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { parseStringify } from '@/components/platform/finance/banking/lib/utils'

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
    const { publicToken, institutionId, accountId } = body

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get account details
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === accountId
    )

    if (!accountData) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Store Plaid item
    await db.plaidItem.create({
      data: {
        userId: session.user.id,
        schoolId,
        accessToken,
        itemId,
        institutionId,
        institutionName: accountsResponse.data.item.institution_id || '',
      },
    })

    // Create bank account
    const bankAccount = await db.bankAccount.create({
      data: {
        userId: session.user.id,
        schoolId,
        bankId: itemId,
        accountId: accountData.account_id,
        accessToken,
        institutionId,
        name: accountData.name,
        officialName: accountData.official_name,
        mask: accountData.mask,
        currentBalance: accountData.balances.current || 0,
        availableBalance: accountData.balances.available || 0,
        type: accountData.type,
        subtype: accountData.subtype || '',
      },
    })

    // Get initial transactions
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    // Store transactions
    const transactions = transactionsResponse.data.transactions.map((transaction) => ({
      accountId: transaction.account_id,
      bankAccountId: bankAccount.id,
      schoolId,
      name: transaction.name,
      amount: transaction.amount,
      date: new Date(transaction.date),
      paymentChannel: transaction.payment_channel,
      category: transaction.category?.[0] || 'Other',
      subcategory: transaction.category?.[1],
      type: transaction.amount > 0 ? 'debit' : 'credit',
      pending: transaction.pending,
      merchantName: transaction.merchant_name,
    }))

    if (transactions.length > 0) {
      await db.transaction.createMany({
        data: transactions,
      })
    }

    return NextResponse.json(parseStringify(bankAccount))
  } catch (error) {
    console.error('Error exchanging public token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}