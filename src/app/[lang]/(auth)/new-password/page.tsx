import { Suspense } from "react"

import { NewPasswordForm } from "@/components/auth/password/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const NewPasswordPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="h-10" />}>
      <NewPasswordForm dictionary={dictionary} lang={lang} />
    </Suspense>
  )
}

export default NewPasswordPage
