// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.finance?.accountsPage?.generalLedger || "General Ledger",
  }
}

export default async function GeneralLedgerPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.accountsPage
  const c = dictionary?.finance?.common
  const { schoolId, can } = await resolveFinanceAccess("accounts", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="accounts" />
  }

  const [ledgerEntries, schoolForCurrency] = await Promise.all([
    db.ledgerEntry.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        account: { select: { code: true, name: true, type: true } },
        journalEntry: {
          select: { entryNumber: true, entryDate: true, isPosted: true },
        },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const currency = schoolForCurrency?.currency ?? "USD"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {d?.generalLedger || "General Ledger"}
        </h3>
      </div>
      {ledgerEntries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {d?.noLedgerEntriesYet || "No ledger entries yet."}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{d?.ledgerEntries || "Ledger Entries"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pe-4 text-start font-medium">
                      {d?.journalNumber || "Journal #"}
                    </th>
                    <th className="py-2 pe-4 text-start font-medium">
                      {c?.date || "Date"}
                    </th>
                    <th className="py-2 pe-4 text-start font-medium">
                      {c?.account || "Account"}
                    </th>
                    <th className="py-2 pe-4 text-start font-medium">
                      {c?.type || "Type"}
                    </th>
                    <th className="py-2 pe-4 text-end font-medium">
                      {c?.debit || "Debit"}
                    </th>
                    <th className="py-2 pe-4 text-end font-medium">
                      {c?.credit || "Credit"}
                    </th>
                    <th className="py-2 text-start font-medium">
                      {c?.status || "Status"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pe-4">
                        #{entry.journalEntry.entryNumber}
                      </td>
                      <td className="text-muted-foreground py-2 pe-4">
                        {formatDate(entry.journalEntry.entryDate, lang)}
                      </td>
                      <td className="py-2 pe-4">
                        <span className="font-medium">
                          {entry.account.code}
                        </span>{" "}
                        &mdash; {entry.account.name}
                      </td>
                      <td className="text-muted-foreground py-2 pe-4">
                        {entry.account.type}
                      </td>
                      <td className="py-2 pe-4 text-end">
                        {Number(entry.debit) > 0
                          ? formatCurrency(Number(entry.debit), lang, currency)
                          : "\u2014"}
                      </td>
                      <td className="py-2 pe-4 text-end">
                        {Number(entry.credit) > 0
                          ? formatCurrency(Number(entry.credit), lang, currency)
                          : "\u2014"}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            entry.journalEntry.isPosted
                              ? "default"
                              : "secondary"
                          }
                        >
                          {entry.journalEntry.isPosted
                            ? c?.posted || "Posted"
                            : c?.draft || "Draft"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
