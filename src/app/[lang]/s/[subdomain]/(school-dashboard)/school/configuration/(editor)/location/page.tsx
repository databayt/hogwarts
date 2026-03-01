// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigLocationForm } from "@/components/school-dashboard/school/configuration/config-location-form"

export const metadata = { title: "Configuration: Location" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LocationPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: {
            address: true,
            city: true,
            state: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        })
        .catch(() => null)
    : null

  return (
    <ConfigLocationForm
      schoolId={schoolId || ""}
      initialData={{
        address: school?.address || "",
        city: school?.city || "",
        state: school?.state || "",
        country: school?.country || "",
        postalCode: "",
        latitude: school?.latitude ? Number(school.latitude) : 0,
        longitude: school?.longitude ? Number(school.longitude) : 0,
      }}
      dictionary={dictionary}
    />
  )
}
