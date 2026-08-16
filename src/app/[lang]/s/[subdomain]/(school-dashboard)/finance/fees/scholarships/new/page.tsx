// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { ScholarshipForm } from "@/components/school-dashboard/finance/fees/scholarship-form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.scholarshipForm?.createScholarship ||
      "Create Scholarship",
  }
}

export default async function NewScholarshipPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.scholarshipForm
  const { schoolId, can } = await resolveFinanceAccess("fees", ["create"])

  if (!schoolId) notFound()

  if (!can.create) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {d?.createScholarship ?? "Create Scholarship"}
          </h1>
          <p className="text-muted-foreground">
            {d?.defineNewScholarship ?? "Define a new scholarship program"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${lang}/finance/fees/scholarships`}>
            {d?.back ?? "Back"}
          </Link>
        </Button>
      </div>

      <ScholarshipForm lang={lang} />
    </div>
  )
}
