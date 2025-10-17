'use server'

import { db } from '@/lib/db'
import { parseStringify } from '../lib/utils'

export async function getTransactionsByBankId({
  bankAccountId,
  page = 1,
  limit = 10
}: {
  bankAccountId: string
  page?: number
  limit?: number
}) {
  try {
    const skip = (page - 1) * limit

    const transactions = await db.transaction.findMany({
      where: { bankAccountId },
      orderBy: { date: 'desc' },
      take: limit,
      skip
    })

    const total = await db.transaction.count({
      where: { bankAccountId }
    })

    return parseStringify({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error getting transactions:', error)
    return null
  }
}

export async function getTransactionsByUserId({
  userId,
  page = 1,
  limit = 20
}: {
  userId: string
  page?: number
  limit?: number
}) {
  try {
    const skip = (page - 1) * limit

    // Get all bank accounts for the user
    const bankAccounts = await db.bankAccount.findMany({
      where: { userId },
      select: { id: true }
    })

    const bankAccountIds = bankAccounts.map(account => account.id)

    // Get all transactions for these bank accounts
    const transactions = await db.transaction.findMany({
      where: {
        bankAccountId: {
          in: bankAccountIds
        }
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip,
      include: {
        bankAccount: {
          select: {
            name: true,
            officialName: true
          }
        }
      }
    })

    const total = await db.transaction.count({
      where: {
        bankAccountId: {
          in: bankAccountIds
        }
      }
    })

    return parseStringify({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error getting user transactions:', error)
    return null
  }
}