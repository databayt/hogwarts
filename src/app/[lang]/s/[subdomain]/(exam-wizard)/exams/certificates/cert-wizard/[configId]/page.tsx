// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  CertWizardClient,
  type ExistingCertConfig,
} from "@/components/school-dashboard/exams/wizard/cert-wizard/client"

export const metadata = { title: "Edit Certificate Template" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; configId: string }>
}

export default async function EditCertWizardPage({ params }: Props) {
  const { lang, configId } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) return null

  const config = await db.examCertificateConfig.findUnique({
    where: { id: configId, schoolId },
  })

  if (!config) {
    return notFound()
  }

  const existingConfig: ExistingCertConfig = {
    id: config.id,
    name: config.name,
    type: config.type,
    description: config.description,
    templateStyle: config.templateStyle,
    orientation: config.orientation,
    pageSize: config.pageSize,
    titleText: config.titleText,
    titleTextAr: config.titleTextAr,
    bodyTemplate: config.bodyTemplate,
    bodyTemplateAr: config.bodyTemplateAr,
    minPercentage: config.minPercentage,
    minGrade: config.minGrade,
    topPercentile: config.topPercentile,
    signatures: config.signatures as ExistingCertConfig["signatures"],
    useSchoolLogo: config.useSchoolLogo,
    borderStyle: config.borderStyle,
    enableVerification: config.enableVerification,
    verificationPrefix: config.verificationPrefix,
    compositionConfig: config.compositionConfig as Record<
      string,
      unknown
    > | null,
    regionPreset: config.regionPreset,
  }

  return (
    <CertWizardClient
      lang={lang}
      dictionary={dictionary}
      schoolId={schoolId}
      existingConfig={existingConfig}
    />
  )
}
