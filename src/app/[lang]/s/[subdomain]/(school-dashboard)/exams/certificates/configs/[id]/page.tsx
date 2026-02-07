/**
 * Edit Certificate Config Page
 * Edit an existing certificate configuration
 */

import { notFound } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { CertificateConfigForm } from "@/components/school-dashboard/exams/certificates/config-form"

interface EditConfigPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
    id: string
  }>
}

export default async function EditConfigPage({ params }: EditConfigPageProps) {
  const { lang, id } = await params
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const isRtl = lang === "ar"

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {isRtl ? "غير مصرح" : "Unauthorized"}
        </p>
      </div>
    )
  }

  const config = await db.examCertificateConfig.findFirst({
    where: {
      id,
      schoolId,
    },
    include: {
      certificates: {
        select: { id: true },
      },
      _count: {
        select: { certificates: true },
      },
    },
  })

  if (!config) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isRtl ? "تعديل إعداد الشهادة" : "Edit Certificate Configuration"}
        </h1>
        <p className="text-muted-foreground">{config.name}</p>
      </div>

      {/* Form */}
      <CertificateConfigForm
        initialData={{
          id: config.id,
          name: config.name,
          type: config.type,
          description: config.description,
          templateStyle: config.templateStyle,
          orientation: config.orientation,
          titleText: config.titleText,
          titleTextAr: config.titleTextAr,
          bodyTemplate: config.bodyTemplate,
          bodyTemplateAr: config.bodyTemplateAr,
          minPercentage: config.minPercentage,
          minGrade: config.minGrade,
          topPercentile: config.topPercentile,
          signatures: (config.signatures as any) || [],
          useSchoolLogo: config.useSchoolLogo,
          customLogo: config.customLogo,
          borderStyle: config.borderStyle,
          expiryMonths: config.expiryMonths,
          enableVerification: config.enableVerification,
          verificationPrefix: config.verificationPrefix,
        }}
      />
    </div>
  )
}
