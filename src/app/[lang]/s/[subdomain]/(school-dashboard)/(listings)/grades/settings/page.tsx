// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DocumentsContent from "@/components/school-dashboard/documents/content"
import { getSchoolScale } from "@/components/school-dashboard/grades/lib/scale"
import { ScaleEditor } from "@/components/school-dashboard/grades/settings/scale-editor"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary.school.grades.navSettings }
}

/**
 * How the school grades: the scale (letters and GPA every grade is given),
 * then the school's own report-card templates the documents are filled from.
 */
export default async function GradeSettingsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = dictionary.school.grades.settings
  const { schoolId, role } = await getTenantContext()
  if (!schoolId) return null

  const [scale, customCount] = await Promise.all([
    getSchoolScale(schoolId),
    db.gradeBoundary.count({ where: { schoolId } }),
  ])

  return (
    <div className="space-y-12">
      <section className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </div>
        <ScaleEditor
          scale={scale}
          isCustom={customCount > 0}
          canEdit={role === "ADMIN" || role === "DEVELOPER"}
        />
      </section>
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.templatesTitle}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t.templatesDescription}
          </p>
        </div>
        <DocumentsContent lang={lang} categories={["REPORT_CARD"]} />
      </section>
    </div>
  )
}
