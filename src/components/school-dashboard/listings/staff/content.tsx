import { auth } from "@/auth"

import { getModel } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"

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
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <div>No school context</div>
  }

  const page = Number(searchParams.page) || 1
  const perPage = Number(searchParams.perPage) || 20

  // Check if StaffMember model exists (will be null until migration is run)
  const staffModel = getModel("staffMember")

  if (!staffModel) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Staff module requires database migration. Run `pnpm prisma migrate dev`
        to enable.
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

  const data = rows.map(transformStaffToRow)
  const pageCount = Math.ceil(count / perPage)

  return <StaffTable data={data} pageCount={pageCount} locale={locale} />
}
