// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

// D7 in the plan: do NOT duplicate the messaging UI. The shared
// `(school-messaging)/messages` route already role-dispatches to
// `my_children_teachers` + `admin` categories for GUARDIAN. We just deep-link.
export default async function ParentMessagesPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  redirect(`/${lang}/messages`)
}
