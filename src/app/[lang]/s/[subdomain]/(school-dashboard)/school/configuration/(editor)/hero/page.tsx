// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigHeroForm } from "@/components/school-dashboard/school/configuration/config-hero-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.hero?.title ||
      "Configuration: Hero Image",
  }
}

export default async function HeroPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const branding = schoolId
    ? await db.schoolBranding
        .findUnique({
          where: { schoolId },
          select: { heroImageUrl: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigHeroForm
      schoolId={schoolId || ""}
      initialData={{
        heroImageUrl: branding?.heroImageUrl || "",
      }}
      lang={lang}
      dictionary={dictionary}
    />
  )
}
