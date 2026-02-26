// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { ParentEventsContent } from "@/components/school-dashboard/parent-portal/events/content"

export const metadata: Metadata = {
  title: "Events | Parent Portal",
  description: "View upcoming school events and manage registrations",
}

export default async function ParentEvents({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  return <ParentEventsContent lang={lang} />
}
