'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { plaidClient } from '../lib/plaid'
import { parseStringify } from '../lib/utils'
import { CountryCode } from 'plaid'
import type {
  ActionResult,
  GetAccountsParams,
  GetAccountsResult,
  GetAccountParams,
  GetAccountByPlaidIdParams,
  CreateBankAccountParams,
  CreateBankAccountResult,
  SyncTransactionsParams,
  SyncTransactionsResult,
  GetBankInfoParams,
  GetBankInfoResult,
  DeleteBankAccountParams,
} from '../types'
import type { BankAccountWithTransactions } from '../types'

/**
 * Get multiple bank accounts for a user
 */
export async function getAccounts(
  params: GetAccountsParams
): Promise<ActionResult<GetAccountsResult>> {
  try {
    const { userId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    const accounts = await db.bankAccount.findMany({
      where: {
        userId,
        schoolId // Multi-tenant isolation
      },
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
    const totalAvailableBalance = accounts.reduce((total, account) => {
      return total + Number(account.availableBalance)
    }, 0)

    // Serialize Decimal fields to numbers and cast enum types
    const serializedAccounts = accounts.map(account => ({
      ...account,
      type: account.type as 'depository' | 'credit' | 'loan' | 'investment',
      currentBalance: Number(account.currentBalance),
      availableBalance: Number(account.availableBalance),
      transactions: account.transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        type: tx.type as 'debit' | 'credit',
        paymentChannel: tx.paymentChannel as 'online' | 'in_store' | 'other' | null,
      }))
    }))

    return {
      success: true,
      data: {
        data: serializedAccounts,
        totalBanks,
        totalCurrentBalance,
        totalAvailableBalance,
      }
    }
  } catch (error) {
    console.error('Error getting accounts:', error)
    return {
      success: false,
      error: {
        code: 'ACCOUNTS_FETCH_ERROR',
        message: 'Failed to fetch bank accounts',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Get a specific bank account by ID
 */
export async function getAccount(
  params: GetAccountParams
): Promise<ActionResult<BankAccountWithTransactions>> {
  try {
    const { accountId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        schoolId // Multi-tenant isolation
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 50
        }
      }
    })

    if (!account) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Bank account not found',
          statusCode: 404
        }
      }
    }

    // Serialize Decimal fields and cast enum types
    const serializedAccount = {
      ...account,
      type: account.type as 'depository' | 'credit' | 'loan' | 'investment',
      currentBalance: Number(account.currentBalance),
      availableBalance: Number(account.availableBalance),
      transactions: account.transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        type: tx.type as 'debit' | 'credit',
        paymentChannel: tx.paymentChannel as 'online' | 'in_store' | 'other' | null,
      }))
    }

    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error getting account:', error)
    return {
      success: false,
      error: {
        code: 'ACCOUNT_FETCH_ERROR',
        message: 'Failed to fetch bank account',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Get bank account by Plaid account ID
 */
export async function getAccountByPlaidId(
  params: GetAccountByPlaidIdParams
): Promise<ActionResult<BankAccountWithTransactions>> {
  try {
    const { accountId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        accountId,
        schoolId // Multi-tenant isolation
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!account) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Bank account not found',
          statusCode: 404
        }
      }
    }

    // Serialize Decimal fields and cast enum types
    const serializedAccount = {
      ...account,
      type: account.type as 'depository' | 'credit' | 'loan' | 'investment',
      currentBalance: Number(account.currentBalance),
      availableBalance: Number(account.availableBalance),
      transactions: account.transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        type: tx.type as 'debit' | 'credit',
        paymentChannel: tx.paymentChannel as 'online' | 'in_store' | 'other' | null,
      }))
    }

    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error getting account by Plaid ID:', error)
    return {
      success: false,
      error: {
        code: 'ACCOUNT_FETCH_ERROR',
        message: 'Failed to fetch bank account',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Create bank account after Plaid Link
 */
export async function createBankAccount(
  params: CreateBankAccountParams
): Promise<ActionResult<CreateBankAccountResult>> {
  try {
    const {
      userId,
      bankId,
      accountId,
      accessToken,
      fundingSourceUrl,
      shareableId,
    } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    // Get account details from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === accountId
    )

    if (!accountData) {
      return {
        success: false,
        error: {
          code: 'PLAID_ACCOUNT_NOT_FOUND',
          message: 'Account not found in Plaid response',
          statusCode: 404
        }
      }
    }

    // Get institution details
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: accountsResponse.data.item.institution_id!,
      country_codes: ['US'] as CountryCode[],
    })

    // Create bank account in database
    const bankAccount = await db.bankAccount.create({
      data: {
        schoolId, // Multi-tenant support
        userId,
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
        type: accountData.type as any, // Plaid types should match our enum
        subtype: accountData.subtype || '',
      },
    })

    // Sync initial transactions
    const syncResult = await syncTransactions({ accountId: bankAccount.id })

    if (!syncResult.success) {
      console.warn('Initial transaction sync failed:', syncResult.error)
    }

    revalidatePath('/banking')

    // Serialize the result and cast enum type
    const serializedAccount = {
      ...bankAccount,
      type: bankAccount.type as 'depository' | 'credit' | 'loan' | 'investment',
      currentBalance: Number(bankAccount.currentBalance),
      availableBalance: Number(bankAccount.availableBalance),
    }

    return {
      success: true,
      data: serializedAccount
    }
  } catch (error) {
    console.error('Error creating bank account:', error)
    return {
      success: false,
      error: {
        code: 'ACCOUNT_CREATE_ERROR',
        message: 'Failed to create bank account',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Sync transactions from Plaid
 */
export async function syncTransactions(
  params: SyncTransactionsParams
): Promise<ActionResult<SyncTransactionsResult>> {
  try {
    const { accountId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        schoolId // Multi-tenant isolation
      },
    })

    if (!account) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Bank account not found',
          statusCode: 404
        }
      }
    }

    // Get transactions from Plaid
    const now = new Date()
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: account.accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    const transactions = transactionsResponse.data.transactions
    let synced = 0
    let updated = 0
    const errors: string[] = []

    // Save transactions to database
    for (const transaction of transactions) {
      try {
        const result = await db.transaction.upsert({
          where: {
            id: transaction.transaction_id,
          },
          create: {
            id: transaction.transaction_id,
            schoolId, // Multi-tenant support
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

        if (result) {
          synced++
        } else {
          updated++
        }
      } catch (error) {
        errors.push(`Failed to sync transaction ${transaction.transaction_id}: ${error}`)
      }
    }

    return {
      success: true,
      data: {
        synced,
        updated,
        errors
      }
    }
  } catch (error) {
    console.error('Error syncing transactions:', error)
    return {
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: 'Failed to sync transactions',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Get bank institution information
 */
export async function getBankInfo(
  params: GetBankInfoParams
): Promise<ActionResult<GetBankInfoResult>> {
  try {
    const { accountId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        schoolId // Multi-tenant isolation
      },
    })

    if (!account) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Bank account not found',
          statusCode: 404
        }
      }
    }

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: account.institutionId,
      country_codes: ['US'] as CountryCode[],
    })

    const institution = institutionResponse.data.institution

    return {
      success: true,
      data: {
        id: institution.institution_id,
        name: institution.name,
        logo: institution.logo || null,
        primaryColor: institution.primary_color || null,
        url: institution.url || null,
        oauth: institution.oauth || false,
      }
    }
  } catch (error) {
    console.error('Error getting bank info:', error)
    return {
      success: false,
      error: {
        code: 'BANK_INFO_ERROR',
        message: 'Failed to fetch bank information',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

/**
 * Delete a bank account
 */
export async function deleteBankAccount(
  params: DeleteBankAccountParams
): Promise<ActionResult<void>> {
  try {
    const { accountId, userId } = params

    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return {
        success: false,
        error: {
          code: 'NO_SCHOOL_CONTEXT',
          message: 'School context not found',
          statusCode: 403
        }
      }
    }

    // Verify ownership and school context
    const account = await db.bankAccount.findFirst({
      where: {
        id: accountId,
        userId,
        schoolId // Multi-tenant isolation
      }
    })

    if (!account) {
      return {
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Bank account not found or access denied',
          statusCode: 404
        }
      }
    }

    // Delete the account (cascade will delete transactions)
    await db.bankAccount.delete({
      where: { id: accountId }
    })

    revalidatePath('/banking')

    return {
      success: true,
      data: undefined
    }
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete bank account',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}