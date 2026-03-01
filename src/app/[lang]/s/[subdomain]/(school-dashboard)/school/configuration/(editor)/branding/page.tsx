// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { ConfigBrandingForm } from "@/components/school-dashboard/school/configuration/config-branding-form"

export const metadata = { title: "Configuration: Branding" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BrandingPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  const [school, branding] = await Promise.all([
    schoolId
      ? db.school
          .findUnique({
            where: { id: schoolId },
            select: { logoUrl: true },
          })
          .catch(() => null)
      : null,
    schoolId
      ? db.schoolBranding
          .findUnique({
            where: { schoolId },
            select: {
              primaryColor: true,
              secondaryColor: true,
              borderRadius: true,
            },
          })
          .catch(() => null)
      : null,
  ])

  return (
    <ConfigBrandingForm
      schoolId={schoolId || ""}
      initialData={{
        logoUrl: school?.logoUrl || "",
        primaryColor: branding?.primaryColor || "",
        secondaryColor: branding?.secondaryColor || "",
        borderRadius: branding?.borderRadius || "md",
      }}
      lang={lang}
    />
  )
}
