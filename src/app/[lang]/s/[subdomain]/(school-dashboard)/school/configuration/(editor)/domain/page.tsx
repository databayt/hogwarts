// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigDomainForm } from "@/components/school-dashboard/school/configuration/config-domain-form"

export const metadata = { title: "Configuration: Custom Domain" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function DomainPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const [school, domainRequests] = await Promise.all([
    schoolId
      ? db.school
          .findUnique({
            where: { id: schoolId },
            select: { domain: true },
          })
          .catch(() => null)
      : null,
    schoolId
      ? db.domainRequest.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ])

  return (
    <ConfigDomainForm
      currentDomain={school?.domain || ""}
      existingRequests={domainRequests}
      dictionary={dictionary}
    />
  )
}
