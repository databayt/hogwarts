// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    title:
      dictionary?.finance?.accountsPage?.journalEntries || "Journal Entries",
  }
}

export default async function JournalEntriesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const ap = dictionary?.finance?.accountsPage
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

  const [entries, schoolForCurrency] = await Promise.all([
    db.journalEntry.findMany({
      where: { schoolId },
      orderBy: { entryDate: "desc" },
      take: 50,
      include: {
        ledgerEntries: { select: { debit: true, credit: true } },
        fiscalYear: { select: { name: true } },
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
          {ap?.journalEntries || "Journal Entries"}
        </h3>
        <Link
          href={`/${lang}/finance/accounts/journal/new`}
          className={cn(buttonVariants(), "max-md:rounded-full")}
        >
          {ap?.newJournalEntry || "New Journal Entry"}
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {ap?.noJournalEntriesYet || "No journal entries yet."}
        </p>
      ) : (
        // Phone: one grey grouped list; each entry's amount and status drop
        // under its description instead of squeezing it to a word per line.
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl">
          {entries.map((entry) => {
            const totalDebits = entry.ledgerEntries.reduce(
              (sum, le) => sum + Number(le.debit),
              0
            )

            return (
              <Card
                key={entry.id}
                className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none"
              >
                <CardContent className="flex items-center justify-between py-4 max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:px-4 max-md:py-3">
                  <div className="max-md:min-w-0">
                    <p className="font-medium max-md:line-clamp-2">
                      #{entry.entryNumber} &mdash;{" "}
                      {entry.description ||
                        ap?.noDescription ||
                        "No description"}
                    </p>
                    <p className="text-muted-foreground text-sm max-md:text-xs">
                      {formatDate(entry.entryDate, lang)} &middot;{" "}
                      {entry.fiscalYear.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 max-md:justify-between">
                    <p className="font-medium max-md:tabular-nums">
                      {formatCurrency(totalDebits, lang, currency)}
                    </p>
                    <Badge variant={entry.isPosted ? "default" : "secondary"}>
                      {entry.isPosted
                        ? c?.posted || "Posted"
                        : c?.draft || "Draft"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
