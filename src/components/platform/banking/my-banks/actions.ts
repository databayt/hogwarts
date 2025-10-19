'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import type { BankAccount, ActionResult } from '../types';

/**
 * Get all bank accounts for a user
 */
export const getAccounts = cache(async (params: {
  userId: string;
}): Promise<BankAccount[]> => {
  try {
    const accounts = await db.bankAccount.findMany({
      where: {
        userId: params.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(account => ({
      ...account,
      type: account.type as 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other',
      currentBalance: account.currentBalance.toNumber(),
      availableBalance: account.availableBalance?.toNumber() || 0,
      officialName: account.officialName ?? undefined,
      mask: account.mask ?? undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return [];
  }
});

/**
 * Remove a bank account connection
 */
export async function removeBank(params: {
  accountId: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }
    const user = session.user;

    // Verify ownership
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

    // Soft delete
    await db.bankAccount.update({
      where: { id: params.accountId },
      data: { isActive: false },
    });

    revalidatePath('/banking/my-banks');
    revalidatePath('/banking');

    return {
      success: true,
      data: { message: 'Bank account removed successfully' },
    };
  } catch (error) {
    console.error('Failed to remove bank:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove bank account',
      },
    };
  }
}

/**
 * Sync bank account data from Plaid
 */
export async function syncBankData(params: {
  accountId: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      };
    }
    const user = session.user;

    // Verify ownership
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

    // TODO: Implement Plaid sync logic
    // const plaidData = await plaidClient.syncAccount(account.plaidAccountId);

    // Update last synced timestamp
    await db.bankAccount.update({
      where: { id: params.accountId },
      data: { lastSyncedAt: new Date() },
    });

    revalidatePath('/banking/my-banks');
    revalidatePath('/banking');

    return {
      success: true,
      data: { message: 'Bank data synced successfully' },
    };
  } catch (error) {
    console.error('Failed to sync bank data:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to sync bank data',
      },
    };
  }
}