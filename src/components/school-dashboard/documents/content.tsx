// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"

import { DocumentsManager } from "./templates-list"

export default async function DocumentsContent({ lang }: { lang: Locale }) {
  const isAr = lang === "ar"
  const { schoolId } = await getTenantContext()

  const templates = schoolId
    ? await db.documentTemplate.findMany({
        where: { schoolId, isActive: true },
        orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isAr ? "قوالب المستندات" : "Document templates"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "ارفع قوالب .docx الخاصة بك ونملؤها ببيانات المدرسة — شهادات وأوراق اختبارات."
            : "Upload your own .docx templates and we fill them with school data — certificates and exam papers."}
        </p>
      </div>
      <DocumentsManager templates={templates} />
    </div>
  )
}
