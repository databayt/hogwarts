// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type TeacherRow } from "@/components/school-dashboard/listings/teachers/columns"
import { teachersSearchParams } from "@/components/school-dashboard/listings/teachers/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/teachers/permissions"
import { TeachersTable } from "@/components/school-dashboard/listings/teachers/table"
import { localize } from "@/components/translation/localize"
import { getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary?: Dictionary["school"]
  lang: Locale
}

export default async function TeachersContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await teachersSearchParams.parse(await searchParams)
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  let data: TeacherRow[] = []
  let total = 0

  const teacherModel = getModel("teacher")
  if (schoolId && teacherModel) {
    // Build where clause with filters
    const where: any = {
      schoolId,
      ...(sp.name
        ? {
            OR: [
              { firstName: { contains: sp.name, mode: "insensitive" } },
              { lastName: { contains: sp.name, mode: "insensitive" } },
              { emailAddress: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status === "incomplete"
        ? { wizardStep: { not: null } }
        : sp.status === "ACTIVE" ||
            sp.status === "ON_LEAVE" ||
            sp.status === "TERMINATED" ||
            sp.status === "RETIRED"
          ? { wizardStep: null, employmentStatus: sp.status }
          : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    // Fetch teachers with related data for practical display
    const [rows, count] = await Promise.all([
      teacherModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          // Get primary phone
          phoneNumbers: {
            where: { isPrimary: true },
            take: 1,
            select: { phoneNumber: true },
          },
          // Get primary department
          teacherDepartments: {
            where: { isPrimary: true },
            take: 1,
            include: {
              department: {
                select: {
                  id: true,
                  departmentName: true,
                  lang: true,
                },
              },
            },
          },
          // Get subject expertise count
          subjectExpertise: {
            select: { id: true },
          },
          // Get assigned classes
          classes: {
            select: { id: true },
          },
          // User account status
          user: {
            select: { id: true, email: true },
          },
        },
      }),
      teacherModel.count({ where }),
    ])

    // Transform to enhanced row format. ONE batched resolution per render:
    // teacher names through getNames (compose -> detect script -> dedupe ->
    // translate, transliterate fallback) and department names through
    // localize() — Department is a registered model, so the whole page is a
    // single cache findMany instead of a per-row getText/getName N+1.
    const departments = (rows as any[])
      .map((t: any) => t.teacherDepartments?.[0]?.department)
      .filter(Boolean)
    const [nameTranslations, localizedDepartments] = await Promise.all([
      getNames(rows as any[], (t: any) => t, lang, schoolId!),
      localize("Department", departments, { schoolId, lang }),
    ])
    const departmentNameById = new Map(
      localizedDepartments.map((d: any) => [d.id, d.departmentName])
    )

    data = (rows as any[]).map((t: any) => {
      const primaryDept = t.teacherDepartments?.[0]?.department
      const rawName = fullName(t)

      return {
        id: t.id,
        name: nameTranslations.get(rawName) || rawName,
        firstName: t.firstName || "",
        lastName: t.lastName || "",
        emailAddress: t.emailAddress || "-",
        phone: t.phoneNumbers?.[0]?.phoneNumber || null,
        department: primaryDept
          ? (departmentNameById.get(primaryDept.id) ??
            primaryDept.departmentName)
          : null,
        departmentId: primaryDept?.id || null,
        subjectCount: t.subjectExpertise?.length || 0,
        classCount: t.classes?.length || 0,
        employmentStatus: t.employmentStatus || "ACTIVE",
        employmentType: t.employmentType || "FULL_TIME",
        hasAccount: !!t.userId,
        userId: t.userId || null,
        profilePhotoUrl: t.profilePhotoUrl || null,
        joiningDate: t.joiningDate
          ? (t.joiningDate as Date).toISOString()
          : null,
        wizardStep: t.wizardStep || null,
        createdAt: (t.createdAt as Date).toISOString(),
      }
    })
    total = count as number
  }

  return (
    <div className="space-y-6">
      <TeachersTable
        initialData={data}
        total={total}
        dictionary={dictionary?.teachers}
        lang={lang}
        perPage={sp.perPage}
        permissions={permissions}
      />
    </div>
  )
}
