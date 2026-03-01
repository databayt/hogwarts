// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigVisibilityForm } from "@/components/school-dashboard/school/configuration/config-visibility-form"

export const metadata = { title: "Configuration: Visibility" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function VisibilityPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  return (
    <ConfigVisibilityForm
      schoolId={schoolId || ""}
      initialVisibility="full-transparency"
      dictionary={dictionary}
    />
  )
}
