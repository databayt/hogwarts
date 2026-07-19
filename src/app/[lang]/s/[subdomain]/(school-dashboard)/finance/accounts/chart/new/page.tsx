// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

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
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Account</h3>
        <p className="text-muted-foreground text-sm">
          Add a new account to your chart of accounts
        </p>
      </div>
      <p className="text-muted-foreground">
        Account creation form coming soon.
      </p>
      <Link
        href={`/${lang}/finance/accounts/chart`}
        className={buttonVariants({ variant: "outline" })}
      >
        Back to Chart of Accounts
      </Link>
    </div>
  )
}
