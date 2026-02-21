import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { JoinLandingContent } from "@/components/internal-onboarding/content"
import type { Locale } from "@/components/internationalization/config"

interface JoinPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <JoinLandingContent
      schoolId={result.data.id}
      schoolName={result.data.name}
      schoolLogo={result.data.logoUrl}
      subdomain={subdomain}
    />
  )
}
