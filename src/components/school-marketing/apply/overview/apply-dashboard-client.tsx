"use client"

import React from "react"
import { useRouter } from "next/navigation"

import { type DraftApplication } from "./application-card"
import ApplicationDashboard from "./application-dashboard"

interface ApplyDashboardClientProps {
  userName?: string
  draftApplications: DraftApplication[]
  campaignId: string
  dictionary: any
  lang: string
  subdomain: string
}

export default function ApplyDashboardClient({
  userName,
  draftApplications,
  campaignId,
  dictionary,
  lang,
  subdomain,
}: ApplyDashboardClientProps) {
  const router = useRouter()

  const handleResumeDraft = (sessionToken: string) => {
    const draft = draftApplications.find((d) => d.sessionToken === sessionToken)
    if (draft) {
      router.push(
        `/${lang}/apply/overview?id=${draft.campaignId || campaignId}`
      )
    }
  }

  const handleCreateNew = () => {
    router.push(`/${lang}/apply/overview?id=${campaignId}`)
  }

  const handleCreateFromTemplate = () => {
    // TODO: implement profile import flow
    router.push(`/${lang}/apply/overview?id=${campaignId}`)
  }

  return (
    <ApplicationDashboard
      userName={userName}
      draftApplications={draftApplications}
      onResumeDraft={handleResumeDraft}
      onCreateNew={handleCreateNew}
      onCreateFromTemplate={handleCreateFromTemplate}
      dictionary={dictionary}
      locale={lang}
    />
  )
}
