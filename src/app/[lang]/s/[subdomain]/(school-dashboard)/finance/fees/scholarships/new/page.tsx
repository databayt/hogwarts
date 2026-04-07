// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ScholarshipForm } from "@/components/school-dashboard/finance/fees/scholarship-form"

export const metadata = { title: "Create Scholarship" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewScholarshipPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fees?.scholarship
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

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
