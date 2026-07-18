// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAdmissionPortalFlags } from "@/components/school-marketing/admission/actions/portal-flags"
import AttachmentsContent from "@/components/school-marketing/application/attachments/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.attachments?.title ?? "Attachments"} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.attachments?.description ??
      "Upload photo and documents for your application.",
  }
}

export default async function AttachmentsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  // Surface the school's document requirement ON this step instead of letting
  // the applicant discover it at final submit (DOCUMENTS_REQUIRED), 4 steps late.
  const { schoolId } = await getTenantContext()
  const requireDocuments = schoolId
    ? (await getAdmissionPortalFlags(schoolId)).requireDocuments
    : false
  return (
    <AttachmentsContent
      dictionary={dictionary}
      requireDocuments={requireDocuments}
    />
  )
}
