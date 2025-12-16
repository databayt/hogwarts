"use client"

import React from "react"

import NewSchoolOptions from "./new-school-options"
import SchoolCard from "./school-card"

interface School {
  id: string
  name: string
  startDate: string
  status: "draft" | "pending" | "active"
  subdomain?: string
}

interface SchoolOnboardingDashboardProps {
  userName?: string
  schools?: School[]
  onSchoolClick?: (id: string) => void
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  totalSchools?: number // Total number of schools available
  dictionary?: any
  locale?: string
}

const SchoolOnboardingDashboard: React.FC<SchoolOnboardingDashboardProps> = ({
  userName = "Admin",
  schools = [],
  onSchoolClick,
  onCreateNew,
  onCreateFromTemplate,
  totalSchools,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.onboarding || {}
  const draftSchools = schools.filter((school) => school.status === "draft")
  const hasInProgressSchools = draftSchools.length > 0
  const hasMoreSchools = totalSchools && totalSchools > schools.length

  return (
    <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
      {/* Welcome Header */}
      <div>
        <h3 className="mb-3 text-lg sm:mb-4 sm:text-xl lg:text-2xl">
          {dict.welcomeStatic || "Welcome"}
        </h3>
      </div>

      {/* Finish school setup section */}
      {hasInProgressSchools && (
        <div className="space-y-2 sm:space-y-3">
          <h5>{dict.completeSetup || "Complete your school"}</h5>

          <div className="space-y-2">
            {draftSchools.map((school) => (
              <SchoolCard
                key={school.id}
                id={school.id}
                name={school.name}
                startDate={school.startDate}
                status={school.status}
                subdomain={school.subdomain}
                onClick={onSchoolClick}
                dictionary={dictionary}
              />
            ))}
            {hasMoreSchools && (
              <div className="py-2 text-center">
                <p className="muted">
                  +{totalSchools! - schools.length}{" "}
                  {totalSchools! - schools.length > 1
                    ? dict.moreSchoolsPlural || "more schools"
                    : dict.moreSchools || "more school"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start a new school section */}
      <NewSchoolOptions
        onCreateNew={onCreateNew}
        onCreateFromTemplate={onCreateFromTemplate}
        dictionary={dictionary}
        locale={locale}
      />
    </div>
  )
}

export default SchoolOnboardingDashboard
