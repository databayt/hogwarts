// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { ChildGradesView } from "@/components/school-dashboard/parent-portal/child-grades-view"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildGradesPage({ params }: Props) {
  const { id, lang } = await params
  return <ChildGradesView studentId={id} lang={lang} />
}
