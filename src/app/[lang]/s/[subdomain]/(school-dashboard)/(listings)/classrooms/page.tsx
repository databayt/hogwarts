// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import ClassroomsContent from "@/components/school-dashboard/listings/classrooms/content"

export const metadata = { title: "Dashboard: Classrooms" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang, subdomain } = await params

  return <ClassroomsContent lang={lang} subdomain={subdomain} />
}
