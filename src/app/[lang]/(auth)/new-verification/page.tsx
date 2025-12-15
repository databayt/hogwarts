import { Suspense } from "react"

import { NewVerificationForm } from "@/components/auth/verification/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const NewVerificationPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="h-10" />}>
      <NewVerificationForm dictionary={dictionary} lang={lang} />
    </Suspense>
  )
}

export default NewVerificationPage
