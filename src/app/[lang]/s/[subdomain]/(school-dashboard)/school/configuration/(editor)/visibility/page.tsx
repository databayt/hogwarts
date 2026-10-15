// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigVisibilityForm } from "@/components/school-dashboard/school/configuration/config-visibility-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.visibility?.title ||
      "Configuration: Visibility",
  }
}

export default async function VisibilityPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const [dictionary, branding] = await Promise.all([
    getDictionary(lang),
    schoolId
      ? db.schoolBranding
          .findUnique({
            where: { schoolId },
            select: { allowSelfEnrollment: true, informationSharing: true },
          })
          .catch(() => null)
      : null,
  ])

  return (
    <ConfigVisibilityForm
      schoolId={schoolId || ""}
      initialVisibility={branding?.informationSharing ?? "limited-sharing"}
      dictionary={dictionary}
    />
  )
}
