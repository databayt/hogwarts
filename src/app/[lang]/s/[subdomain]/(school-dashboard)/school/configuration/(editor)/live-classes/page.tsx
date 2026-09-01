// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConferenceSettingsPanel } from "@/components/school-dashboard/live/settings-panel"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const section = (
    dictionary?.school?.schoolAdmin?.configSections as
      | Record<string, { title?: string }>
      | undefined
  )?.["live-classes"]
  return { title: section?.title ?? "Configuration: Live classes" }
}

/**
 * The live-classes tab of the school configuration hub. Same panel as
 * `/conference/settings` (the block's own tab) — one source of settings,
 * two doors.
 */
export default async function LiveClassesConfigPage({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!["DEVELOPER", "ADMIN"].includes(role)) redirect(`/${lang}/dashboard`)
  const dictionary = await getDictionary(lang)
  return <ConferenceSettingsPanel lang={lang} dictionary={dictionary} />
}
