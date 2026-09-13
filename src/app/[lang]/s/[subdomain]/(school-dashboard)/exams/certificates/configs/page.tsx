// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Certificate Configs Page
 * List all certificate configurations
 */

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Plus } from "lucide-react"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CertificateConfigList } from "@/components/school-dashboard/exams/certificates/config-list"

interface ConfigsPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function ConfigsPage({ params }: ConfigsPageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams/certificates`)
  }

  const schoolId = session?.user?.schoolId
  const cfg = dictionary?.school?.exams?.certificates?.config

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">
          {cfg?.unauthorized ?? "Unauthorized"}
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
            {cfg?.pageTitle ?? "Certificate Configurations"}
          </h1>
          <p className="text-muted-foreground">
            {cfg?.pageDescription ??
              "Manage certificate templates and settings"}
          </p>
        </div>
        <Button asChild className="max-md:rounded-full">
          <Link href={`/${lang}/exams/certificates/configs/new`}>
            <Plus className="me-2 h-4 w-4" />
            {cfg?.newConfiguration ?? "New Configuration"}
          </Link>
        </Button>
      </div>

      {/* Config List */}
      <CertificateConfigList
        configs={configs.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          templateStyle: c.templateStyle,
          isActive: c.isActive,
          isDefault: c.isDefault,
          certificateCount: c._count.certificates,
          createdAt: c.createdAt,
        }))}
      />
    </div>
  )
}
