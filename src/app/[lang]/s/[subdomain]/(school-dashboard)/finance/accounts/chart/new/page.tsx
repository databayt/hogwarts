// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
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
    title: dictionary?.finance?.accountsPage?.createAccount || "Create Account",
  }
}

export default async function NewAccountPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const ap = dictionary?.finance?.accountsPage
  const { schoolId, can } = await resolveFinanceAccess("accounts", ["create"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.create) {
    return <FinanceAccessDenied dictionary={dictionary} module="accounts" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{ap?.createAccount}</h3>
        <p className="text-muted-foreground text-sm">{ap?.addNewAccount}</p>
      </div>
      <p className="text-muted-foreground">{ap?.accountFormComingSoon}</p>
      <Link
        href={`/${lang}/finance/accounts/chart`}
        className={buttonVariants({ variant: "outline" })}
      >
        {ap?.backToChartOfAccounts}
      </Link>
    </div>
  )
}
