import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ContinueApplicationContent from "@/components/school-marketing/admission/portal/continue-application-content"

interface ContinuePageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({
  params,
}: ContinuePageProps): Promise<Metadata> {
  const { subdomain } = await params
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    return { title: "Continue Application" }
  }

  return {
    title: `Continue Application - ${schoolResult.data.name}`,
    description: `Resume your application to ${schoolResult.data.name}.`,
  }
}

export default async function ContinuePage({
  params,
  searchParams,
}: ContinuePageProps) {
  const { lang, subdomain } = await params
  const { token } = await searchParams
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto max-w-lg px-4">
        <ContinueApplicationContent
          school={schoolResult.data}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
          initialToken={token}
        />
      </div>
    </div>
  )
}
