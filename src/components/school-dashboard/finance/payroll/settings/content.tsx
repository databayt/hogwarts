// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { TriangleAlert } from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

import { resolvePayrollPolicy } from "../country-rules/registry"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function PayrollSettingsContent({
  dictionary,
  lang,
}: Props) {
  const fd = (dictionary as any)?.finance
  const d = fd?.payrollSettings as Record<string, string> | undefined
  const common = fd?.common as Record<string, string> | undefined

  const { schoolId, can } = await resolveFinanceAccess("payroll", ["view"])
  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {common?.schoolNotFound || "School context not found"}
      </p>
    )
  }
  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="payroll" />
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { country: true, timezone: true, currency: true },
  })
  const policy = resolvePayrollPolicy(school ?? {})
  const pct = (n: number) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(n)
  const amount = (n: number) =>
    new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{d?.title}</h3>
        <p className="text-muted-foreground text-sm">{d?.description}</p>
      </div>

      {policy.isFailSafeDefault && (
        <Card className="border-yellow-500/40">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <TriangleAlert className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle className="text-base">
                {d?.notConfiguredTitle}
              </CardTitle>
              <CardDescription>{d?.notConfiguredBody}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{d?.country}</CardTitle>
          <CardDescription>{d?.autoDetected}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant={policy.country ? "default" : "secondary"}>
            {policy.country ?? "—"}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{d?.incomeTaxBrackets}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-start">
                  <th className="py-1 text-start font-medium">{d?.from}</th>
                  <th className="py-1 text-start font-medium">{d?.to}</th>
                  <th className="py-1 text-end font-medium">{d?.rate}</th>
                </tr>
              </thead>
              <tbody>
                {policy.taxBrackets.map((b, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1">{amount(b.from)}</td>
                    <td className="py-1">
                      {b.to === null ? d?.andAbove : amount(b.to)}
                    </td>
                    <td className="py-1 text-end">
                      {b.rate === 0 ? d?.taxFree : `${pct(b.rate)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{d?.socialSecurity}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{d?.employeeRate}</span>
            <span className="font-medium">
              {pct(policy.socialSecurityEmployeeRate)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{d?.employerRate}</span>
            <span className="font-medium">
              {pct(policy.socialSecurityEmployerRate)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
