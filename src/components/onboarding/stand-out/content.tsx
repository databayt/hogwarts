"use client"

import React from "react"
import Image from "next/image"

import { useHostValidation } from "@/components/onboarding/host-validation-context"
import HostStepHeader from "@/components/onboarding/step-header"

interface Props {
  dictionary?: any
}

export default function StandOutContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const { enableNext } = useHostValidation()

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext()
  }, [enableNext])

  const illustration = (
    <div className="relative mx-auto flex h-[200px] w-full max-w-xl items-center justify-center overflow-hidden rounded-xl sm:w-3/4 sm:rounded-2xl">
      <Image
        src="https://www-cdn.anthropic.com/images/4zrzovbb/website/521a945a74f2d25262db4a002073aaeec9bc1919-1000x1000.svg"
        alt="Stand Out"
        fill
        className="object-contain"
        priority
      />
    </div>
  )

  return (
    <div className="">
      <div className="w-full">
        <HostStepHeader
          stepNumber={5}
          title={
            dict.whatMakesYourSchoolUnique ||
            "What makes your school stand out?"
          }
          description={
            dict.uniqueFeaturesDescription ||
            "Tell us about the unique features, programs, and qualities that make your school special and help it attract the right students and families."
          }
          illustration={illustration}
          dictionary={dictionary}
        />
      </div>
    </div>
  )
}
