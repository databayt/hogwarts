"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"
import { useRouter } from "next/navigation"

import {
  type DraftApplication,
  type SubmittedApplication,
} from "./application-card"
import ApplicationDashboard from "./application-dashboard"

interface ApplyDashboardClientProps {
  userName?: string
  draftApplications: DraftApplication[]
  submittedApplications?: SubmittedApplication[]
  campaignId: string
  dictionary: any
  lang: string
  subdomain: string
}

export default function ApplyDashboardClient({
  userName,
  draftApplications,
  submittedApplications = [],
  campaignId,
  dictionary,
  lang,
  subdomain,
}: ApplyDashboardClientProps) {
  const router = useRouter()

  const handleViewOffer = (application: SubmittedApplication) => {
    if (!application.offerToken) return
    // Clean client URL — never include /s/[subdomain] (subdomain URL rule)
    router.push(
      `/${lang}/application/${application.id}/offer?token=${encodeURIComponent(application.offerToken)}`
    )
  }

  const handleResumeDraft = (sessionToken: string) => {
    const draft = draftApplications.find((d) => d.sessionToken === sessionToken)
    if (draft) {
      // Resume straight into the wizard with the draft's session token so
      // ApplySessionProvider can rehydrate the saved formData, instead of
      // routing through the marketing overview page (which drops the token
      // and always starts a blank application).
      router.push(
        `/${lang}/application/${draft.campaignId || campaignId}/attachments?token=${encodeURIComponent(draft.sessionToken)}`
      )
    }
  }

  const handleCreateNew = () => {
    router.push(`/${lang}/application/overview?id=${campaignId}`)
  }

  const handleCreateFromTemplate = () => {
    // TODO: implement profile import flow
    router.push(`/${lang}/application/overview?id=${campaignId}`)
  }

  return (
    <ApplicationDashboard
      userName={userName}
      draftApplications={draftApplications}
      submittedApplications={submittedApplications}
      onResumeDraft={handleResumeDraft}
      onViewOffer={handleViewOffer}
      onCreateNew={handleCreateNew}
      onCreateFromTemplate={handleCreateFromTemplate}
      dictionary={dictionary}
      locale={lang}
    />
  )
}
