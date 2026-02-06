import { SearchParams } from "nuqs/server"

import { db } from "@/lib/db"
import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { getDisplayName } from "@/lib/transliterate-name"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type TeacherRow } from "@/components/school-dashboard/listings/teachers/columns"
import { teachersSearchParams } from "@/components/school-dashboard/listings/teachers/list-params"
import { TeachersTable } from "@/components/school-dashboard/listings/teachers/table"

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
  const { schoolId } = await getTenantContext()
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
              { givenName: { contains: sp.name, mode: "insensitive" } },
              { surname: { contains: sp.name, mode: "insensitive" } },
              { emailAddress: { contains: sp.name, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(sp.emailAddress
        ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
        : {}),
      ...(sp.status
        ? sp.status === "active"
          ? { employmentStatus: "ACTIVE" }
          : sp.status === "inactive"
            ? { NOT: { employmentStatus: "ACTIVE" } }
            : {}
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

    // Transform to enhanced row format
    data = rows.map((t: any) => {
      const primaryDept = t.teacherDepartments?.[0]?.department
      const departmentName = primaryDept ? primaryDept.departmentName : null

      return {
        id: t.id,
        name: getDisplayName(t.givenName, t.surname, lang),
        givenName: t.givenName || "",
        surname: t.surname || "",
        emailAddress: t.emailAddress || "-",
        phone: t.phoneNumbers?.[0]?.phoneNumber || null,
        department: departmentName,
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
      />
    </div>
  )
}
