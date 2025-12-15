"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"

import { parseStringify } from "../lib/utils"

export async function createTransfer({
  senderBankId,
  receiverBankId,
  amount,
  note,
}: {
  senderBankId: string
  receiverBankId: string
  amount: number
  note?: string
}) {
  try {
    // Get schoolId from session for multi-tenant isolation
    const session = await auth()
    const schoolId = session?.user?.schoolId

    if (!schoolId) {
      throw new Error("School context not found")
    }

    // Check sender has sufficient funds and belongs to the same school
    const senderAccount = await db.bankAccount.findFirst({
      where: {
        id: senderBankId,
        schoolId, // Multi-tenant isolation
      },
    })

    if (!senderAccount) {
      throw new Error("Sender account not found")
    }

    if (Number(senderAccount.currentBalance) < amount) {
      throw new Error("Insufficient funds")
    }

    // Verify receiver account belongs to the same school
    const receiverAccount = await db.bankAccount.findFirst({
      where: {
        id: receiverBankId,
        schoolId, // Multi-tenant isolation - transfers only within same school
      },
    })

    if (!receiverAccount) {
      throw new Error("Receiver account not found or not in same school")
    }

    // Create transfer record
    const transfer = await db.transfer.create({
      data: {
        schoolId, // Multi-tenant support
        senderBankId,
        receiverBankId,
        amount,
        note,
        status: "pending",
        transferDate: new Date(),
      },
    })

    // In production, this would integrate with Dwolla API
    // For now, we'll simulate the transfer

    // Update balances
    await db.bankAccount.update({
      where: { id: senderBankId },
      data: {
        currentBalance: {
          decrement: amount,
        },
      },
    })

    await db.bankAccount.update({
      where: { id: receiverBankId },
      data: {
        currentBalance: {
          increment: amount,
        },
      },
    })

    // Update transfer status
    await db.transfer.update({
      where: { id: transfer.id },
      data: { status: "completed" },
    })

    return parseStringify(transfer)
  } catch (error) {
    console.error("Error creating transfer:", error)
    return null
  }
}

export async function getTransferHistory({
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

    const transfers = await db.transfer.findMany({
      where: {
        schoolId, // Multi-tenant isolation
        OR: [
          { senderBankId: bankAccountId },
          { receiverBankId: bankAccountId },
        ],
      },
      orderBy: { transferDate: "desc" },
      take: limit,
      skip,
      include: {
        senderBank: {
          select: { name: true },
        },
        receiverBank: {
          select: { name: true },
        },
      },
    })

    const total = await db.transfer.count({
      where: {
        schoolId, // Multi-tenant isolation
        OR: [
          { senderBankId: bankAccountId },
          { receiverBankId: bankAccountId },
        ],
      },
    })

    return parseStringify({
      data: transfers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error getting transfer history:", error)
    return null
  }
}
