import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface PaymentScheduleEntry {
  dueDate: string
  amount: number
  description?: string
}

type DbClient = typeof db | Prisma.TransactionClient

interface InvoiceLine {
  name: string
  amount: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

// FeeStructure component columns → dictionary key under finance.feeComponents
// (label falls back to English when the key is missing).
const COMPONENT_FIELDS = [
  ["tuitionFee", "Tuition Fee"],
  ["admissionFee", "Admission Fee"],
  ["registrationFee", "Registration Fee"],
  ["examFee", "Exam Fee"],
  ["libraryFee", "Library Fee"],
  ["laboratoryFee", "Laboratory Fee"],
  ["sportsFee", "Sports Fee"],
  ["transportFee", "Transport Fee"],
  ["hostelFee", "Hostel Fee"],
] as const

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
          tuitionFee: true,
          admissionFee: true,
          registrationFee: true,
          examFee: true,
          libraryFee: true,
          laboratoryFee: true,
          sportsFee: true,
          transportFee: true,
          hostelFee: true,
          otherFees: true,
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
    select: {
      name: true,
      address: true,
      currency: true,
      preferredLanguage: true,
    },
  })

  const installments = assignment.feeStructure.installments ?? 1
  const schedule = assignment.feeStructure.paymentSchedule as
    | PaymentScheduleEntry[]
    | null
  const finalAmount = Number(assignment.finalAmount)

  const rows: Array<{
    /** Amount billed by this invoice (its `total`). */
    total: number
    /** Sum of the line items (`sub_total`); differs from `total` only when a
     *  discount reconciles component prices down to `finalAmount`. */
    subTotal: number
    /** Invoice-level discount = subTotal − total, when positive. */
    discount?: number
    dueDate: Date
    description: string
    lines: InvoiceLine[]
  }> = []

  if (installments === 1) {
    // Itemize: one line per non-zero FeeStructure component (plus otherFees
    // entries), reconciled to the authoritative billed amount `finalAmount`
    // via the invoice's own discount field — a real school invoice shows
    // "Tuition / Exam Fee / Library Fee", not one lump line.
    const dictionary = await getDictionary(
      school?.preferredLanguage === "ar" ? "ar" : "en"
    )
    const componentLabels = (dictionary as Record<string, any>)?.finance
      ?.feeComponents as Record<string, string> | undefined

    const lines: InvoiceLine[] = []
    for (const [field, fallback] of COMPONENT_FIELDS) {
      const amount = round2(Number(assignment.feeStructure[field] ?? 0))
      if (!Number.isFinite(amount) || amount <= 0) continue
      lines.push({ name: componentLabels?.[field] || fallback, amount })
    }
    const otherFees = assignment.feeStructure.otherFees as Array<{
      name?: string
      amount?: number
    }> | null
    if (Array.isArray(otherFees)) {
      for (const fee of otherFees) {
        const amount = round2(Number(fee?.amount ?? 0))
        if (!fee?.name || !Number.isFinite(amount) || amount <= 0) continue
        lines.push({ name: fee.name, amount })
      }
    }

    const componentSum = round2(lines.reduce((s, l) => s + l.amount, 0))
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (componentSum <= 0) {
      // No usable component breakdown — keep the lump-sum line.
      rows.push({
        total: finalAmount,
        subTotal: finalAmount,
        dueDate,
        description: assignment.feeStructure.name,
        lines: [{ name: assignment.feeStructure.name, amount: finalAmount }],
      })
    } else if (componentSum > finalAmount) {
      // Scholarship/custom amount below list price → discount reconciles.
      rows.push({
        total: finalAmount,
        subTotal: componentSum,
        discount: round2(componentSum - finalAmount),
        dueDate,
        description: assignment.feeStructure.name,
        lines,
      })
    } else {
      // Custom amount at or above list price → adjustment line tops up.
      if (componentSum < finalAmount) {
        lines.push({
          name: componentLabels?.adjustment || "Adjustment",
          amount: round2(finalAmount - componentSum),
        })
      }
      rows.push({
        total: finalAmount,
        subTotal: finalAmount,
        dueDate,
        description: assignment.feeStructure.name,
        lines,
      })
    }
  } else if (schedule && Array.isArray(schedule) && schedule.length > 0) {
    // The schedule is priced at the structure's list total; the student owes
    // `finalAmount` (an override or a discount moves it), so the instalments
    // are split by the schedule's weights and always sum to finalAmount.
    const amounts = splitByWeights(
      finalAmount,
      schedule.map((entry) => Number(entry.amount))
    )
    schedule.forEach((entry, i) => {
      const amount = amounts[i]
      if (!Number.isFinite(amount) || amount <= 0) return
      const description =
        entry.description ??
        `${assignment.feeStructure.name} — Installment ${i + 1}`
      rows.push({
        total: amount,
        subTotal: amount,
        dueDate: new Date(entry.dueDate),
        description,
        lines: [{ name: description, amount }],
      })
    })
  } else {
    const per = round2(finalAmount / installments)
    let running = 0
    for (let i = 0; i < installments; i++) {
      const isLast = i === installments - 1
      const amount = isLast ? round2(finalAmount - running) : per
      running += amount
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + i + 1)
      const description = `${assignment.feeStructure.name} — Installment ${i + 1} of ${installments}`
      rows.push({
        total: amount,
        subTotal: amount,
        dueDate,
        description,
        lines: [{ name: description, amount }],
      })
    }
  }

  if (rows.length === 0) return { invoicesCreated: 0 }

  // An invoice is a formal document — the full name.
  const studentName = displayName(assignment.student, "full") || "Student"

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
        // The assignment snapshots School.currency at creation (B7, see
        // fee-auto-assign.ts) precisely so a later currency change can't
        // relabel historical amounts. Invoices must inherit that snapshot,
        // not re-read the live school setting — otherwise the invoice and the
        // assignment it belongs to can disagree.
        currency: assignment.currency ?? school?.currency ?? "USD",
        fromAddressId: fromAddress.id,
        toAddressId: toAddress.id,
        sub_total: row.subTotal,
        discount: row.discount,
        total: row.total,
        status: "UNPAID",
        feeAssignmentId,
        notes:
          rows.length > 1
            ? `${row.description} — auto-generated from enrollment`
            : "Auto-generated from enrollment",
        items: {
          create: row.lines.map((line) => ({
            schoolId,
            item_name: line.name,
            quantity: 1,
            price: line.amount,
            total: line.amount,
          })),
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

/**
 * Split `total` across weights (non-finite / negative weights count as 0;
 * all-zero weights split equally). The last share absorbs rounding so the
 * shares always sum to `total` exactly.
 */
export function splitByWeights(total: number, weights: number[]): number[] {
  if (weights.length === 0) return []
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0))
  const sum = clean.reduce((s, w) => s + w, 0)
  const shares = sum > 0 ? clean.map((w) => w / sum) : clean.map(() => 1 / clean.length)
  const out: number[] = []
  let running = 0
  for (let i = 0; i < shares.length; i++) {
    const isLast = i === shares.length - 1
    const amount = isLast ? round2(total - running) : round2(total * shares[i])
    running = round2(running + amount)
    out.push(amount)
  }
  return out
}

/**
 * Re-price the open invoices of an assignment after its `finalAmount` moved
 * (grade fee edited, school fee re-synced, override or discount changed).
 *
 * Invoices already settled (PAID, or with money applied) keep their amounts;
 * the rest of the new amount is split across the still-open ones by their
 * current weights. A single open invoice with no settled siblings takes the
 * whole amount — itemized lines keep their prices and the invoice discount
 * (or an adjustment line) reconciles them, the same shape
 * `ensureInvoicesForAssignment` writes. Instalment invoices carry one line,
 * which is re-priced in place.
 *
 * Returns the number of invoices updated. Never creates invoices — a caller
 * that needs them runs `ensureInvoicesForAssignment`.
 */
export async function resyncAssignmentInvoices(
  client: DbClient,
  schoolId: string,
  feeAssignmentId: string,
  finalAmount: number
): Promise<number> {
  const invoices = await client.userInvoice.findMany({
    where: { schoolId, feeAssignmentId, status: { not: "CANCELLED" } },
    orderBy: { due_date: "asc" },
    select: {
      id: true,
      status: true,
      total: true,
      amountPaid: true,
      items: {
        select: { id: true, item_name: true, price: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (invoices.length === 0) return 0

  const settled = invoices.filter(
    (inv) => inv.status === "PAID" || Number(inv.amountPaid) > 0
  )
  const open = invoices.filter((inv) => !settled.includes(inv))
  if (open.length === 0) return 0

  const settledSum = round2(
    settled.reduce((s, inv) => s + Number(inv.total), 0)
  )
  const remaining = Math.max(round2(finalAmount - settledSum), 0)
  const amounts = splitByWeights(
    remaining,
    open.map((inv) => Number(inv.total))
  )

  let updated = 0
  for (let i = 0; i < open.length; i++) {
    const inv = open[i]
    const amount = amounts[i]
    if (inv.items.length > 1) {
      // Itemized: component prices stay; reconcile to the billed amount.
      const itemSum = round2(
        inv.items.reduce((s, it) => s + Number(it.price), 0)
      )
      if (amount <= itemSum) {
        await client.userInvoice.update({
          where: { id: inv.id },
          data: {
            sub_total: itemSum,
            discount: amount < itemSum ? round2(itemSum - amount) : null,
            total: amount,
          },
        })
      } else {
        await client.userInvoiceItem.create({
          data: {
            schoolId,
            invoiceId: inv.id,
            item_name: "Adjustment",
            quantity: 1,
            price: round2(amount - itemSum),
            total: round2(amount - itemSum),
          },
        })
        await client.userInvoice.update({
          where: { id: inv.id },
          data: { sub_total: amount, discount: null, total: amount },
        })
      }
    } else {
      if (inv.items[0]) {
        await client.userInvoiceItem.update({
          where: { id: inv.items[0].id },
          data: { price: amount, total: amount },
        })
      }
      await client.userInvoice.update({
        where: { id: inv.id },
        data: { sub_total: amount, discount: null, total: amount },
      })
    }
    updated++
  }
  return updated
}
