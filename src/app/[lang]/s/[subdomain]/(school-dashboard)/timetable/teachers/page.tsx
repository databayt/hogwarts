// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import AssignmentsContent from "@/components/school-dashboard/timetable/assignments/content"

export const metadata = { title: "Dashboard: Assign Teachers" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  return <AssignmentsContent lang={lang} />
}
