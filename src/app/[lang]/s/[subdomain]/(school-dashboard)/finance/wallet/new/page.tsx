// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Create Wallet" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewWalletPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Create Wallet</h3>
          <p className="text-muted-foreground text-sm">
            Create a new wallet for your school
          </p>
        </div>
        <Link
          href={`/${lang}/finance/wallet/all`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Wallets
        </Link>
      </div>
      <p className="text-muted-foreground">Wallet creation form coming soon.</p>
    </div>
  )
}
