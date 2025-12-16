"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

const VisibilityContent = (props: Props) => {
  const { dictionary, lang, id } = props
  const router = useRouter()
  const { isRTL } = useLocale()
  const [selectedOption, setSelectedOption] =
    useState<string>("full-transparency")

  const dict = (dictionary as any)?.school?.onboarding || {}

  const guestOptions = [
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

  return (
    <div className="">
      <div className="">
        <FormLayout split="30/70">
          <FormHeading
            title={
              dict.visibilityPageTitle ||
              "Choose your school's information visibility"
            }
            description={
              dict.visibilityPageDescription ||
              "This determines what information is shared with parents and students."
            }
          />
          <div className="space-y-3 sm:space-y-4">
            {guestOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full rounded-xl border p-4 transition-all duration-200 sm:p-5 ${isRTL ? "text-right" : "text-left"} ${
                  selectedOption === option.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                <div
                  className={`flex items-start ${isRTL ? "space-x-reverse" : ""} space-x-3 sm:space-x-4`}
                >
                  {/* Radio button */}
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
                    <div
                      className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}
                    >
                      <h5 className="text-sm font-medium sm:text-base">
                        {option.title}
                      </h5>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </FormLayout>
      </div>
    </div>
  )
}

export default VisibilityContent
