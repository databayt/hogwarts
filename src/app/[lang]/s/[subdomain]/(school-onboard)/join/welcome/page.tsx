import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { WelcomeStep } from "@/components/internal-onboarding/steps/welcome"
import type { Locale } from "@/components/internationalization/config"

interface WelcomePageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function WelcomePage({ params }: WelcomePageProps) {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  return <WelcomeStep schoolName={result.data.name} subdomain={subdomain} />
}
