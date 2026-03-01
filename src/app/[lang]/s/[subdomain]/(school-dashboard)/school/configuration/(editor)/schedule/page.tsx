// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigScheduleForm } from "@/components/school-dashboard/school/configuration/config-schedule-form"

export const metadata = { title: "Configuration: Schedule" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function SchedulePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  return (
    <ConfigScheduleForm
      schoolId={schoolId || ""}
      lang={lang}
      dictionary={dictionary}
    />
  )
}
