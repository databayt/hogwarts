// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { createDraftGeneratedExam } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/wizard-actions"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.generate?.pageTitle || "Generate Exam" }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  if (!session?.user) redirect(`/${lang}/exams/generate`)

  const { schoolId } = await getTenantContext()
  if (!schoolId) redirect(`/${lang}/exams/generate`)

  const result = await createDraftGeneratedExam()

  if (!result.success || !result.data) {
    const error = encodeURIComponent(result.error || "Failed to create exam")
    redirect(`/${lang}/exams/generate?error=${error}`)
  }

  redirect(`/${lang}/exams/generate/add/${result.data.id}/template`)
}
