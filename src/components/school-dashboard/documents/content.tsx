// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { DocumentTemplateCategory } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { DocumentsManager, RESOLVABLE_SECTIONS } from "./templates-list"

/**
 * Template management, rendered per host block: `/exams/templates` shows the
 * exam-paper + certificate categories, `/grades/templates` shows report cards.
 */
export default async function DocumentsContent({
  lang,
  categories = RESOLVABLE_SECTIONS,
}: {
  lang: Locale
  categories?: DocumentTemplateCategory[]
}) {
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.documents

  const templates = schoolId
    ? await db.documentTemplate.findMany({
        where: { schoolId, isActive: true, category: { in: categories } },
        orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2>{d?.title}</h2>
        <p className="text-muted-foreground text-sm">{d?.description}</p>
      </div>
      <DocumentsManager templates={templates} categories={categories} />
    </div>
  )
}
