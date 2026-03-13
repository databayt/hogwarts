// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "General Ledger" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function GeneralLedgerPage({ params }: Props) {
  await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const ledgerEntries = await db.ledgerEntry.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      account: { select: { code: true, name: true, type: true } },
      journalEntry: {
        select: { entryNumber: true, entryDate: true, isPosted: true },
      },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">General Ledger</h3>
      </div>
      {ledgerEntries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No ledger entries yet.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ledger Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pe-4 text-start font-medium">
                      Journal #
                    </th>
                    <th className="py-2 pe-4 text-start font-medium">Date</th>
                    <th className="py-2 pe-4 text-start font-medium">
                      Account
                    </th>
                    <th className="py-2 pe-4 text-start font-medium">Type</th>
                    <th className="py-2 pe-4 text-end font-medium">Debit</th>
                    <th className="py-2 pe-4 text-end font-medium">Credit</th>
                    <th className="py-2 text-start font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="py-2 pe-4">
                        #{entry.journalEntry.entryNumber}
                      </td>
                      <td className="text-muted-foreground py-2 pe-4">
                        {new Date(
                          entry.journalEntry.entryDate
                        ).toLocaleDateString()}
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
                          ? `$${Number(entry.debit).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                      <td className="py-2 pe-4 text-end">
                        {Number(entry.credit) > 0
                          ? `$${Number(entry.credit).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={
                            entry.journalEntry.isPosted
                              ? "default"
                              : "secondary"
                          }
                        >
                          {entry.journalEntry.isPosted ? "Posted" : "Draft"}
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
