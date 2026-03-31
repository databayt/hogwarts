// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"

interface StudentsAnalysisProps {
  params: Promise<{ subdomain: string; lang: Locale }>
}

export async function generateMetadata({
  params,
}: StudentsAnalysisProps): Promise<Metadata> {
  const { subdomain } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain,
  })
}

export default async function StudentsAnalysis({
  params,
}: StudentsAnalysisProps) {
  const { subdomain, lang } = await params
  const dictionary = await getDictionary(lang)
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const dict = dictionary.school.students

  return (
    <div className="bg-card rounded-lg border p-8">
      <div className="space-y-4">
        <h3 className="text-foreground">
          {dict.analysis || "Student Analysis"}
        </h3>
        <p className="text-muted-foreground">
          {dict.analysisDescription ||
            "Student analytics and reporting features will be available here soon."}
        </p>
        <p className="text-muted-foreground">
          {dict.analysisPlanned ||
            "Planned features: Attendance trends, performance analytics, demographic insights, and custom reports."}
        </p>
      </div>
    </div>
  )
}
