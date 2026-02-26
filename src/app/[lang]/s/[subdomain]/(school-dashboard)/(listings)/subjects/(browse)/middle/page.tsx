// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import SubjectsContent from "@/components/school-dashboard/listings/subjects/content"

export const metadata = { title: "Dashboard: Middle Subjects" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  return <SubjectsContent lang={lang} level="MIDDLE" />
}
