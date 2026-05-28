// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { ChildAssignmentsView } from "@/components/school-dashboard/parent-portal/child-assignments-view"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildAssignmentsPage({ params }: Props) {
  const { id, lang } = await params
  return <ChildAssignmentsView studentId={id} lang={lang} />
}
