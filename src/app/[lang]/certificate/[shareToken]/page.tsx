// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Public Certificate View Page
 * STUB: Certificate features temporarily disabled due to build issues
 */

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface PublicCertificatePageProps {
  params: Promise<{
    lang: Locale
    shareToken: string
  }>
}

export default async function PublicCertificatePage({
  params,
}: PublicCertificatePageProps) {
  const { lang } = await params
  const isRtl = lang === "ar"
  const dictionary = await getDictionary(lang)
  const t = dictionary.certificate

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t.unavailableTitle}</CardTitle>
          <CardDescription>{t.unavailableDescription}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}
