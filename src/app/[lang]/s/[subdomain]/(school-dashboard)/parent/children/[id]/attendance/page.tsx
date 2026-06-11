// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ParentAttendanceContent } from "@/components/school-dashboard/parent-portal/attendance/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

// ParentAttendanceContent loads ALL the guardian's children + attendance
// internally. The dynamic [id] segment here ties this page to one child for
// URL/breadcrumb consistency, but the rendered view shows the full picture.
// A per-child filter inside the view will land alongside the i18n pass.
export default async function ChildAttendancePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ParentAttendanceContent lang={lang} dictionary={dictionary} />
}
