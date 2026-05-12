// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { previewTransportFees } from "../actions/fees"
import { TransportationEmptyState } from "../empty-state"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function TransportationFeesContent({ locale, dictionary }: Props) {
  const t = dictionary.transportation
  const result = await previewTransportFees()

  if (!result.success) {
    return (
      <TransportationEmptyState
        title={t.fees.title}
        description={t.errors.internalError}
      />
    )
  }

  const { fees, totalActiveAssignments, totalMonthlyRevenue } = result.data
  const currency = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">{t.fees.title}</h2>
        <p className="text-muted-foreground text-sm">{t.fees.subtitle}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.fees.totalActive}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalActiveAssignments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t.fees.totalRecurring}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {currency.format(totalMonthlyRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.fees.perRoute}</CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.fees.noFees}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.assignments.fields.student}</TableHead>
                  <TableHead>{t.assignments.fields.route}</TableHead>
                  <TableHead className="text-end">
                    {t.routes.fields.monthlyFee}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((fee) => (
                  <TableRow key={fee.studentId}>
                    <TableCell className="font-medium">
                      {fee.firstName} {fee.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fee.routes.map((r) => r.routeName).join(", ")}
                    </TableCell>
                    <TableCell className="text-end font-mono">
                      {currency.format(fee.monthlyTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
