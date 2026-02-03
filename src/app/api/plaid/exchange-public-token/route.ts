/**
 * Plaid Public Token Exchange API
 *
 * Exchanges temporary public_token for permanent access_token.
 *
 * SECURITY MODEL:
 * - public_token: Short-lived (30 min), returned by Plaid Link
 * - access_token: Long-lived, stored securely server-side
 * - Client NEVER sees access_token (prevents theft)
 *
 * WHAT THIS ENDPOINT DOES:
 * 1. Exchanges public_token → access_token via Plaid API
 * 2. Fetches account details (name, balance, type)
 * 3. Stores PlaidItem (access token, institution)
 * 4. Creates BankAccount record
 * 5. Fetches initial 6 months of transactions
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - schoolId from session, not request body
 * - All records (PlaidItem, BankAccount, Transaction) scoped
 * - Prevents cross-tenant access to financial data
 *
 * WHY STORE accessToken:
 * - Needed for all future Plaid API calls
 * - Fetching new transactions
 * - Refreshing balances
 * - Never exposed to client
 *
 * WHY PlaidItem + BankAccount SEPARATION:
 * - One Plaid Item can have multiple accounts
 * - PlaidItem holds institution-level data
 * - BankAccount holds account-specific data
 *
 * INITIAL TRANSACTION FETCH:
 * - 6 months lookback for financial history
 * - Enables immediate dashboard population
 * - Subsequent syncs use incremental cursor
 *
 * TRANSACTION AMOUNT SIGN:
 * - Plaid: positive = debit (money out)
 * - We store as-is, type field indicates direction
 *
 * GOTCHAS:
 * - public_token expires quickly (exchange immediately)
 * - Institution name may differ from account name
 * - Transactions may take hours for some banks
 * - Pending transactions may change
 *
 * @see /sync-transactions for incremental updates
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid"

import { db } from "@/lib/db"
import { parseStringify } from "@/components/school-dashboard/finance/banking/lib/utils"

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Store Plaid item
    await db.plaidItem.create({
      data: {
        userId: session.user.id,
        schoolId,
        accessToken,
        itemId,
        institutionId,
        institutionName: accountsResponse.data.item.institution_id || "",
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
        subtype: accountData.subtype || "",
      },
    })

    // Get initial transactions
    const now = new Date()
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate()
    )

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split("T")[0],
      end_date: now.toISOString().split("T")[0],
    })

    // Store transactions
    const transactions = transactionsResponse.data.transactions.map(
      (transaction) => ({
        accountId: transaction.account_id,
        bankAccountId: bankAccount.id,
        schoolId,
        name: transaction.name,
        amount: transaction.amount,
        date: new Date(transaction.date),
        paymentChannel: transaction.payment_channel,
        category: transaction.category?.[0] || "Other",
        subcategory: transaction.category?.[1],
        type: transaction.amount > 0 ? "debit" : "credit",
        pending: transaction.pending,
        merchantName: transaction.merchant_name,
      })
    )

    if (transactions.length > 0) {
      await db.transaction.createMany({
        data: transactions,
      })
    }

    return NextResponse.json(parseStringify(bankAccount))
  } catch (error) {
    console.error("Error exchanging public token:", error)
    return NextResponse.json(
      { error: "Failed to exchange token" },
      { status: 500 }
    )
  }
}
