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
  return { title: dictionary?.finance?.walletPage?.createWallet }
}

export default async function NewWalletPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const wp = dictionary?.finance?.walletPage

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{wp?.createWallet}</h3>
          <p className="text-muted-foreground text-sm">{wp?.createNewWallet}</p>
        </div>
        <Link
          href={`/${lang}/finance/wallet/all`}
          className={buttonVariants({ variant: "outline" })}
        >
          {wp?.backToWallets}
        </Link>
      </div>
      <p className="text-muted-foreground">{wp?.walletFormComingSoon}</p>
    </div>
  )
}
