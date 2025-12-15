import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AcademicContent from "@/components/site/academic/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/site/metadata"
import { getCurrentDomain } from "@/components/site/utils"

interface AcademicProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: AcademicProps): Promise<Metadata> {
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

export default async function Academic({ params }: AcademicProps) {
  const { lang, subdomain } = await params
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
      <AcademicContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  )
}
