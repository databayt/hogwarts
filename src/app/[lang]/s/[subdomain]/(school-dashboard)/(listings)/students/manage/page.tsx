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

interface StudentsManageProps {
  params: Promise<{ subdomain: string; lang: Locale }>
}

export async function generateMetadata({
  params,
}: StudentsManageProps): Promise<Metadata> {
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

export default async function StudentsManage({ params }: StudentsManageProps) {
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
        <h3 className="text-foreground">{dict.manage || "Manage Students"}</h3>
        <p className="text-muted-foreground">
          {dict.manageDescription ||
            "Student management features will be available here soon."}
        </p>
        <p className="text-muted-foreground">
          {dict.managePlanned ||
            "Planned features: Bulk operations, class assignments, promotions, transfers, and more."}
        </p>
      </div>
    </div>
  )
}
