// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.payslip?.myPayslips || "My Payslips" }
}

export default async function MyPayslipsPage({ params }: Props) {
  const { lang } = await params
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

  // "My" payslips: resolve the caller's own staff record. No finance permission
  // is needed — this is own-data, scoped by the session user, like /fees/my.
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id, schoolId },
    select: { id: true },
  })

  if (!teacher) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {p?.myPayslips || "My Payslips"}
        </h3>
        <p className="text-muted-foreground py-8 text-center">
          {p?.notLinked || "Your account is not linked to a staff record."}
        </p>
      </div>
    )
  }

  const [slips, school] = await Promise.all([
    db.salarySlip.findMany({
      where: { schoolId, teacherId: teacher.id },
      select: {
        id: true,
        slipNumber: true,
        payPeriodStart: true,
        payPeriodEnd: true,
        netSalary: true,
        status: true,
      },
      orderBy: { payDate: "desc" },
      take: 24,
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const currency = school?.currency ?? "USD"

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{p?.myPayslips || "My Payslips"}</h3>

      {slips.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {p?.noPayslips || "You have no payslips yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {slips.map((slip) => (
            <Link
              key={slip.id}
              href={`/${lang}/finance/payroll/slips/${slip.id}`}
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {formatDate(slip.payPeriodStart, lang)} —{" "}
                      {formatDate(slip.payPeriodEnd, lang)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {slip.slipNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {formatCurrency(Number(slip.netSalary), lang, currency)}
                    </span>
                    <Badge
                      variant={slip.status === "PAID" ? "default" : "secondary"}
                    >
                      {statusLabels?.[slip.status] ?? slip.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
