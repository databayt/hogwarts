// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ClipboardList } from "lucide-react"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs/server"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

import { getGuardianChildren, pickChild } from "./access"
import { ChildSwitcher } from "./child-switcher"
import { assignmentsSearchParams } from "./list-params"
import {
  getAssignmentsForStudent,
  getMyAssignments,
} from "./my-assignments"
import { MyAssignmentsContent } from "./my-assignments-content"
import StaffAssignmentsContent from "./staff-content"
import { assignmentsViewForRole } from "./view"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
  lang: Locale
}

/**
 * `/assignments` — ONE page, and each role gets its own side of it (the
 * server decides; nothing about the role reaches the client):
 *
 *   ADMIN · TEACHER · STAFF · DEVELOPER   the management table, create, export
 *   STUDENT                               their list, with hand-in
 *   GUARDIAN                              their children's, read-only, with a
 *                                         child switcher past one child
 *   anyone else                           an honest "nothing here" state
 *
 * `/my-assignments` and `/parent/children/[id]/assignments` redirect here.
 */
export default async function AssignmentsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const [session, { schoolId }] = await Promise.all([auth(), getTenantContext()])
  if (!session?.user?.id) redirect(`/${lang}/login`)

  const view = assignmentsViewForRole(session.user.role)

  if (view === "staff") {
    return (
      <StaffAssignmentsContent
        searchParams={searchParams}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  if (view === "student" && schoolId) {
    const assignments = await getMyAssignments(session.user.id, schoolId)
    return (
      <MyAssignmentsContent
        assignments={assignments}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  if (view === "guardian" && schoolId) {
    const [sp, children] = await Promise.all([
      searchParams.then((p) => assignmentsSearchParams.parse(p)),
      getGuardianChildren(session.user.id, schoolId),
    ])
    const child = pickChild(children, sp.child)
    const assignments = child
      ? await getAssignmentsForStudent(schoolId, child.id)
      : []
    const guardianText = ((dictionary?.school?.assignments as any)?.guardian ??
      {}) as Record<string, string>
    return (
      <MyAssignmentsContent
        assignments={assignments}
        dictionary={dictionary}
        lang={lang}
        mode="guardian"
        childName={child?.name}
        childId={child?.id}
        switcher={
          child ? (
            <ChildSwitcher
              items={children}
              activeId={child.id}
              lang={lang}
              label={guardianText.switcherLabel ?? ""}
            />
          ) : undefined
        }
      />
    )
  }

  // ACCOUNTANT, USER, or a signed-in account with no school: nothing to show.
  const none = ((dictionary?.school?.assignments as any)?.none ??
    {}) as Record<string, string>
  return (
    <div className="flex flex-col items-center gap-3 rounded-[36px] border border-dashed px-4 py-16 text-center">
      <PageHeadingSetter title={dictionary?.school?.assignments?.title ?? ""} />
      <ClipboardList
        className="text-muted-foreground size-8"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <p className="font-medium">{none.title}</p>
      <p className="text-muted-foreground max-w-[42ch] text-sm">
        {none.description}
      </p>
    </div>
  )
}
