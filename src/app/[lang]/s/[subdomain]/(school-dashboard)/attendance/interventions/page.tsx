// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { InterventionsContent } from "@/components/school-dashboard/attendance/interventions/content"

export const metadata = { title: "Dashboard: Interventions" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  return <InterventionsContent locale={lang} />
}
