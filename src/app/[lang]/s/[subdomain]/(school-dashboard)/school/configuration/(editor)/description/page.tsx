// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigDescriptionForm } from "@/components/school-dashboard/school/configuration/config-description-form"

export const metadata = { title: "Configuration: Description" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function DescriptionPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: { schoolType: true, schoolLevel: true },
        })
        .catch(() => null)
    : null

  return (
    <ConfigDescriptionForm
      schoolId={schoolId || ""}
      initialData={{
        schoolType:
          (school?.schoolType as
            | "private"
            | "public"
            | "international"
            | "technical"
            | "special") || undefined,
        schoolLevel:
          (school?.schoolLevel as "primary" | "secondary" | "both") ||
          undefined,
      }}
      dictionary={dictionary}
    />
  )
}
