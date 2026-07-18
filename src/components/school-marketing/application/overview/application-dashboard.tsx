"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import {
  ApplicationCard,
  SubmittedApplicationCard,
  type DraftApplication,
  type SubmittedApplication,
} from "./application-card"
import NewApplicationOptions from "./new-application-options"

interface ApplicationDashboardProps {
  userName?: string
  draftApplications?: DraftApplication[]
  submittedApplications?: SubmittedApplication[]
  onResumeDraft?: (sessionToken: string) => void
  onViewOffer?: (application: SubmittedApplication) => void
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  dictionary?: any
  locale?: string
}

const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({
  userName = "Applicant",
  draftApplications = [],
  submittedApplications = [],
  onResumeDraft,
  onViewOffer,
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.school?.admission?.portal || {}
  const statusDict = dictionary?.school?.admission?.status || {}
  const hasDrafts = draftApplications.length > 0
  const hasSubmitted = submittedApplications.length > 0

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 text-lg sm:mb-4 sm:text-xl lg:text-2xl">
          {dict.welcome || "Welcome"}
        </h3>
      </div>

      {/* Draft applications section */}
      {hasDrafts && (
        <div className="space-y-2 sm:space-y-3">
          <h5>{dict.completeYourApplication || "Complete your application"}</h5>

          <div className="space-y-2">
            {draftApplications.map((application) => (
              <ApplicationCard
                key={application.sessionToken}
                application={application}
                onClick={onResumeDraft}
                isRTL={locale === "ar"}
                dictionary={dict}
              />
            ))}
          </div>
        </div>
      )}

      {/* Submitted applications section — informational, after drafts */}
      {hasSubmitted && (
        <div className="space-y-2 sm:space-y-3">
          <h5>{dict.submittedApplications || "Your applications"}</h5>

          <div className="space-y-2">
            {submittedApplications.map((application) => (
              <SubmittedApplicationCard
                key={application.id}
                application={application}
                onViewOffer={onViewOffer}
                isRTL={locale === "ar"}
                locale={locale}
                dictionary={dict}
                statusDict={statusDict}
              />
            ))}
          </div>
        </div>
      )}

      {/* Start a new application section */}
      <NewApplicationOptions
        onCreateNew={onCreateNew}
        onCreateFromTemplate={onCreateFromTemplate}
        dictionary={dictionary}
        locale={locale}
      />
    </div>
  )
}

export default ApplicationDashboard
