// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { ensureSubjectSelections } from "@/components/catalog/setup"
import { type Locale } from "@/components/internationalization/config"
import { getLabels } from "@/components/translation/person"

import { SubjectsGrid, type SubjectItem } from "./catalog-subjects-grid"
import {
  getStudentIdByUserId,
  getSubjectIdsForStudent,
  getSubjectIdsForTeacher,
  getTeacherIdByUserId,
} from "./queries"

const SELECTION_SELECT = {
  catalogSubjectId: true,
  customName: true,
  subject: {
    select: {
      id: true,
      subjectGroupId: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      grades: true,
      color: true,
      thumbnail: true,
      lang: true,
      totalChapters: true,
      totalLessons: true,
      averageRating: true,
      usageCount: true,
      ratingCount: true,
      status: true,
    },
  },
} as const

interface Props {
  lang: Locale
  level?: string
  studentId?: string
  teacherId?: string
}

export default async function SubjectsContent({
  lang,
  level,
  studentId: propStudentId,
  teacherId: propTeacherId,
}: Props) {
  const { schoolId, role } = await getTenantContext()
  const session = await auth()
  const userId = session?.user?.id
  let subjects: SubjectItem[] = []

  if (schoolId) {
    try {
      // Get school's active catalog selections with their catalog subjects
      let selections = await db.subjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: SELECTION_SELECT,
      })

      // Auto-provision: if no selections exist, the school was likely created
      // without catalog setup completing (e.g. after() callback failed on
      // serverless, or provisioning never ran). Attempt to provision now so
      // the user sees subjects immediately instead of an empty page.
      if (selections.length === 0) {
        try {
          const { provisioned } = await ensureSubjectSelections(schoolId)
          if (provisioned) {
            // Re-fetch after provisioning
            selections = await db.subjectSelection.findMany({
              where: { schoolId, isActive: true },
              select: SELECTION_SELECT,
            })
          }
        } catch (provisionError) {
          console.error(
            "[Subjects] Auto-provision failed:",
            provisionError instanceof Error
              ? provisionError.message
              : String(provisionError)
          )
        }
      }

      // Determine effective student / teacher filter. A student or a teacher
      // always resolves to their own record — the props are how an admin looks
      // at somebody else, and must not let a student widen their own view.
      const isStudent = role === "STUDENT"
      const isTeacher = role === "TEACHER"
      let effectiveStudentId = isStudent || isTeacher ? null : propStudentId
      let effectiveTeacherId = isStudent || isTeacher ? null : propTeacherId
      let filterSubjectIds: Set<string> | null = null

      if (isStudent) {
        effectiveStudentId = userId
          ? await getStudentIdByUserId(schoolId, userId)
          : null
        // A student whose account has no Student record sees nothing rather
        // than the school's whole catalog.
        if (!effectiveStudentId) filterSubjectIds = new Set<string>()
      } else if (isTeacher) {
        effectiveTeacherId = userId
          ? await getTeacherIdByUserId(schoolId, userId)
          : null
      }

      if (filterSubjectIds === null) {
        if (effectiveStudentId) {
          filterSubjectIds = await getSubjectIdsForStudent(
            schoolId,
            effectiveStudentId
          )
        } else if (effectiveTeacherId) {
          filterSubjectIds = await getSubjectIdsForTeacher(
            schoolId,
            effectiveTeacherId
          )
        }
      }

      // Filter selections if student/teacher scope is active
      if (filterSubjectIds !== null) {
        selections = selections.filter((s) =>
          filterSubjectIds!.has(s.catalogSubjectId)
        )
      }

      const customNames = new Map(
        selections
          .filter((s) => s.customName)
          .map((s) => [s.catalogSubjectId, s.customName!])
      )

      // Extract published catalog subjects from selections (deduplicated)
      const seen = new Set<string>()
      const catalogRows = selections
        .map((s) => s.subject)
        .filter((s) => {
          if (!s || s.status !== "PUBLISHED" || seen.has(s.id)) return false
          seen.add(s.id)
          return true
        })

      // If scoped to student/teacher, also fetch any subjects that were assigned
      // directly to classes/timetables/expertise without an active SubjectSelection row
      if (filterSubjectIds !== null && filterSubjectIds.size > 0) {
        const missingIds = Array.from(filterSubjectIds).filter(
          (id) => !seen.has(id)
        )
        if (missingIds.length > 0) {
          const extraSubjects = await db.subject.findMany({
            where: {
              id: { in: missingIds },
              status: "PUBLISHED",
            },
            select: SELECTION_SELECT.subject.select,
          })
          for (const s of extraSubjects) {
            if (s && !seen.has(s.id)) {
              seen.add(s.id)
              catalogRows.push(s)
            }
          }
        }
      }

      // Each catalog subject becomes its own card (individual grade).
      // One batched, deduped resolution for names/departments (no N+1).
      const labels = await getLabels(
        catalogRows.flatMap((s) => [
          customNames.get(s.id) ?? s.name,
          s.department,
        ]),
        lang,
        schoolId!
      )
      subjects = catalogRows.map((s) => {
        const sourceName = customNames.get(s.id) ?? s.name
        return {
          id: s.id,
          slug: s.slug,
          name: labels.get(sourceName) ?? sourceName,
          department: s.department
            ? (labels.get(s.department) ?? s.department)
            : "",
          level: s.levels[0] ?? "ELEMENTARY",
          levels: s.levels,
          grades: s.grades,
          color: s.color,
          imageUrl: getCatalogImageUrl(s.thumbnail, "sm"),
          totalChapters: s.totalChapters,
          totalLessons: s.totalLessons,
          averageRating: s.averageRating,
          usageCount: s.usageCount,
          ratingCount: s.ratingCount,
        }
      })

      if (level) {
        subjects = subjects.filter((s) => s.levels.includes(level))
      }
    } catch (error) {
      // Catalog tables may not exist yet (migrations pending)
      // Log unexpected errors for debugging
      const message = error instanceof Error ? error.message : String(error)
      if (
        !message.includes("does not exist") &&
        !message.includes("relation")
      ) {
        console.error("[Subjects] Unexpected error:", message)
      }
    }
  }

  return (
    <div className="space-y-6">
      <SubjectsGrid subjects={subjects} lang={lang} />
    </div>
  )
}
