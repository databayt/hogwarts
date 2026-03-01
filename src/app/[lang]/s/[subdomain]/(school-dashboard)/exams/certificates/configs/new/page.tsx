// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * New Certificate Config Page
 * Create a new certificate configuration
 */

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { CertificateConfigForm } from "@/components/school-dashboard/exams/certificates/config-form"

interface NewConfigPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function NewConfigPage({ params }: NewConfigPageProps) {
  const { lang } = await params

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams/certificates`)
  }
  const isRtl = lang === "ar"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isRtl ? "إعداد شهادة جديد" : "New Certificate Configuration"}
        </h1>
        <p className="text-muted-foreground">
          {isRtl
            ? "إنشاء قالب جديد لشهادات الامتحانات"
            : "Create a new template for exam certificates"}
        </p>
      </div>

      {/* Form */}
      <CertificateConfigForm />
    </div>
  )
}
