// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeeStructureForm from "@/components/school-dashboard/finance/fees/form"

export const metadata = { title: "Create Fee Structure" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewFeeStructurePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Fee Structure</h3>
        <p className="text-muted-foreground text-sm">
          Define a new fee structure for your school
        </p>
      </div>
      <FeeStructureForm lang={lang} />
    </div>
  )
}
