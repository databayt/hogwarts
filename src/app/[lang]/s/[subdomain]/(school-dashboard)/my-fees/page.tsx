// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import MyFeesContent from "@/components/school-dashboard/my-fees/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = (dictionary.school as Record<string, unknown> | undefined)
    ?.myFees as { title?: string; description?: string } | undefined
  return {
    title: t?.title ?? "My Fees",
    description:
      t?.description ??
      "View your assigned fees and pick a preferred payment method.",
  }
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <MyFeesContent lang={lang} dictionary={dictionary} />
}
