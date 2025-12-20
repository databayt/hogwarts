"use client"

import React from "react"
import Link from "next/link"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react"

interface NewSchoolOptionsProps {
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  dictionary?: any
  locale?: string
}

const NewSchoolOptions: React.FC<NewSchoolOptionsProps> = ({
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.onboarding || {}
  const isRTL = locale === "ar"
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight

  const handleCreateNew = (e: React.MouseEvent) => {
    e.preventDefault()
    onCreateNew?.()
  }

  const handleCreateFromTemplate = (e: React.MouseEvent) => {
    e.preventDefault()
    onCreateFromTemplate?.()
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <h5>{dict.startNewSchool || "Start a new school"}</h5>

      <div className="space-y-2">
        {/* Create a new school */}
        <Link
          href="/onboarding/overview"
          onClick={handleCreateNew}
          className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all sm:min-h-[60px] sm:py-3"
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
              <GraduationCap className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h5>{dict.createNewSchool || "Create a new school"}</h5>
              <p className="muted mt-0.5">
                {dict.createNewSchoolDescription ||
                  "Start from scratch with basic setup"}
              </p>
            </div>
          </div>
          <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
        </Link>

        {/* Create from template */}
        <Link
          href="/onboarding/overview"
          onClick={handleCreateFromTemplate}
          className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all sm:min-h-[60px] sm:py-3"
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
              <BookOpen className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h5>{dict.createFromTemplate || "Create from template"}</h5>
              <p className="muted mt-0.5">
                {dict.createFromTemplateDescription ||
                  "Start with pre-configured settings"}
              </p>
            </div>
          </div>
          <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
        </Link>
      </div>
    </div>
  )
}

export default NewSchoolOptions
