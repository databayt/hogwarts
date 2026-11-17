// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

/**
 * A guardian's per-child assignments now live on the role-based
 * `/assignments` page, which opens on this child (`?child=`).
 */
export default async function ChildAssignmentsPage({ params }: Props) {
  const { id, lang } = await params
  redirect(`/${lang}/assignments?child=${encodeURIComponent(id)}`)
}
