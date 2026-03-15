// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GenerateContent from "@/components/school-dashboard/exams/generate/content"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
  searchParams: Promise<{ error?: string }>
}

export default async function GeneratePage({
  params,
  searchParams,
}: PageProps) {
  const { lang } = await params
  const { error } = await searchParams

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams`)
  }

  const dictionary = await getDictionary(lang)

  return <GenerateContent dictionary={dictionary} lang={lang} error={error} />
}
