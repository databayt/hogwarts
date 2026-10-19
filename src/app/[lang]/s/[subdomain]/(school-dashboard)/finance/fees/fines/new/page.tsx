// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { FineForm } from "@/components/school-dashboard/finance/fees/fine-form"
import { getFeeStudents } from "@/components/school-dashboard/finance/fees/queries"
import { toStudentOptions } from "@/components/school-dashboard/finance/fees/rows"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.feesPage?.issueFine || "Issue Fine" }
}

export default async function NewFinePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.fineForm
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  // A first page for the picker; it searches the rest of the school.
  const students = await toStudentOptions(
    await getFeeStudents(schoolId, { take: 20 }),
    lang,
    schoolId
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {d?.issueFine ?? "Issue Fine"}
          </h1>
          <p className="text-muted-foreground">
            {d?.issueFineDescription ?? "Issue a fine to a student"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${lang}/finance/fees/fines`}>{d?.back ?? "Back"}</Link>
        </Button>
      </div>

      <FineForm students={students} lang={lang} />
    </div>
  )
}
