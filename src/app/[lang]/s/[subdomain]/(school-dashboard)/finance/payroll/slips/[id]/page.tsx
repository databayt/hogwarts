// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"
import { PayslipBreakdown } from "@/components/school-dashboard/finance/payroll/payslip/breakdown"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.payslip?.payslip || "Payslip" }
}

type Line = { name: string; amount: number }
const asLines = (v: unknown): Line[] =>
  Array.isArray(v)
    ? v.map((x) => ({
        name: String((x as Line)?.name ?? ""),
        amount: Number((x as Line)?.amount ?? 0),
      }))
    : []

export default async function PayslipPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const p = dictionary?.finance?.payslip as Record<string, string> | undefined
  const statusLabels = dictionary?.finance?.slipStatus as
    | Record<string, string>
    | undefined

  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user?.id || !schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  const slip = await db.salarySlip.findFirst({
    where: { id, schoolId },
    include: {
      teacher: {
        select: { userId: true, firstName: true, lastName: true },
      },
    },
  })
  if (!slip) notFound()

  // Own-data access: the staff member whose slip this is may view it; otherwise
  // it takes the payroll:view finance permission. A slip is salary PII, so a
  // non-owner without that permission is denied — never shown another's pay.
  const isOwner = slip.teacher?.userId === session.user.id
  const isFinance = await checkFinancePermission(
    session.user.id,
    schoolId,
    "payroll",
    "view"
  )
  if (!isOwner && !isFinance) {
    return <FinanceAccessDenied dictionary={dictionary} module="payroll" />
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { currency: true },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/${lang}/finance/payroll/my`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {p?.backToPayslips || "Back to My Payslips"}
        </Link>
        <a
          href={`/api/payroll/slip/${slip.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "sm" })}
        >
          {p?.downloadPdf || "Download PDF"}
        </a>
      </div>
      <PayslipBreakdown
        lang={lang}
        currency={school?.currency ?? "USD"}
        labels={p}
        statusLabels={statusLabels}
        slip={{
          slipNumber: slip.slipNumber,
          payPeriodStart: slip.payPeriodStart,
          payPeriodEnd: slip.payPeriodEnd,
          payDate: slip.payDate,
          status: slip.status,
          baseSalary: Number(slip.baseSalary),
          allowances: asLines(slip.allowances),
          grossSalary: Number(slip.grossSalary),
          taxAmount: Number(slip.taxAmount),
          socialSecurityAmount: Number(slip.socialSecurityAmount),
          otherDeductions: asLines(slip.otherDeductions),
          totalDeductions: Number(slip.totalDeductions),
          netSalary: Number(slip.netSalary),
          daysWorked: slip.daysWorked,
          employeeName: [slip.teacher?.firstName, slip.teacher?.lastName]
            .filter(Boolean)
            .join(" "),
        }}
      />
    </div>
  )
}
