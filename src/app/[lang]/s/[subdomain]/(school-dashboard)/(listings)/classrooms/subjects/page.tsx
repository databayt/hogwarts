// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import SubjectRoomContent from "@/components/school-dashboard/listings/classrooms/subjects/content"

export const metadata = { title: "Dashboard: Classroom Subjects" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  return <SubjectRoomContent lang={lang} />
}
