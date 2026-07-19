// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

interface LineItem {
  name: string
  amount: number
}

export interface PayslipData {
  slipNumber: string
  payPeriodStart: Date
  payPeriodEnd: Date
  payDate: Date
  status: string
  baseSalary: number
  allowances: LineItem[]
  grossSalary: number
  taxAmount: number
  socialSecurityAmount: number
  otherDeductions: LineItem[]
  totalDeductions: number
  netSalary: number
  daysWorked: number
  employeeName: string
}

interface Props {
  slip: PayslipData
  currency: string
  lang: Locale
  /** finance.payslip dictionary slice. */
  labels?: Record<string, string>
  statusLabels?: Record<string, string>
}

/**
 * The salary-slip breakdown a staff member (or an admin) reads: earnings,
 * deductions — including the now-withheld social security — and net pay. A
 * presentational server component so a payslip PDF can reuse it later.
 */
export function PayslipBreakdown({
  slip,
  currency,
  lang,
  labels,
  statusLabels,
}: Props) {
  const money = (n: number) => formatCurrency(n, lang, currency)

  const Row = ({
    label,
    value,
    strong,
    muted,
  }: {
    label: string
    value: string
    strong?: boolean
    muted?: boolean
  }) => (
    <div
      className={`flex items-center justify-between py-1 ${
        strong ? "border-t pt-2 font-medium" : ""
      }`}
    >
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={muted ? "text-muted-foreground" : ""}>{value}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{slip.employeeName}</h3>
          <p className="text-muted-foreground text-sm">
            {slip.slipNumber} · {formatDate(slip.payPeriodStart, lang)} —{" "}
            {formatDate(slip.payPeriodEnd, lang)}
          </p>
        </div>
        <Badge variant={slip.status === "PAID" ? "default" : "secondary"}>
          {statusLabels?.[slip.status] ?? slip.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {labels?.earnings || "Earnings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Row
              label={labels?.baseSalary || "Base salary"}
              value={money(slip.baseSalary)}
            />
            {slip.allowances.map((a, i) => (
              <Row key={i} label={a.name} value={money(a.amount)} muted />
            ))}
            <Row
              label={labels?.grossPay || "Gross pay"}
              value={money(slip.grossSalary)}
              strong
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {labels?.deductions || "Deductions"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Row
              label={labels?.incomeTax || "Income tax"}
              value={money(slip.taxAmount)}
            />
            <Row
              label={labels?.socialSecurity || "Social security"}
              value={money(slip.socialSecurityAmount)}
            />
            {slip.otherDeductions.map((d, i) => (
              <Row key={i} label={d.name} value={money(d.amount)} muted />
            ))}
            <Row
              label={labels?.totalDeductions || "Total deductions"}
              value={money(slip.totalDeductions)}
              strong
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-between py-4">
          <span className="font-medium">{labels?.netPay || "Net pay"}</span>
          <span className="text-2xl font-bold">{money(slip.netSalary)}</span>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        {labels?.payDate || "Pay date"}: {formatDate(slip.payDate, lang)} ·{" "}
        {labels?.daysWorked || "Days worked"}: {slip.daysWorked}
      </p>
    </div>
  )
}
