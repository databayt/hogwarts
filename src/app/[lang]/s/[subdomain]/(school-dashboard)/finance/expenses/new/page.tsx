// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

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
    title: dictionary?.finance?.expensesPage?.submitExpense || "Submit Expense",
  }
}

export default async function NewExpensePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const ep = dictionary?.finance?.expensesPage
  const { schoolId, can } = await resolveFinanceAccess("expenses", ["create"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.create) {
    return <FinanceAccessDenied dictionary={dictionary} module="expenses" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{ep?.submitExpense}</h3>
        <p className="text-muted-foreground text-sm">{ep?.submitNewExpense}</p>
      </div>
      <p className="text-muted-foreground">{ep?.expenseFormComingSoon}</p>
    </div>
  )
}
