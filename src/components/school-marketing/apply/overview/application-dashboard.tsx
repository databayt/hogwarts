"use client"

import React from "react"

import { ApplicationCard, type DraftApplication } from "./application-card"
import NewApplicationOptions from "./new-application-options"

interface ApplicationDashboardProps {
  userName?: string
  draftApplications?: DraftApplication[]
  onResumeDraft?: (sessionToken: string) => void
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  dictionary?: any
  locale?: string
}

const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({
  userName = "Applicant",
  draftApplications = [],
  onResumeDraft,
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.apply || {}
  const hasDrafts = draftApplications.length > 0

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 text-lg sm:mb-4 sm:text-xl lg:text-2xl">
          {dict.welcomeStatic || "Welcome"}
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
                dictionary={dictionary}
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
