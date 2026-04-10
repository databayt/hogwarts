// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigTitleForm } from "@/components/school-dashboard/school/configuration/config-title-form"
import { getDisplayText } from "@/components/translation/display"

export const metadata = { title: "Configuration: Title" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
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

  const schoolName = school?.name || ""
  const storedLang = (school?.preferredLanguage || "ar") as "ar" | "en"

  // Translate school name when viewing in a different language
  let translatedTitle: string | undefined
  if (schoolId && schoolName && lang !== storedLang) {
    // Prefer stored English name if available, fall back to on-demand translation
    if (lang === "en" && school?.nameEn) {
      translatedTitle = school.nameEn
    } else {
      translatedTitle = await getDisplayText(
        schoolName,
        storedLang,
        lang,
        schoolId
      )
    }
  }

  return (
    <ConfigTitleForm
      schoolId={schoolId || ""}
      initialTitle={{
        title: schoolName,
        subdomain: school?.domain || "",
      }}
      translatedTitle={translatedTitle}
      dictionary={dictionary}
    />
  )
}
