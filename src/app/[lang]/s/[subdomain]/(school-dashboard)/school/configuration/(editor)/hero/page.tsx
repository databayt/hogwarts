// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { ConfigHeroForm } from "@/components/school-dashboard/school/configuration/config-hero-form"

export const metadata = { title: "Configuration: Hero Image" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function HeroPage({ params }: Props) {
  const { lang } = await params
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
    />
  )
}
