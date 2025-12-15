"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"

// import { CalendarCheckmark, LightningBoltIcon } from '@/components/atom/airbnb-icons';

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

const JoinContent = (props: Props) => {
  const { dictionary, lang, id } = props
  const router = useRouter()
  const { isRTL } = useLocale()
  const [selectedOption, setSelectedOption] =
    useState<string>("invite-with-codes")

  const dict = (dictionary as any)?.school?.onboarding || {}

  const bookingOptions = [
    {
      id: "invite-with-codes",
      title: dict.inviteWithCodes || "Invite with registration codes",
      subtitle: dict.inviteWithCodesSubtitle || "Recommended",
      description:
        dict.inviteWithCodesDescription ||
        "Generate invitation codes that teachers, staff, students and parents can use to self-register. You can review and finalizing.",
      // icon: CalendarCheckmark,
      recommended: true,
    },
    {
      id: "manual-enrollment",
      title: dict.manualEnrollment || "Manual enrollment",
      description:
        dict.manualEnrollmentDescription ||
        "Add all teachers, staff, and students yourself through the admin panel.",
      // icon: LightningBoltIcon,
      recommended: false,
    },
  ]

  return (
    <div className="">
      <div className="">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-16">
          {/* Left column - Title and description */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl font-bold">
              {dict.joinPageTitle || "How students"}
              <br /> {dict.joinPageTitleBreak || "join your school"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {dict.joinPageDescription || "You can change this at any time."}{" "}
              <button className="text-foreground underline hover:no-underline">
                {dict.joinLearnMore || "Learn more"}
              </button>
            </p>
          </div>

          {/* Right column - Booking options */}
          <div className="space-y-3 sm:space-y-4 lg:col-span-2">
            {bookingOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full rounded-xl border px-4 py-4 transition-all duration-200 sm:px-8 sm:py-5 ${isRTL ? "text-right" : "text-left"} ${
                  selectedOption === option.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className={`flex items-center ${isRTL ? "space-x-reverse" : ""} space-x-3`}
                    >
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
                  <div className={`flex-shrink-0 ${isRTL ? "mr-3" : "ml-3"}`}>
                    {/* <option.icon size={20} className="sm:w-6 sm:h-6" /> */}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinContent
