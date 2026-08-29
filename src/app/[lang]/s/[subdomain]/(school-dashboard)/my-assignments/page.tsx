// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getMyAssignments } from "@/components/school-dashboard/listings/assignments/my-assignments"
import { MyAssignmentsContent } from "@/components/school-dashboard/listings/assignments/my-assignments-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = (dictionary.school as Record<string, unknown> | undefined)
    ?.myAssignments as { title?: string; description?: string } | undefined
  return {
    title: t?.title ?? "My assignments",
    description: t?.description ?? "Your assignments and what you handed in.",
  }
}

/**
 * `/my-assignments` — the student's side of assignments. The route table
 * already allowed STUDENT/GUARDIAN here; the page never existed, and the
 * teacher's `/assignments/[id]` is closed to students, so until now a
 * student had nowhere to hand anything in.
 */
export default async function Page({ params }: Props) {
  const { lang } = await params
  const [dictionary, session, { schoolId }] = await Promise.all([
    getDictionary(lang),
    auth(),
    getTenantContext(),
  ])
  if (!session?.user?.id) redirect(`/${lang}/login`)
  if (!schoolId) redirect(`/${lang}/dashboard`)

  // Guardians reach this route too; they have no student record, so they get
  // the honest empty state rather than a redirect loop.
  const assignments =
    session.user.role === "STUDENT"
      ? await getMyAssignments(session.user.id, schoolId)
      : []

  return (
    <MyAssignmentsContent
      assignments={assignments}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
