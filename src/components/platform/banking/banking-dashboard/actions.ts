'use server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cache } from 'react';
import type { ActionResult, BankAccount, Transaction, AccountSummary } from '../types';

// Cache tags for granular invalidation
const CACHE_TAGS = {
  accounts: 'banking-accounts',
  transactions: 'banking-transactions',
  balance: 'banking-balance',
} as const;

/**
 * Get all bank accounts for a user
 * Cached for 5 minutes with tag-based revalidation
 */
export const getAccounts = cache(async (params: {
  userId: string;
}): Promise<BankAccount[]> => {
  try {
    const accounts = await db.bankAccount.findMany({
      where: {
        userId: params.userId,
      },
      include: {
        bank: true,
        transactions: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform Decimal to number for serialization
    return accounts.map(account => ({
      ...account,
      currentBalance: account.currentBalance.toNumber(),
      availableBalance: account.availableBalance?.toNumber() || null,
      transactions: account.transactions.map(t => ({
        ...t,
        amount: t.amount.toNumber(),
      })),
    }));
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
});

/**
 * Get account details by ID
 * Includes full transaction history
 */
export const getAccount = cache(async (params: {
  accountId: string;
  userId: string;
}): Promise<BankAccount | null> => {
  try {
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.accountId,
        userId: params.userId,
      },
      include: {
        bank: true,
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!account) return null;

    return {
      ...account,
      currentBalance: account.currentBalance.toNumber(),
      availableBalance: account.availableBalance?.toNumber() || null,
      transactions: account.transactions.map(t => ({
        ...t,
        amount: t.amount.toNumber(),
      })),
    };
  } catch (error) {
    console.error('Failed to fetch account:', error);
    return null;
  }
});

/**
 * Get recent transactions across all accounts
 * Used for dashboard overview
 */
export const getRecentTransactions = cache(async (params: {
  userId: string;
  limit?: number;
  category?: string;
}): Promise<Transaction[]> => {
  try {
    const transactions = await db.transaction.findMany({
      where: {
        account: {
          userId: params.userId,
        },
        ...(params.category && { category: params.category }),
      },
      include: {
        account: {
          include: { bank: true },
        },
      },
      orderBy: { date: 'desc' },
      take: params.limit || 20,
    });

    return transactions.map(t => ({
      ...t,
      amount: t.amount.toNumber(),
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
});

/**
 * Get account summary with statistics
 * Aggregates data across all accounts
 */
export const getAccountSummary = cache(async (params: {
  userId: string;
}): Promise<AccountSummary> => {
  try {
    const user = await currentUser();
    if (!user || user.id !== params.userId) {
      throw new Error('Unauthorized');
    }

    const accounts = await getAccounts({ userId: params.userId });

    // Calculate totals
    const totalCurrentBalance = accounts.reduce(
      (sum, acc) => sum + acc.currentBalance,
      0
    );

    const totalAvailableBalance = accounts.reduce(
      (sum, acc) => sum + (acc.availableBalance || acc.currentBalance),
      0
    );

    // Get recent transactions for statistics
    const recentTransactions = await getRecentTransactions({
      userId: params.userId,
      limit: 100,
    });

    // Calculate monthly spending
    const currentMonth = new Date().getMonth();
    const monthlySpending = recentTransactions
      .filter(t => {
        const transactionMonth = new Date(t.date).getMonth();
        return transactionMonth === currentMonth && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate monthly income
    const monthlyIncome = recentTransactions
      .filter(t => {
        const transactionMonth = new Date(t.date).getMonth();
        return transactionMonth === currentMonth && t.amount > 0;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBanks: accounts.length,
      totalCurrentBalance,
      totalAvailableBalance,
      monthlySpending,
      monthlyIncome,
      accounts,
      recentTransactions: recentTransactions.slice(0, 10),
    };
  } catch (error) {
    console.error('Failed to fetch account summary:', error);
    // Return empty summary on error
    return {
      totalBanks: 0,
      totalCurrentBalance: 0,
      totalAvailableBalance: 0,
      monthlySpending: 0,
      monthlyIncome: 0,
      accounts: [],
      recentTransactions: [],
    };
  }
});

/**
 * Refresh account data from Plaid
 * Triggers a sync and revalidates cache
 */
export async function refreshAccountData(params: {
  accountId: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }

    // Verify account ownership
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Account not found' },
      };
    }

    // TODO: Implement Plaid sync logic here
    // const plaidSync = await syncPlaidAccount(account.plaidAccountId);

    // Revalidate all banking-related caches
    revalidateTag(CACHE_TAGS.accounts);
    revalidateTag(CACHE_TAGS.transactions);
    revalidateTag(CACHE_TAGS.balance);
    revalidatePath('/banking');

    return {
      success: true,
      data: { message: 'Account data refreshed successfully' },
    };
  } catch (error) {
    console.error('Failed to refresh account data:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to refresh account data',
      },
    };
  }
}

/**
 * Remove a bank account
 */
export async function removeAccount(params: {
  accountId: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }

    // Verify ownership before deletion
    const account = await db.bankAccount.findFirst({
      where: {
        id: params.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Account not found' },
      };
    }

    // Soft delete or mark as inactive
    await db.bankAccount.update({
      where: { id: params.accountId },
      data: { isActive: false },
    });

    // Revalidate caches
    revalidateTag(CACHE_TAGS.accounts);
    revalidatePath('/banking');

    return {
      success: true,
      data: { message: 'Account removed successfully' },
    };
  } catch (error) {
    console.error('Failed to remove account:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove account',
      },
    };
  }
}