"use client"

import React from "react"
import Image from "next/image"

import { useHostValidation } from "@/components/onboarding/host-validation-context"
import HostStepHeader from "@/components/onboarding/step-header"

interface Props {
  dictionary?: any
}

export default function AboutSchoolContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const { enableNext } = useHostValidation()

  // Enable next button for this informational page
  React.useEffect(() => {
    enableNext()
  }, [enableNext])

  const illustration = (
    <div className="relative mx-auto flex h-[200px] w-full max-w-xl items-center justify-center overflow-hidden rounded-xl sm:w-3/4 sm:rounded-2xl">
      <Image
        src="https://www-cdn.anthropic.com/images/4zrzovbb/website/5dfb835ad3cbbf76b85824e969146eac20329e72-1000x1000.svg"
        alt="About School"
        fill
        className="object-contain"
        priority
      />
    </div>
  )

  return (
    <HostStepHeader
      stepNumber={1}
      title={dict.tellUsAboutYourSchool || "Tell us about your school"}
      description={
        dict.aboutSchoolDescription ||
        "In this step, we'll ask you about your school type, location, and student capacity. Then we'll help you set up your academic structure."
      }
      illustration={illustration}
      dictionary={dictionary}
    />
  )
}
