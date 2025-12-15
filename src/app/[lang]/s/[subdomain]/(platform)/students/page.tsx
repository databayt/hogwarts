import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StudentsContent from "@/components/platform/students/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/site/metadata"
import { getCurrentDomain } from "@/components/site/utils"

interface StudentsProps {
  params: Promise<{ subdomain: string; lang: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: StudentsProps): Promise<Metadata> {
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

export default async function Students({
  params,
  searchParams,
}: StudentsProps) {
  const { subdomain, lang } = await params
  const dictionary = await getDictionary(lang)
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <StudentsContent
        school={school}
        searchParams={searchParams}
        dictionary={dictionary.school}
        lang={lang}
      />
    </div>
  )
}
