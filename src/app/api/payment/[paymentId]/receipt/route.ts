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
        select: { name: true, currency: true, logoUrl: true },
      },
    },
  })

  if (!payment) {
    return jsonError(ACTION_ERRORS.NOT_FOUND, 404)
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
        schoolName: payment.school?.name ?? undefined,
        // P2.4 — brand the PDF with the school's own logo. Signature URL
        // isn't a first-class School field yet; once SchoolBranding gets
        // `signatureUrl`, drop it in here.
        schoolLogoUrl: payment.school?.logoUrl ?? undefined,
      },
      t: {},
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
