// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CertWizardClient } from "@/components/school-dashboard/exams/wizard/cert-wizard/client"

export const metadata = { title: "Certificate Wizard" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function CertWizardPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) return null

  return (
    <CertWizardClient lang={lang} dictionary={dictionary} schoolId={schoolId} />
  )
}
