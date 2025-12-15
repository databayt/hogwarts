import React from "react"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ApplyClient from "@/components/onboarding/apply/apply-client"

interface Props {
  params: Promise<{ lang: Locale }>
}

const ApplyPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <div className="h-screen overflow-hidden">
      <ApplyClient
        dictionary={dictionary.school.onboarding.apply}
        lang={lang}
      />
    </div>
  )
}

export default ApplyPage
