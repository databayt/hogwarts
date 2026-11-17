// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { resolveFamilyStudent } from "@/components/school-dashboard/listings/assignments/access"
import { getAssignment } from "@/components/school-dashboard/listings/assignments/actions"
import { AssignmentDetailContent } from "@/components/school-dashboard/listings/assignments/detail"
import { loadSubmissionReview } from "@/components/school-dashboard/listings/assignments/submissions-core"
import { getStudentSubmission } from "@/components/school-dashboard/listings/assignments/submit-core"
import { assignmentsViewForRole } from "@/components/school-dashboard/listings/assignments/view"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ child?: string | string[] }>
}

/**
 * `/assignments/[id]` — role-based like the list:
 *
 *   staff     the assignment and its hand-ins to mark (a TEACHER only for work
 *             they teach — `loadSubmissionReview`)
 *   student   the assignment and their own hand-in card
 *   guardian  the assignment, read-only, with the child's submission status
 *
 * A student or guardian reaches only what is set for their own (their child's)
 * section or grade — `getAssignment` and `resolveFamilyStudent` both check it,
 * and the answer for anything else is "not found".
 */
export default async function AssignmentDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ lang, id }, sp] = await Promise.all([params, searchParams])
  const childParam = Array.isArray(sp.child) ? sp.child[0] : sp.child
  const [dictionary, session, { schoolId }] = await Promise.all([
    getDictionary(lang),
    auth(),
    getTenantContext(),
  ])
  if (!session?.user?.id) redirect(`/${lang}/login`)

  const userId = session.user.id
  const view = assignmentsViewForRole(session.user.role)
  const family = view === "student" || view === "guardian"

  if (view === "none" || !schoolId) {
    return (
      <AssignmentDetailContent
        data={null}
        error="UNAUTHORIZED"
        lang={lang}
        backHref={`/${lang}/assignments`}
      />
    )
  }

  const [result, familyStudent] = await Promise.all([
    getAssignment({ id, childId: childParam }),
    family
      ? resolveFamilyStudent({
          schoolId,
          userId,
          role: view === "student" ? "STUDENT" : "GUARDIAN",
          assignmentId: id,
          childId: childParam,
        })
      : Promise.resolve(null),
  ])
  const found = result.success && !!result.data

  const submission =
    found && familyStudent
      ? await getStudentSubmission(schoolId, familyStudent.studentId, id)
      : null

  // Staff get the hand-ins to mark.
  const review =
    found && view === "staff"
      ? await loadSubmissionReview({
          schoolId,
          userId,
          role: session.user.role ?? "",
          assignmentId: id,
        })
      : null

  const childQuery =
    familyStudent && view === "guardian"
      ? `?child=${encodeURIComponent(familyStudent.studentId)}`
      : ""

  return (
    <AssignmentDetailContent
      data={(result.success ? result.data : null) ?? null}
      error={result.success ? null : result.error}
      lang={lang}
      backHref={`/${lang}/assignments${childQuery}`}
      viewer={
        familyStudent && found
          ? view === "student"
            ? { role: "STUDENT", submission }
            : {
                role: "GUARDIAN",
                submission,
                childName: familyStudent.childName,
              }
          : undefined
      }
      review={review}
    />
  )
}
