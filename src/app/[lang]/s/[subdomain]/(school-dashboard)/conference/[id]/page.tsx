// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LiveClassDetailContent } from "@/components/school-dashboard/conference/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
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

export default async function Page({ params }: Props) {
  const [{ lang, id }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }
  const dictionary = await getDictionary(lang)
  return (
    <LiveClassDetailContent id={id} locale={lang} dictionary={dictionary} />
  )
}
