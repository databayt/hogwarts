import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter"
import ParentsContent from "@/components/platform/listings/parents/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/site/metadata"
import { getCurrentDomain } from "@/components/site/utils"

interface ParentsProps {
  params: Promise<{ subdomain: string; lang: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: ParentsProps): Promise<Metadata> {
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

export default async function Parents({ params, searchParams }: ParentsProps) {
  const { subdomain, lang } = await params
  const dictionary = await getDictionary(lang)
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data
  const dict = dictionary.school.parents

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <div className="space-y-6">
        <PageHeadingSetter title={dict.title} />
        <ParentsContent
          searchParams={searchParams}
          dictionary={dictionary}
          lang={lang}
        />
      </div>
    </div>
  )
}
