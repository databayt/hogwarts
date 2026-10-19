// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { QuickAssessmentForm } from "@/components/school-dashboard/exams/quick/form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * New quick check (exit ticket, poll, warm-up, check-in). The list's "New
 * Assessment" button linked here while the route did not exist, so a
 * teacher could never author the checks the live room launches.
 */
export default async function NewQuickAssessmentPage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  if (!["DEVELOPER", "ADMIN", "TEACHER"].includes(session?.user?.role ?? "")) {
    redirect(`/${lang}/exams/quick`)
  }
  const dictionary = await getDictionary(lang)
  const t = dictionary?.school?.exams?.quick?.content

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h2>{t?.newAssessment ?? "New Assessment"}</h2>
      <QuickAssessmentForm />
    </div>
  )
}
