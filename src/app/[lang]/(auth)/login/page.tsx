// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login/form"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale }>
}

const LoginPage = async ({ params }: Props) => {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <Suspense fallback={<div className="h-10" />}>
      <LoginForm dictionary={dictionary} />
    </Suspense>
  )
}

export default LoginPage
