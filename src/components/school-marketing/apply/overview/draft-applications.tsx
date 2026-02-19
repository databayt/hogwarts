"use client"

import React from "react"

import { ApplicationCard, type DraftApplication } from "./application-card"

interface DraftApplicationsProps {
  applications: DraftApplication[]
  onContinue: (sessionToken: string) => void
  isRTL?: boolean
  dictionary?: {
    completeYourApplication?: string
    draft?: string
    step?: string
    lastUpdated?: string
    noDrafts?: string
  }
}

export function DraftApplications({
  applications,
  onContinue,
  isRTL = false,
  dictionary,
}: DraftApplicationsProps) {
  const dict = dictionary || {}

  if (applications.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <h5>
        {dict.completeYourApplication ||
          (isRTL ? "أكمل طلبك" : "Complete your application")}
      </h5>
      <div className="space-y-2">
        {applications.map((application) => (
          <ApplicationCard
            key={application.sessionToken}
            application={application}
            onClick={onContinue}
            isRTL={isRTL}
            dictionary={{
              draft: dict.draft,
              step: dict.step,
              lastUpdated: dict.lastUpdated,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DraftApplications
