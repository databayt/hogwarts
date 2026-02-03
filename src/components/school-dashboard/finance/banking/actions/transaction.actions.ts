"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

import { parseStringify } from "../lib/utils"

export async function getTransactionsByBankId({
  bankAccountId,
  page = 1,
  limit = 10,
}: {
  bankAccountId: string
  page?: number
  limit?: number
}) {
  try {
    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return null
    }

    const skip = (page - 1) * limit

    const transactions = await db.transaction.findMany({
      where: {
        bankAccountId,
        schoolId, // Multi-tenant isolation
      },
      orderBy: { date: "desc" },
      take: limit,
      skip,
    })

    const total = await db.transaction.count({
      where: {
        bankAccountId,
        schoolId, // Multi-tenant isolation
      },
    })

    return parseStringify({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error getting transactions:", error)
    return null
  }
}

export async function getTransactionsByUserId({
  userId,
  page = 1,
  limit = 20,
}: {
  userId: string
  page?: number
  limit?: number
}) {
  try {
    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      return null
    }

    const skip = (page - 1) * limit

    // Get all bank accounts for the user within the school
    const bankAccounts = await db.bankAccount.findMany({
      where: {
        userId,
        schoolId, // Multi-tenant isolation
      },
      select: { id: true },
    })

    const bankAccountIds = bankAccounts.map((account) => account.id)

    // Get all transactions for these bank accounts
    const transactions = await db.transaction.findMany({
      where: {
        bankAccountId: {
          in: bankAccountIds,
        },
        schoolId, // Multi-tenant isolation
      },
      orderBy: { date: "desc" },
      take: limit,
      skip,
      include: {
        bankAccount: {
          select: {
            name: true,
            officialName: true,
          },
        },
      },
    })

    const total = await db.transaction.count({
      where: {
        bankAccountId: {
          in: bankAccountIds,
        },
        schoolId, // Multi-tenant isolation
      },
    })

    return parseStringify({
      data: transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error getting user transactions:", error)
    return null
  }
}
