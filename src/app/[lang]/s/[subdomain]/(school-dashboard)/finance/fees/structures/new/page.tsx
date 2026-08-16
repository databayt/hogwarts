// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import FeeStructureForm from "@/components/school-dashboard/finance/fees/form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.fees?.form?.createFeeStructure ||
      "Create Fee Structure",
  }
}

export default async function NewFeeStructurePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const f = dictionary?.finance?.fees?.form
  const { schoolId, can } = await resolveFinanceAccess("fees", ["create"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.create) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{f?.createFeeStructure}</h3>
        <p className="text-muted-foreground text-sm">
          {f?.createFeeDescription}
        </p>
      </div>
      <FeeStructureForm lang={lang} />
    </div>
  )
}
