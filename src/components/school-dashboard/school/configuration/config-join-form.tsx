"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { ErrorToast } from "@/components/atom/toast"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { updateJoinAndSharing } from "./actions"
import { SaveStatus } from "./ui/save-status"

interface Props {
  schoolId: string
  initialJoinMethod: string
  dictionary?: any
}

export function ConfigJoinForm({
  schoolId,
  initialJoinMethod,
  dictionary: dictionaryProp,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const [selectedOption, setSelectedOption] = useState(initialJoinMethod)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const dict = (dictionary as any)?.school?.onboarding || {}

  const options = [
    {
      id: "invite-with-codes",
      title: dict.inviteWithCodes || "Invite with registration codes",
      subtitle: dict.inviteWithCodesSubtitle || "Recommended",
      description:
        dict.inviteWithCodesDescription ||
        "Generate invitation codes that teachers, staff, students and parents can use to self-register. You can review and finalizing.",
      recommended: true,
    },
    {
      id: "manual-enrollment",
      title: dict.manualEnrollment || "Manual enrollment",
      description:
        dict.manualEnrollmentDescription ||
        "Add all teachers, staff, and students yourself through the admin panel.",
      recommended: false,
    },
  ]

  const handleSelect = (optionId: string) => {
    if (optionId === selectedOption) return
    const previous = selectedOption
    setSelectedOption(optionId)
    startTransition(async () => {
      const result = await updateJoinAndSharing(schoolId, {
        allowSelfEnrollment: optionId === "invite-with-codes",
      })
      if (result.success) {
        setSavedAt(Date.now())
      } else {
        setSelectedOption(previous)
        ErrorToast(
          (dictionary as any)?.schoolConfig?.status?.error ?? "Couldn't save"
        )
      }
    })
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`w-full rounded-xl border px-4 py-4 text-start transition-all duration-200 sm:px-8 sm:py-5 ${
            selectedOption === option.id
              ? "border-foreground bg-accent"
              : "border-border hover:border-foreground/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h5 className="text-sm font-medium sm:text-base">
                  {option.title}
                </h5>
              </div>
              {option.recommended && (
                <span className="text-xs text-green-500 sm:text-sm">
                  {option.subtitle}
                </span>
              )}
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                {option.description}
              </p>
            </div>
          </div>
        </button>
      ))}

      <SaveStatus pending={isPending} savedAt={savedAt} className="px-1" />
    </div>
  )
}
