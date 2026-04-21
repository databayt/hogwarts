// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StudentsContent from "@/components/school-dashboard/listings/students/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"

interface StudentsArchivedProps {
  params: Promise<{ subdomain: string; lang: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: StudentsArchivedProps): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain,
  })
}

export default async function StudentsArchived({
  params,
  searchParams,
}: StudentsArchivedProps) {
  const { subdomain, lang } = await params
  const [dictionary, result, sp] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
    searchParams,
  ])

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data
  const forcedSearchParams = Promise.resolve({ ...sp, scope: "archived" })

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <StudentsContent
        school={school}
        searchParams={forcedSearchParams}
        dictionary={dictionary.school}
        lang={lang}
      />
    </div>
  )
}
