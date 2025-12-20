/**
 * Certificate Configs Page
 * List all certificate configurations
 */

import Link from "next/link"
import { auth } from "@/auth"
import { Plus } from "lucide-react"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { CertificateConfigList } from "@/components/platform/exams/certificates/config-list"

interface ConfigsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ConfigsPage({ params }: ConfigsPageProps) {
  const { lang } = await params
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

  const configs = await db.examCertificateConfig.findMany({
    where: { schoolId },
    include: {
      certificates: {
        select: { id: true },
      },
      _count: {
        select: { certificates: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isRtl ? "إعدادات الشهادات" : "Certificate Configurations"}
          </h1>
          <p className="text-muted-foreground">
            {isRtl
              ? "إدارة قوالب وإعدادات الشهادات"
              : "Manage certificate templates and settings"}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/exams/certificates/configs/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {isRtl ? "إعداد جديد" : "New Configuration"}
          </Link>
        </Button>
      </div>

      {/* Config List */}
      <CertificateConfigList configs={configs} locale={lang} />
    </div>
  )
}
