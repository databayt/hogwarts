// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigTitleForm } from "@/components/school-dashboard/school/configuration/config-title-form"
import { getText } from "@/components/translation/display"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.title?.title ||
      "Configuration: Title",
  }
}

export default async function TitlePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: {
            name: true,
            nameEn: true,
            domain: true,
            preferredLanguage: true,
          },
        })
        .catch(() => null)
    : null

  const storedName = school?.name || ""
  const storedLang = (school?.preferredLanguage || "ar") as "ar" | "en"

  // Resolve the value to render in the editor for the current UI language.
  // When viewing in a non-stored language, prefer the stored translation
  // (e.g. nameEn) and fall back to on-demand translation.
  let displayName = storedName
  if (schoolId && storedName && lang !== storedLang) {
    if (lang === "en" && school?.nameEn) {
      displayName = school.nameEn
    } else {
      const translated = await getText(storedName, storedLang, lang, schoolId)
      if (translated) displayName = translated
    }
  }

  return (
    <ConfigTitleForm
      schoolId={schoolId || ""}
      initialTitle={{
        title: displayName,
        subdomain: school?.domain || "",
      }}
      editLang={lang}
      storedLang={storedLang}
      dictionary={dictionary}
    />
  )
}
