// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getModel } from "@/lib/prisma-guards"
import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLabels } from "@/components/translation/person"

import { getUIConfigForRole } from "./permissions"
import { getStaffList } from "./queries"
import { StaffTable, transformStaffToRow } from "./table"

interface StaffContentProps {
  locale: Locale
  searchParams: {
    page?: string
    perPage?: string
    search?: string
    sort?: string
    order?: string
    employmentStatus?: string
    employmentType?: string
    departmentId?: string
  }
}

export async function StaffContent({
  locale,
  searchParams,
}: StaffContentProps) {
  const { schoolId, role } = await getTenantContext()
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  const dictionary = await getDictionary(locale)
  const d = (dictionary?.school as any)?.staffListing as
    | Record<string, any>
    | undefined

  if (!schoolId) {
    return <div>{d?.noSchoolContext || "No school context"}</div>
  }

  const page = Number(searchParams.page) || 1
  const perPage = Number(searchParams.perPage) || 20

  // Check if StaffMember model exists (will be null until migration is run)
  const staffModel = getModel("staffMember")

  if (!staffModel) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        {d?.migrationRequired ||
          "Staff module requires database migration. Run `pnpm prisma migrate dev` to enable."}
      </div>
    )
  }

  const { rows, count } = await getStaffList(schoolId, {
    page,
    perPage,
    search: searchParams.search,
    employmentStatus: searchParams.employmentStatus as any,
    employmentType: searchParams.employmentType as any,
    departmentId: searchParams.departmentId,
    sort: searchParams.sort
      ? [{ id: searchParams.sort, desc: searchParams.order === "desc" }]
      : undefined,
  })

  const rawData = rows.map(transformStaffToRow)

  // Translate text fields for display — one batched, deduped resolution
  // across names/positions/departments. getLabels detects each value's
  // content language from its script (StaffMember has NO `lang` column).
  const labels = await getLabels(
    rawData.flatMap((row) => [row.name, row.position, row.departmentName]),
    locale,
    schoolId!
  )
  const data = rawData.map((row) => ({
    ...row,
    name: labels.get(row.name) ?? row.name,
    position: labels.get(row.position) ?? row.position,
    departmentName: labels.get(row.departmentName) ?? row.departmentName,
  }))

  const pageCount = Math.ceil(count / perPage)

  return (
    <StaffTable
      data={data}
      pageCount={pageCount}
      locale={locale}
      permissions={permissions}
    />
  )
}
