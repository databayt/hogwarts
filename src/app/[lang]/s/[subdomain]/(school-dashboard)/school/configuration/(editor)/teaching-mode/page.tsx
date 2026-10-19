// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigTeachingModeForm } from "@/components/school-dashboard/school/configuration/config-teaching-mode-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.["teaching-mode"]
        ?.title || "Configuration: Teaching mode",
  }
}

/**
 * In person, live, or both — the one question that decides whether live
 * classes exist at this school. Same column as the first control of the
 * live-classes section; this page is the plain answer, that one the detail.
 */
export default async function TeachingModePage({ params }: Props) {
  const [{ lang }, session, { schoolId }] = await Promise.all([
    params,
    auth(),
    getTenantContext(),
  ])
  if (!["DEVELOPER", "ADMIN"].includes(session?.user?.role ?? "")) {
    redirect(`/${lang}/dashboard`)
  }

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: { conferenceDeliveryMode: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigTeachingModeForm
      initialMode={school?.conferenceDeliveryMode ?? "physical"}
      lang={lang}
    />
  )
}
