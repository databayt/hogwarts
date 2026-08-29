// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAssignment } from "@/components/school-dashboard/listings/assignments/actions"
import { AssignmentDetailContent } from "@/components/school-dashboard/listings/assignments/detail"
import { getOwnSubmission } from "@/components/school-dashboard/listings/assignments/submit-core"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { lang, id } = await params
  const [dictionary, result, session, { schoolId }] = await Promise.all([
    getDictionary(lang),
    getAssignment({ id }),
    auth(),
    getTenantContext(),
  ])

  // A student sees their own hand-in surface; everyone else sees the
  // teacher's view unchanged.
  const isStudent = session?.user?.role === "STUDENT" && !!session.user.id
  const submission =
    isStudent && schoolId && result.success && result.data
      ? await getOwnSubmission(session!.user.id, schoolId, id)
      : null

  return (
    <AssignmentDetailContent
      data={(result.success ? result.data : null) ?? null}
      error={result.success ? null : result.error}
      dictionary={dictionary}
      lang={lang}
      viewer={isStudent ? { role: "STUDENT", submission } : undefined}
    />
  )
}
