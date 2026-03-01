// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigTitleForm } from "@/components/school-dashboard/school/configuration/config-title-form"

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
          select: { name: true, domain: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigTitleForm
      schoolId={schoolId || ""}
      initialTitle={{
        title: school?.name || "",
        subdomain: school?.domain || "",
      }}
      dictionary={dictionary}
    />
  )
}
