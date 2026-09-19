// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { RegisterForm } from "@/components/auth/join/form"
import { type Locale } from "@/components/internationalization/config"
import { getAuthDictionary } from "@/components/internationalization/dictionaries"
import { ForgetSavedPages } from "@/components/offline/forget-saved-pages"

interface Props {
  params: Promise<{ lang: Locale }>
}

const RegisterPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getAuthDictionary(lang)

  return (
    <>
      <ForgetSavedPages />
      <RegisterForm dictionary={dictionary} lang={lang} />
    </>
  )
}

export default RegisterPage
