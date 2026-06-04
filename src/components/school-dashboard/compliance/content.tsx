// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { ComplianceProvider } from "@prisma/client"

import type { Locale } from "@/components/internationalization/config"
import { getComplianceDictionary } from "@/components/internationalization/dictionaries"

import { getComplianceConfigForSchool, listRecentSubmissions } from "./queries"
import { SettingsForm } from "./settings-form"
import { SubmissionsTable } from "./submissions-table"

interface ComplianceContentProps {
  locale: Locale
  schoolId: string
  schoolCountry: string | null
}

export async function ComplianceContent({
  locale,
  schoolId,
  schoolCountry,
}: ComplianceContentProps) {
  const dict = await getComplianceDictionary(locale)
  const [config, submissions] = await Promise.all([
    getComplianceConfigForSchool(schoolId, ComplianceProvider.ADEK_ESIS),
    listRecentSubmissions(schoolId, 30),
  ])

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {dict.compliance.title}
        </h1>
        <p className="text-muted-foreground">{dict.compliance.subtitle}</p>
        {schoolCountry && schoolCountry !== "AE" ? (
          <p className="text-muted-foreground text-sm">
            {/* Generic regulator hint for non-UAE schools */}
            country: <code>{schoolCountry}</code>
          </p>
        ) : null}
      </header>

      <SettingsForm
        dict={dict.compliance}
        provider={ComplianceProvider.ADEK_ESIS}
        initial={config}
      />

      <SubmissionsTable dict={dict.compliance} submissions={submissions} />
    </div>
  )
}
