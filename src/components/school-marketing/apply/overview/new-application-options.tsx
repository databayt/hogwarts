"use client"

import React from "react"
import Link from "next/link"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react"

interface NewApplicationOptionsProps {
  onCreateNew?: () => void
  onCreateFromTemplate?: () => void
  dictionary?: any
  locale?: string
}

const NewApplicationOptions: React.FC<NewApplicationOptionsProps> = ({
  onCreateNew,
  onCreateFromTemplate,
  dictionary,
  locale,
}) => {
  const dict = dictionary?.apply || {}
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
      <h5>{dict.startNewApplication || "Start a new application"}</h5>

      <div className="space-y-2">
        {/* Start from scratch */}
        <Link
          href="/apply/overview"
          onClick={handleCreateNew}
          className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all sm:min-h-[60px] sm:py-3"
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
              <GraduationCap className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h5>{dict.startFromScratch || "Start from scratch"}</h5>
              <p className="muted mt-0.5">
                {dict.startFromScratchDescription ||
                  "Begin a new application with basic setup"}
              </p>
            </div>
          </div>
          <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
        </Link>

        {/* Import from profile */}
        <Link
          href="/apply/overview"
          onClick={handleCreateFromTemplate}
          className="border-border group flex h-auto min-h-[50px] w-full items-center justify-between border-b py-2 transition-all sm:min-h-[60px] sm:py-3"
        >
          <div className="flex items-center gap-2">
            <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10">
              <BookOpen className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1 text-start">
              <h5>{dict.importFromProfile || "Import from profile"}</h5>
              <p className="muted mt-0.5">
                {dict.importFromProfileDescription ||
                  "Auto-fill from documents or LinkedIn"}
              </p>
            </div>
          </div>
          <ChevronIcon className="text-foreground group-hover:text-foreground h-4 w-4 flex-shrink-0 transition-colors sm:h-5 sm:w-5" />
        </Link>
      </div>
    </div>
  )
}

export default NewApplicationOptions
