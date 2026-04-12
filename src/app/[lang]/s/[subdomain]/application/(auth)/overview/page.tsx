// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ApplyOverviewClient from "@/components/school-marketing/application/overview/apply-overview-client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const apply = d?.school?.admission?.apply
  return {
    title: lang === "ar" ? "التقديم" : "Application",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ id?: string }>
}

const ApplyOverviewPage = async ({ params, searchParams }: Props) => {
  const { lang, subdomain } = await params
  const { id } = await searchParams
  const [dictionary, school] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
  ])

  return (
    <ApplyOverviewClient
      dictionary={dictionary.school.admission}
      lang={lang}
      subdomain={subdomain}
      schoolName={
        (lang === "ar"
          ? school?.data?.name
          : school?.data?.nameEn || school?.data?.name) || subdomain
      }
      id={id}
    />
  )
}

export default ApplyOverviewPage
