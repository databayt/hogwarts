// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import { FineForm } from "@/components/school-dashboard/finance/fees/fine-form"

export const metadata = { title: "Issue Fine" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewFinePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

  const students = await db.student.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true },
    orderBy: { givenName: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Issue Fine</h1>
          <p className="text-muted-foreground">Issue a fine to a student</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${lang}/finance/fees/fines`}>Back</Link>
        </Button>
      </div>

      <FineForm students={students} lang={lang} />
    </div>
  )
}
