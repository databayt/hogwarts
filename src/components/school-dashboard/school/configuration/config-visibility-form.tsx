"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { Check } from "lucide-react"

interface Props {
  schoolId: string
  initialVisibility: string
  dictionary?: any
}

export function ConfigVisibilityForm({
  schoolId,
  initialVisibility,
  dictionary,
}: Props) {
  const [selectedOption, setSelectedOption] = useState(initialVisibility)
  const [saved, setSaved] = useState(false)
  const dict = (dictionary as any)?.school?.onboarding || {}

  const options = [
    {
      id: "full-transparency",
      title: dict.fullTransparency || "Full transparency",
      description:
        dict.fullTransparencyDescription ||
        "Share attendance reports, announcements, and academic progress with all relevant parties.",
    },
    {
      id: "limited-sharing",
      title: dict.limitedSharing || "Limited sharing",
      description:
        dict.limitedSharingDescription ||
        "Share only essential information and require approval for detailed reports.",
    },
  ]

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId)
    setSaved(true)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`w-full rounded-xl border p-4 text-start transition-all duration-200 sm:p-5 ${
            selectedOption === option.id
              ? "border-foreground bg-accent"
              : "border-border hover:border-foreground/50"
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="mt-1 flex-shrink-0">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 sm:h-5 sm:w-5 ${
                  selectedOption === option.id
                    ? "border-foreground bg-foreground"
                    : "border-muted-foreground bg-background"
                }`}
              >
                {selectedOption === option.id && (
                  <div className="bg-background h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-medium sm:text-base">
                {option.title}
              </h5>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                {option.description}
              </p>
            </div>
          </div>
        </button>
      ))}

      {saved && (
        <div className="flex items-center gap-2 text-sm text-green-500">
          <Check className="h-4 w-4" />
          Saved
        </div>
      )}
    </div>
  )
}
