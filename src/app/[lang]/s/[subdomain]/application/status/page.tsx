// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAdmissionPortalFlags } from "@/components/school-marketing/admission/actions/portal-flags"
import StatusTrackerContent from "@/components/school-marketing/admission/status/status-tracker-content"

interface StatusPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({
  params,
}: StatusPageProps): Promise<Metadata> {
  const { subdomain } = await params
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Application Status" }
  }

  return {
    title: `Application Status - ${schoolResult.data.name}`,
    description: `Check your application status at ${schoolResult.data.name}.`,
  }
}

export default async function StatusPage({
  params,
  searchParams,
}: StatusPageProps) {
  const { lang, subdomain } = await params
  const { token } = await searchParams
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  // Honor the school's status-tracker toggle (default on when unset).
  const flags = await getAdmissionPortalFlags(schoolResult.data.id)
  if (!flags.enableStatusTracker) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-semibold">
          {lang === "ar"
            ? "تتبع الطلب غير متاح"
            : "Status tracking is unavailable"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "ar"
            ? "خدمة تتبع حالة الطلب غير مفعّلة حالياً لهذه المدرسة."
            : "This school has not enabled online application status tracking."}
        </p>
      </div>
    )
  }

  return (
    <StatusTrackerContent
      school={schoolResult.data}
      dictionary={dictionary}
      lang={lang}
      subdomain={subdomain}
      initialToken={token}
    />
  )
}
