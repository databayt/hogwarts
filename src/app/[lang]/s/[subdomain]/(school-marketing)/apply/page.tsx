import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getActiveCampaigns,
  getDraftApplicationsByUser,
} from "@/components/school-marketing/admission/actions"
import CampaignSelectorContent from "@/components/school-marketing/admission/portal/campaign-selector-content"
import { EnrollmentClosed } from "@/components/school-marketing/admission/portal/enrollment-closed"

interface ApplyPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: ApplyPageProps): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    return { title: "Apply" }
  }

  return {
    title: `Apply - ${result.data.name}`,
    description: `Apply for admission to ${result.data.name}. Start your application today.`,
  }
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { lang, subdomain } = await params
  const [dictionary, schoolResult, campaignsResult, session] =
    await Promise.all([
      getDictionary(lang),
      getSchoolBySubdomain(subdomain),
      getActiveCampaigns(subdomain),
      auth(),
    ])

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const campaigns = campaignsResult.success ? campaignsResult.data || [] : []

  // K-12 auto-skip: single active campaign → go straight to overview
  if (campaigns.length === 1) {
    redirect(`/${lang}/apply/overview?id=${campaigns[0].id}`)
  }

  // No active campaigns → show enrollment closed
  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-xl px-3 sm:px-4">
          <EnrollmentClosed
            school={schoolResult.data}
            dictionary={dictionary}
            lang={lang}
            subdomain={subdomain}
          />
        </div>
      </div>
    )
  }

  // Fetch draft applications for authenticated users
  let draftApplications: Awaited<
    ReturnType<typeof getDraftApplicationsByUser>
  >["data"] = []
  if (session?.user?.id) {
    const draftsResult = await getDraftApplicationsByUser(
      subdomain,
      session.user.id
    )
    if (draftsResult.success && draftsResult.data) {
      draftApplications = draftsResult.data
    }
  }

  // 2+ campaigns → show selector (rare for K-12)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4">
        <CampaignSelectorContent
          school={schoolResult.data}
          campaigns={campaigns}
          dictionary={dictionary}
          lang={lang}
          subdomain={subdomain}
          draftApplications={draftApplications || []}
        />
      </div>
    </div>
  )
}
