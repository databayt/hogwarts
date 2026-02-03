/**
 * New Certificate Config Page
 * Create a new certificate configuration
 */

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
      <CertificateConfigForm locale={lang} />
    </div>
  )
}
