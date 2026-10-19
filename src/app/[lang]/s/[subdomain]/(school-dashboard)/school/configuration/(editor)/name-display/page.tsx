// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { isNameDisplay, NAME_DISPLAY_DEFAULT } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigNameDisplayForm } from "@/components/school-dashboard/school/configuration/config-name-display-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.["name-display"]
        ?.title || "Configuration: Name Display",
  }
}

export default async function NameDisplayPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: { nameDisplay: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigNameDisplayForm
      schoolId={schoolId || ""}
      initialNameDisplay={
        isNameDisplay(school?.nameDisplay)
          ? school.nameDisplay
          : NAME_DISPLAY_DEFAULT
      }
      lang={lang}
    />
  )
}
