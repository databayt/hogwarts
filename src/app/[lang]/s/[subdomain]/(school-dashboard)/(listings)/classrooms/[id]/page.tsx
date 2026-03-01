// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import RoomDetailContent from "@/components/school-dashboard/listings/classrooms/detail/content"

export const metadata = { title: "Dashboard: Room Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, subdomain, id } = await params

  return <RoomDetailContent lang={lang} roomId={id} subdomain={subdomain} />
}
