// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolDisplayName } from "@/lib/school-name"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getActiveCampaigns,
  getDraftApplicationsByUser,
  getSubmittedApplicationsByUser,
} from "@/components/school-marketing/admission/actions"
import { EnrollmentClosed } from "@/components/school-marketing/admission/portal/enrollment-closed"
import ApplyDashboardClient from "@/components/school-marketing/application/overview/apply-dashboard-client"

interface ApplyPageProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: ApplyPageProps): Promise<Metadata> {
  const { lang, subdomain } = await params
  const [result, d] = await Promise.all([
    getSchoolBySubdomain(subdomain),
    getDictionary(lang),
  ])

  const applyLabel =
    (
      d as Record<string, unknown> & {
        school?: { admission?: { apply?: { title?: string } } }
      }
    )?.school?.admission?.apply?.title ?? (lang === "ar" ? "التقديم" : "Apply")

  if (!result.success || !result.data) {
    return { title: applyLabel }
  }

  const schoolName = getSchoolDisplayName(result.data, lang)

  return {
    title: `${applyLabel} - ${schoolName}`,
    description:
      lang === "ar"
        ? `قدم للقبول في ${schoolName}. ابدأ طلبك اليوم.`
        : `Apply for admission to ${schoolName}. Start your application today.`,
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

  // Auth is enforced by the layout — session.user is guaranteed here

  const campaigns = campaignsResult.success ? campaignsResult.data || [] : []

  // No active campaigns → show enrollment closed
  if (campaigns.length === 0) {
    return (
      <EnrollmentClosed
        school={schoolResult.data}
        dictionary={dictionary}
        lang={lang}
        subdomain={subdomain}
      />
    )
  }

  // Pick campaign (K-12: single, multi: first active)
  const campaignId = campaigns[0].id

  // Fetch draft + submitted applications for authenticated users
  let draftApplications: Awaited<
    ReturnType<typeof getDraftApplicationsByUser>
  >["data"] = []
  let submittedApplications: Awaited<
    ReturnType<typeof getSubmittedApplicationsByUser>
  >["data"] = []
  if (session?.user?.id) {
    const [draftsResult, submittedResult] = await Promise.all([
      getDraftApplicationsByUser(subdomain, session.user.id),
      getSubmittedApplicationsByUser(subdomain, session.user.id),
    ])
    if (draftsResult.success && draftsResult.data) {
      draftApplications = draftsResult.data
    }
    if (submittedResult.success && submittedResult.data) {
      submittedApplications = submittedResult.data
    }
  }

  return (
    <ApplyDashboardClient
      userName={session?.user?.name || undefined}
      draftApplications={draftApplications || []}
      submittedApplications={submittedApplications || []}
      campaignId={campaignId}
      dictionary={dictionary}
      lang={lang}
      subdomain={subdomain}
    />
  )
}
