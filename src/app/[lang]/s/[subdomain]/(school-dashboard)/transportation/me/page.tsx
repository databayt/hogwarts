// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { MyTransportationContent } from "@/components/school-dashboard/transportation/me/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.transportation?.me?.title || "My transportation",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["STUDENT", "GUARDIAN", "DEVELOPER", "ADMIN"]

export default async function Page({ params }: Props) {
  const [{ lang, subdomain }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""

  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)

  return (
    <MyTransportationContent
      locale={lang}
      subdomain={subdomain}
      dictionary={dictionary}
      isGuardian={role === "GUARDIAN"}
    />
  )
}
