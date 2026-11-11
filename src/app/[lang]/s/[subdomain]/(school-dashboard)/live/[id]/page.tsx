// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LiveClassDetailContent } from "@/components/school-dashboard/live/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ view?: string | string[] }>
}

const ALLOWED_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "ACCOUNTANT",
]

export default async function Page({ params, searchParams }: Props) {
  const [{ lang, id }, { view }, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }
  const dictionary = await getDictionary(lang)
  return (
    <LiveClassDetailContent
      id={id}
      locale={lang}
      dictionary={dictionary}
      // `?view=details` asks for this page itself — the room card's "more"
      // link — instead of being sent on to the card (see the component).
      plain={view === "details"}
    />
  )
}
