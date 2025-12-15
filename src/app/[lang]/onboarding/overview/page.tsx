import React from "react"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StepsOverviewClient from "@/components/onboarding/overview/steps-overview-client"

interface Props {
  params: Promise<{ lang: Locale }>
}

const OverviewPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="h-screen overflow-hidden">
      <StepsOverviewClient
        dictionary={dictionary.school.onboarding.overview}
        lang={lang}
      />
    </div>
  )
}

export default OverviewPage
