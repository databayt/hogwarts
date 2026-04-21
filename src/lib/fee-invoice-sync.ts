import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

interface PaymentScheduleEntry {
  dueDate: string
  amount: number
  description?: string
}

type DbClient = typeof db | Prisma.TransactionClient

/**
 * Idempotent invoice generator for a FeeAssignment.
 *
 * - Skips if invoices already exist for this assignment (safe to retry).
 * - installments === 1 -> one invoice.
 * - installments > 1 with paymentSchedule JSON -> one invoice per schedule entry.
 * - installments > 1 without schedule -> equal split, monthly due dates.
 *
 * Accepts an optional transaction client so callers can include it in atomic flows.
 */
export async function ensureInvoicesForAssignment(
  schoolId: string,
  feeAssignmentId: string,
  tx?: Prisma.TransactionClient
): Promise<{ invoicesCreated: number }> {
  const client: DbClient = tx ?? db

  const existing = await client.userInvoice.count({
    where: { schoolId, feeAssignmentId },
  })
  if (existing > 0) return { invoicesCreated: 0 }

  const assignment = await client.feeAssignment.findFirst({
    where: { id: feeAssignmentId, schoolId },
    include: {
      feeStructure: {
        select: {
          name: true,
          installments: true,
          paymentSchedule: true,
        },
      },
      student: {
        select: {
          userId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  if (!assignment?.student?.userId) return { invoicesCreated: 0 }

  let studentEmail = assignment.student.email
  if (!studentEmail) {
    const studentUser = await client.user.findUnique({
      where: { id: assignment.student.userId },
      select: { email: true },
    })
    studentEmail = studentUser?.email ?? null
  }

  const school = await client.school.findUnique({
    where: { id: schoolId },
    select: { name: true, address: true, currency: true },
  })

  const installments = assignment.feeStructure.installments ?? 1
  const schedule = assignment.feeStructure.paymentSchedule as
    | PaymentScheduleEntry[]
    | null
  const finalAmount = Number(assignment.finalAmount)

  const rows: Array<{ amount: number; dueDate: Date; description: string }> = []

  if (installments === 1) {
    rows.push({
      amount: finalAmount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: assignment.feeStructure.name,
    })
  } else if (schedule && Array.isArray(schedule) && schedule.length > 0) {
    schedule.forEach((entry, i) => {
      const amount = Number(entry.amount)
      if (!Number.isFinite(amount) || amount <= 0) return
      rows.push({
        amount,
        dueDate: new Date(entry.dueDate),
        description:
          entry.description ??
          `${assignment.feeStructure.name} — Installment ${i + 1}`,
      })
    })
  } else {
    const per = Math.round((finalAmount / installments) * 100) / 100
    let running = 0
    for (let i = 0; i < installments; i++) {
      const isLast = i === installments - 1
      const amount = isLast
        ? Math.round((finalAmount - running) * 100) / 100
        : per
      running += amount
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + i + 1)
      rows.push({
        amount,
        dueDate,
        description: `${assignment.feeStructure.name} — Installment ${i + 1} of ${installments}`,
      })
    }
  }

  if (rows.length === 0) return { invoicesCreated: 0 }

  const studentName =
    [
      assignment.student.firstName,
      assignment.student.middleName,
      assignment.student.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Student"

  let created = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const fromAddress = await client.userInvoiceAddress.create({
      data: {
        schoolId,
        name: school?.name ?? "School",
        address1: school?.address ?? "School Address",
      },
    })
    const toAddress = await client.userInvoiceAddress.create({
      data: {
        schoolId,
        name: studentName,
        email: studentEmail ?? null,
        address1: "Student",
      },
    })
    const invoiceNo = await generateUniqueInvoiceNumber(
      client,
      schoolId,
      rows.length > 1 ? i + 1 : undefined
    )
    await client.userInvoice.create({
      data: {
        schoolId,
        userId: assignment.student.userId,
        invoice_no: invoiceNo,
        invoice_date: new Date(),
        due_date: row.dueDate,
        currency: school?.currency ?? "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: row.amount,
        total: row.amount,
        status: "UNPAID",
        feeAssignmentId,
        notes:
          rows.length > 1
            ? `${row.description} — auto-generated from enrollment`
            : "Auto-generated from enrollment",
        items: {
          create: {
            schoolId,
            item_name: row.description,
            quantity: 1,
            price: row.amount,
            total: row.amount,
          },
        },
      },
    })
    created++
  }

  return { invoicesCreated: created }
}

async function generateUniqueInvoiceNumber(
  client: DbClient,
  schoolId: string,
  installmentNumber?: number
): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = "ENR"
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    const candidate = installmentNumber
      ? `${prefix}-${year}-${suffix}-${installmentNumber}`
      : `${prefix}-${year}-${suffix}`
    const exists = await client.userInvoice.findFirst({
      where: { schoolId, invoice_no: candidate },
      select: { id: true },
    })
    if (!exists) return candidate
  }
  return `${prefix}-${year}-${Date.now()}${installmentNumber ? `-${installmentNumber}` : ""}`
}
