// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payment Receipt PDF endpoint (P1.5).
 *
 * Returns a PDF receipt for a single Payment row, scoped by tenant.
 * Reuses the same React tree as the client-side {@link DownloadReceipt}
 * (see `src/components/school-dashboard/finance/fees/receipt-document.tsx`)
 * so the layout stays in sync.
 *
 * Auth: caller must be authenticated AND
 *   - a finance admin with `fees:view`, OR
 *   - the student tied to the payment, OR
 *   - the guardian tied to the student
 *
 * Currency: rendered from `payment.currency` (P1.1 snapshot) so the receipt
 * stays correct after a school later switches School.currency.
 *
 * Unlocks: email attachments (P2.4 parent receipt delivery), share-via-link
 * for parents, server-side reconciliation receipts (P2.3).
 */
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/payment/currency"
import { getTenantContext } from "@/lib/tenant-context"
import { ReceiptDocument } from "@/components/school-dashboard/finance/fees/receipt-document"
import { checkCurrentUserPermission } from "@/components/school-dashboard/finance/lib/permissions"

interface RouteContext {
  params: Promise<{ paymentId: string }>
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { paymentId } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) {
    return jsonError(ACTION_ERRORS.NOT_AUTHENTICATED, 401)
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return jsonError(ACTION_ERRORS.MISSING_SCHOOL, 400)
  }

  // Load payment with all data needed for the receipt + ownership check
  const payment = await db.payment.findFirst({
    where: { id: paymentId, schoolId },
    select: {
      id: true,
      paymentNumber: true,
      receiptNumber: true,
      amount: true,
      currency: true,
      paymentDate: true,
      paymentMethod: true,
      gatewayMethod: true,
      status: true,
      transactionId: true,
      student: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          studentGuardians: {
            select: { guardian: { select: { userId: true } } },
          },
        },
      },
      feeAssignment: {
        select: {
          academicYear: true,
          feeStructure: { select: { name: true } },
        },
      },
      school: {
        select: {
          name: true,
          currency: true,
          logoUrl: true,
          preferredLanguage: true,
        },
      },
    },
  })

  if (!payment) {
    return jsonError(ACTION_ERRORS.NOT_FOUND, 404)
  }

  // P2.2 — Status guard: only SUCCESS (and REFUNDED for dispute receipts) may
  // produce a PDF receipt. PENDING / PENDING_VERIFICATION / FAILED / CANCELLED
  // must NOT generate a receipt — the payment hasn't cleared.
  const RECEIPT_ALLOWED_STATUSES = ["SUCCESS", "REFUNDED"] as const
  if (
    !RECEIPT_ALLOWED_STATUSES.includes(
      payment.status as (typeof RECEIPT_ALLOWED_STATUSES)[number]
    )
  ) {
    return jsonError("RECEIPT_NOT_AVAILABLE", 409)
  }

  const isFinanceAdmin = await checkCurrentUserPermission(
    schoolId,
    "fees",
    "view"
  )
  if (!isFinanceAdmin) {
    // Parents and the student themselves can fetch their own receipt;
    // anyone else (including unrelated students) gets UNAUTHORIZED rather
    // than NOT_FOUND so a probe can't enumerate payment IDs.
    const isOwnStudent = payment.student?.userId === session.user.id
    const isGuardian = payment.student?.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )
    if (!isOwnStudent && !isGuardian) {
      return jsonError(ACTION_ERRORS.UNAUTHORIZED, 403)
    }
  }

  // Build the receipt data — currency from the payment row (P1.1 snapshot),
  // falling back to school.currency for legacy rows where backfill ran but a
  // race created a null somehow.
  const currency = payment.currency ?? payment.school?.currency ?? "USD"
  const amountFormatted = formatCurrency(Number(payment.amount), currency)

  const studentName = [payment.student?.firstName, payment.student?.lastName]
    .filter(Boolean)
    .join(" ")

  // i18n label map — resolved from school.preferredLanguage.
  // An API route has no access to the dictionary pipeline, so we keep a
  // minimal inline map for the labels that appear in the PDF.
  const lang = payment.school?.preferredLanguage ?? "en"
  const RECEIPT_LABELS: Record<string, Record<string, string>> = {
    en: {
      paymentReceipt: "Payment Receipt",
      paymentDetails: "Payment Details",
      paymentNumber: "Payment Number",
      receiptNumber: "Receipt Number",
      date: "Date",
      method: "Method",
      status: "Status",
      transactionId: "Transaction ID",
      studentInformation: "Student Information",
      student: "Student",
      feeStructure: "Fee Structure",
      academicYear: "Academic Year",
      amountPaid: "Amount Paid",
      authorisedSignature: "Authorised Signature",
      footerNote:
        "This is a computer-generated receipt. No signature required.",
      footerSigned: "Verified by the school's finance office.",
      generating: "Generating...",
      downloadReceipt: "Download Receipt",
    },
    ar: {
      paymentReceipt: "إيصال دفع",
      paymentDetails: "تفاصيل الدفعة",
      paymentNumber: "رقم الدفعة",
      receiptNumber: "رقم الإيصال",
      date: "التاريخ",
      method: "طريقة الدفع",
      status: "الحالة",
      transactionId: "رقم المعاملة",
      studentInformation: "بيانات الطالب",
      student: "الطالب",
      feeStructure: "هيكل الرسوم",
      academicYear: "العام الدراسي",
      amountPaid: "المبلغ المدفوع",
      authorisedSignature: "التوقيع المعتمد",
      footerNote: "هذا إيصال صادر إلكترونياً. لا يتطلب توقيعاً.",
      footerSigned: "تم التحقق من قبل قسم المالية في المدرسة.",
      generating: "جارٍ الإنشاء...",
      downloadReceipt: "تحميل الإيصال",
    },
  }
  const t = RECEIPT_LABELS[lang] ?? RECEIPT_LABELS.en

  const buffer = await renderToBuffer(
    ReceiptDocument({
      data: {
        paymentNumber: payment.paymentNumber,
        receiptNumber: payment.receiptNumber,
        amount: amountFormatted,
        paymentDate: payment.paymentDate.toISOString().split("T")[0],
        // Prefer the gateway-reported method (APPLE_PAY, MADA, KNET) over
        // the enum so the receipt matches what the parent actually used.
        paymentMethod: payment.gatewayMethod ?? payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId ?? undefined,
        studentName: studentName || "—",
        feeStructureName: payment.feeAssignment?.feeStructure?.name ?? "—",
        academicYear: payment.feeAssignment?.academicYear ?? "—",
        // School name + currency come from the school record, not hardcoded.
        schoolName: payment.school?.name ?? undefined,
        // P2.4 — brand the PDF with the school's own logo. Signature URL
        // isn't a first-class School field yet; once SchoolBranding gets
        // `signatureUrl`, drop it in here.
        schoolLogoUrl: payment.school?.logoUrl ?? undefined,
      },
      t,
    })
  )

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="receipt-${payment.receiptNumber}.pdf"`,
      "cache-control": "private, max-age=300",
    },
  })
}

function jsonError(code: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, errorCode: code }), {
    status,
    headers: { "content-type": "application/json" },
  })
}
