// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payslip PDF endpoint. Returns a PDF for one SalarySlip, tenant-scoped.
 *
 * Access mirrors the on-screen detail page (finance/payroll/slips/[id]):
 * the slip's OWNER (teacher.userId === session.user.id) OR a caller with
 * payroll:view. Salary is PII — a non-owner without the permission gets 403,
 * not 404, so slip IDs can't be enumerated.
 */
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"
import { PayslipDocument } from "@/components/school-dashboard/finance/payroll/payslip/payslip-document"

interface RouteContext {
  params: Promise<{ id: string }>
}

type Line = { name: string; amount: number }
const asLines = (v: unknown): Line[] =>
  Array.isArray(v)
    ? v.map((x) => ({
        name: String((x as Line)?.name ?? ""),
        amount: Number((x as Line)?.amount ?? 0),
      }))
    : []

const LABELS: Record<string, Record<string, string>> = {
  en: {
    payslip: "Payslip",
    employee: "Employee",
    payPeriod: "Pay period",
    payDate: "Pay date",
    status: "Status",
    earnings: "Earnings",
    baseSalary: "Base salary",
    grossPay: "Gross pay",
    deductions: "Deductions",
    incomeTax: "Income tax",
    socialSecurity: "Social security",
    totalDeductions: "Total deductions",
    netPay: "Net pay",
    footerNote: "This is a computer-generated payslip. No signature required.",
  },
  ar: {
    payslip: "قسيمة الراتب",
    employee: "الموظف",
    payPeriod: "فترة الدفع",
    payDate: "تاريخ الدفع",
    status: "الحالة",
    earnings: "المستحقات",
    baseSalary: "الراتب الأساسي",
    grossPay: "إجمالي الراتب",
    deductions: "الاستقطاعات",
    incomeTax: "ضريبة الدخل",
    socialSecurity: "الضمان الاجتماعي",
    totalDeductions: "إجمالي الاستقطاعات",
    netPay: "صافي الراتب",
    footerNote: "هذه قسيمة راتب صادرة إلكترونياً. لا تتطلب توقيعاً.",
  },
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params

  const session = await auth()
  if (!session?.user?.id) return jsonError(ACTION_ERRORS.NOT_AUTHENTICATED, 401)

  const { schoolId } = await getTenantContext()
  if (!schoolId) return jsonError(ACTION_ERRORS.MISSING_SCHOOL, 400)

  const slip = await db.salarySlip.findFirst({
    where: { id, schoolId },
    include: {
      teacher: { select: { userId: true, firstName: true, lastName: true } },
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
  if (!slip) return jsonError(ACTION_ERRORS.NOT_FOUND, 404)

  const isOwner = slip.teacher?.userId === session.user.id
  const isFinance = await checkFinancePermission(
    session.user.id,
    schoolId,
    "payroll",
    "view"
  )
  if (!isOwner && !isFinance) {
    return jsonError(ACTION_ERRORS.UNAUTHORIZED, 403)
  }

  const lang = slip.school?.preferredLanguage === "ar" ? "ar" : "en"
  const currency = slip.school?.currency ?? "USD"
  const fmtDate = (d: Date) => d.toISOString().split("T")[0]

  const buffer = await renderToBuffer(
    PayslipDocument({
      t: LABELS[lang],
      data: {
        slipNumber: slip.slipNumber,
        employeeName:
          [slip.teacher?.firstName, slip.teacher?.lastName]
            .filter(Boolean)
            .join(" ") || "—",
        payPeriod: `${fmtDate(slip.payPeriodStart)} — ${fmtDate(slip.payPeriodEnd)}`,
        payDate: fmtDate(slip.payDate),
        status: slip.status,
        currency,
        locale: lang === "ar" ? "ar-SD" : "en-US",
        baseSalary: Number(slip.baseSalary),
        allowances: asLines(slip.allowances),
        grossSalary: Number(slip.grossSalary),
        taxAmount: Number(slip.taxAmount),
        socialSecurityAmount: Number(slip.socialSecurityAmount),
        otherDeductions: asLines(slip.otherDeductions),
        totalDeductions: Number(slip.totalDeductions),
        netSalary: Number(slip.netSalary),
        schoolName: slip.school?.name ?? undefined,
        schoolLogoUrl: slip.school?.logoUrl ?? undefined,
      },
    })
  )

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="payslip-${slip.slipNumber}.pdf"`,
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
