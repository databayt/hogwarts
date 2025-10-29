/**
 * Wallet Module - Server Actions
 */

'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { walletSchema, walletTopupSchema, walletRefundSchema } from './validation'
import type { WalletActionResult } from './types'

export async function createWallet(formData: FormData): Promise<WalletActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      type: formData.get('type'),
      userId: formData.get('userId') || null,
      isActive: formData.get('isActive') === 'true',
    }

    const validated = walletSchema.parse(data)

    const wallet = await db.wallet.create({
      data: {
        walletType: validated.type,
        ownerId: validated.userId || session.user.schoolId,
        isActive: validated.isActive,
        schoolId: session.user.schoolId,
        balance: 0,
      },
      include: {
        transactions: true,
      },
    })

    revalidatePath('/finance/wallet')
    return { success: true, data: wallet as any }
  } catch (error) {
    console.error('Error creating wallet:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create wallet' }
  }
}

export async function topupWallet(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      walletId: formData.get('walletId'),
      amount: Number(formData.get('amount')),
      paymentMethod: formData.get('paymentMethod'),
      description: formData.get('description') || undefined,
    }

    const validated = walletTopupSchema.parse(data)

    const result = await db.$transaction(async (tx) => {
      // Update wallet balance
      const wallet = await tx.wallet.update({
        where: {
          id: validated.walletId,
          schoolId: session.user.schoolId,
        },
        data: {
          balance: {
            increment: validated.amount,
          },
        },
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: validated.walletId,
          amount: validated.amount,
          type: 'CREDIT',
          description: validated.description || `Top-up via ${validated.paymentMethod}`,
          schoolId: session.user.schoolId!,
          balanceAfter: wallet.balance,
          createdBy: session.user.id,
        },
      })

      return { wallet, transaction }
    })

    revalidatePath('/finance/wallet')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error topping up wallet:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to top-up wallet' }
  }
}

export async function refundWallet(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      walletId: formData.get('walletId'),
      amount: Number(formData.get('amount')),
      reason: formData.get('reason'),
    }

    const validated = walletRefundSchema.parse(data)

    // Check wallet balance
    const wallet = await db.wallet.findUnique({
      where: {
        id: validated.walletId,
        schoolId: session.user.schoolId,
      },
    })

    if (!wallet) {
      return { success: false, error: 'Wallet not found' }
    }

    if (Number(wallet.balance) < validated.amount) {
      return { success: false, error: 'Insufficient balance' }
    }

    const result = await db.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: validated.walletId },
        data: {
          balance: {
            decrement: validated.amount,
          },
        },
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: validated.walletId,
          amount: validated.amount,
          type: 'DEBIT',
          description: `Refund: ${validated.reason}`,
          schoolId: session.user.schoolId!,
          balanceAfter: updatedWallet.balance,
          createdBy: session.user.id,
        },
      })

      return { wallet: updatedWallet, transaction }
    })

    revalidatePath('/finance/wallet')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error refunding wallet:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to refund wallet' }
  }
}

export async function getWallets(filters?: { type?: string; isActive?: boolean }) {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: 'Unauthorized' }
    }

    const wallets = await db.wallet.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return { success: true, data: wallets }
  } catch (error) {
    console.error('Error fetching wallets:', error)
    return { success: false, error: 'Failed to fetch wallets' }
  }
}
