// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import type { NameFormat } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigNameFormatForm } from "@/components/school-dashboard/school/configuration/config-name-format-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.["name-format"]?.title ||
      "Configuration: Name Format",
  }
}

export default async function NameFormatPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: { nameFormat: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigNameFormatForm
      schoolId={schoolId || ""}
      initialNameFormat={(school?.nameFormat as NameFormat) ?? "full"}
      dictionary={dictionary}
    />
  )
}
