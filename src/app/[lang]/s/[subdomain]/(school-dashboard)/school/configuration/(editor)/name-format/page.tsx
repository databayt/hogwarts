// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import type { NameFormat } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"
import { ConfigNameFormatForm } from "@/components/school-dashboard/school/configuration/config-name-format-form"

export const metadata = { title: "Configuration: Name Format" }

export default async function NameFormatPage() {
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
    />
  )
}
