/**
 * Invoices Seed
 * Creates sample invoices and payments
 *
 * Phase 10: Fees & Invoices (continued)
 *
 * Note: UserInvoice model requires userId field
 * - status uses InvoiceStatus enum: PAID, UNPAID, OVERDUE, CANCELLED (not PENDING)
 * - Has @@unique([schoolId, invoice_no])
 */

import type { PrismaClient } from "@prisma/client"

import type { StudentRef, UserRef } from "./types"
import { logSuccess, randomNumber } from "./utils"

// ============================================================================
// SAMPLE INVOICES (10 only as specified)
// ============================================================================

/**
 * Seed sample user invoices
 * Note: InvoiceStatus enum uses UNPAID (not PENDING)
 */
export async function seedInvoices(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let invoiceCount = 0

  // Get an admin user for the userId field
  const adminUser = adminUsers.find((u) => u.role === "ADMIN") || adminUsers[0]
  if (!adminUser) {
    logSuccess("Sample Invoices", 0, "no admin user found")
    return 0
  }

  // Only create 10 sample invoices
  const sampleStudents = students.slice(0, 10)

  for (let i = 0; i < sampleStudents.length; i++) {
    const student = sampleStudents[i]
    const invoiceNo = `INV-2025-${String(i + 1).padStart(4, "0")}`
    const invoiceDate = new Date("2025-09-01")
    const dueDate = new Date("2025-09-30")

    // Invoice amounts by position (different levels)
    const amounts = [
      15000, 18000, 22000, 28000, 15000, 18000, 22000, 28000, 20000, 25000,
    ]
    const amount = amounts[i]

    try {
      // Check if invoice exists (using unique constraint)
      const existing = await prisma.userInvoice.findUnique({
        where: {
          schoolId_invoice_no: {
            schoolId,
            invoice_no: invoiceNo,
          },
        },
      })

      if (existing) continue

      // Create "From" address (school)
      const fromAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: "Hogwarts Academy",
          email: "accounts@demo.databayt.org",
          address1: "123 Education Street",
          address2: "Khartoum, Sudan",
        },
      })

      // Create "To" address (student/guardian)
      const toAddress = await prisma.userInvoiceAddress.create({
        data: {
          schoolId,
          name: `${student.givenName} ${student.surname}`,
          email: `student${i + 1}@databayt.org`,
          address1: `${randomNumber(1, 100)} Student Lane`,
          address2: "Khartoum, Sudan",
        },
      })

      // Create the invoice (UNPAID not PENDING)
      const invoice = await prisma.userInvoice.create({
        data: {
          schoolId,
          invoice_no: invoiceNo,
          invoice_date: invoiceDate,
          due_date: dueDate,
          currency: "SDG",
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          sub_total: amount,
          discount: i % 3 === 0 ? amount * 0.1 : null, // 10% discount for every 3rd
          tax_percentage: null,
          total: i % 3 === 0 ? amount * 0.9 : amount,
          notes:
            "Please pay by the due date. Contact accounts for payment plans.",
          status: i < 5 ? "PAID" : "UNPAID", // UNPAID not PENDING
          userId: adminUser.id, // Required field
        },
      })

      // Create invoice items
      await prisma.userInvoiceItem.create({
        data: {
          schoolId,
          invoiceId: invoice.id,
          item_name: "Tuition Fee - Term 1 2025-2026",
          quantity: 1,
          price: amount * 0.7,
          total: amount * 0.7,
        },
      })

      await prisma.userInvoiceItem.create({
        data: {
          schoolId,
          invoiceId: invoice.id,
          item_name: "Registration Fee",
          quantity: 1,
          price: amount * 0.1,
          total: amount * 0.1,
        },
      })

      await prisma.userInvoiceItem.create({
        data: {
          schoolId,
          invoiceId: invoice.id,
          item_name: "Activities & Lab Fees",
          quantity: 1,
          price: amount * 0.2,
          total: amount * 0.2,
        },
      })

      invoiceCount++
    } catch {
      // Skip if invoice already exists (from duplicate invoice_no)
    }
  }

  logSuccess("Sample Invoices", invoiceCount, "with items and addresses")

  // Seed expense receipts
  await seedExpenseReceipts(prisma, schoolId, adminUser.id)

  return invoiceCount
}

// ============================================================================
// EXPENSE RECEIPTS
// ============================================================================

const RECEIPT_DATA = [
  {
    merchant: "مكتبة النيل الأزرق",
    summary: "شراء كتب ومراجع دراسية",
    amount: 5500,
    category: "educational",
  },
  {
    merchant: "شركة الخرطوم للكهرباء",
    summary: "فاتورة كهرباء شهر أكتوبر",
    amount: 12000,
    category: "utilities",
  },
  {
    merchant: "شركة المياه الوطنية",
    summary: "فاتورة مياه شهر أكتوبر",
    amount: 3500,
    category: "utilities",
  },
  {
    merchant: "مؤسسة التقنية الحديثة",
    summary: "صيانة أجهزة الحاسوب",
    amount: 8000,
    category: "technology",
  },
  {
    merchant: "شركة الصيانة المتكاملة",
    summary: "صيانة مكيفات الفصول",
    amount: 15000,
    category: "maintenance",
  },
  {
    merchant: "مطبعة السودان",
    summary: "طباعة أوراق امتحانات الفصل الأول",
    amount: 4000,
    category: "supplies",
  },
  {
    merchant: "مؤسسة الإمداد التعليمي",
    summary: "مستلزمات مختبر العلوم",
    amount: 22000,
    category: "equipment",
  },
  {
    merchant: "شركة النقل المدرسي",
    summary: "إيجار حافلات للرحلة الميدانية",
    amount: 9000,
    category: "transport",
  },
  {
    merchant: "مطعم الأندلس",
    summary: "تغذية فعالية يوم المعلم",
    amount: 6500,
    category: "events",
  },
  {
    merchant: "شركة الأمان للحراسة",
    summary: "خدمات أمنية شهر نوفمبر",
    amount: 7000,
    category: "security",
  },
]

async function seedExpenseReceipts(
  prisma: PrismaClient,
  schoolId: string,
  userId: string
): Promise<void> {
  // Clean existing
  await prisma.expenseReceipt.deleteMany({ where: { schoolId } })

  let count = 0

  for (let i = 0; i < RECEIPT_DATA.length; i++) {
    const receipt = RECEIPT_DATA[i]
    const transactionDate = new Date("2025-10-01")
    transactionDate.setDate(transactionDate.getDate() + i * 7) // Weekly spread

    try {
      await prisma.expenseReceipt.create({
        data: {
          schoolId,
          userId,
          fileName: `receipt_${String(i + 1).padStart(3, "0")}.pdf`,
          fileDisplayName: `إيصال - ${receipt.merchant}`,
          fileUrl: `/uploads/receipts/receipt_${String(i + 1).padStart(3, "0")}.pdf`,
          fileSize: randomNumber(50000, 500000),
          mimeType: "application/pdf",
          status: i < 7 ? "processed" : "pending",
          merchantName: receipt.merchant,
          transactionDate,
          transactionAmount: receipt.amount,
          currency: "SDG",
          receiptSummary: receipt.summary,
          items: [
            {
              name: receipt.summary,
              quantity: 1,
              unitPrice: receipt.amount,
              totalPrice: receipt.amount,
            },
          ],
        },
      })
      count++
    } catch {
      // Skip
    }
  }

  logSuccess("Expense Receipts", count, "with OCR data")
}
