// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import { LUMOS_SURFACES } from "@/components/lumos/permissions"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; tab: string }>
}

/** Forwards /lumos/settings/<tab> to the top-level /lumos/<tab> route. */
export default async function LegacySettingsTabPage({ params }: Props) {
  const { lang, tab } = await params

  redirect(
    LUMOS_SURFACES.includes(tab)
      ? `/${lang}/lumos/${tab}`
      : `/${lang}/lumos/dashboard`
  )
}
