// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { NewPasswordForm } from "@/components/auth/password/form"
import { type Locale } from "@/components/internationalization/config"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { getAuthDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const NewPasswordPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getAuthDictionary(lang)

  return (
    <Suspense fallback={<AuthFormSkeleton fields={1} label={dictionary?.common?.loading} />}>
      <NewPasswordForm dictionary={dictionary} lang={lang} />
    </Suspense>
  )
}

export default NewPasswordPage
