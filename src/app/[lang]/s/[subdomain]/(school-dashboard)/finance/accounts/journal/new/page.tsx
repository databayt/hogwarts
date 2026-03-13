// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "New Journal Entry" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewJournalEntryPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">New Journal Entry</h3>
        <p className="text-muted-foreground text-sm">
          Record a new journal entry for your school
        </p>
      </div>
      <p className="text-muted-foreground">Journal entry form coming soon.</p>
      <Link
        href={`/${lang}/finance/accounts/journal`}
        className={buttonVariants({ variant: "outline" })}
      >
        Back to Journal Entries
      </Link>
    </div>
  )
}
