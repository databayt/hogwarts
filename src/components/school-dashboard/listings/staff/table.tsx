"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useRouter } from "next/navigation"

import { useModal } from "@/components/atom/modal/context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteStaff } from "./actions"
import { getStaffColumns } from "./columns"
import { formatStaffName } from "./queries"
import { type StaffRow } from "./types"

interface StaffTableProps {
  data: StaffRow[]
  pageCount: number
  locale: string
}

export function StaffTable({ data, pageCount, locale }: StaffTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.staffListing as Record<string, any> | undefined
  const tbl = d?.table as Record<string, string> | undefined

  const columns = React.useMemo(
    () =>
      getStaffColumns(
        {
          onView: (staff) => {
            const target = staff.userId
              ? `/${locale}/profile/${staff.userId}`
              : `/${locale}/staff/${staff.id}`
            router.push(target)
          },
          onEdit: (staff) => {
            openModal(staff.id)
          },
          onDelete: async (staff) => {
            const msg = tbl?.confirmDelete
              ? tbl.confirmDelete.replace("{name}", staff.name)
              : `Are you sure you want to delete ${staff.name}?`
            if (confirm(msg)) {
              await deleteStaff(staff.id)
            }
          },
        },
        locale,
        d
      ),
    [router, openModal, locale, d, tbl]
  )

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableRowSelection: true,
  })

  return <DataTable table={table} />
}

// Transform database row to table row
export function transformStaffToRow(staff: {
  id: string
  givenName: string
  surname: string
  emailAddress: string
  position: string | null
  employmentStatus: string
  employmentType: string
  userId: string | null
  createdAt: Date
  department?: { departmentName: string } | null
}): StaffRow {
  return {
    id: staff.id,
    userId: staff.userId,
    name: formatStaffName(staff),
    emailAddress: staff.emailAddress,
    position: staff.position || "",
    departmentName: staff.department?.departmentName || "",
    employmentStatus: staff.employmentStatus,
    employmentType: staff.employmentType,
    status: staff.userId ? "active" : "inactive",
    createdAt: staff.createdAt.toISOString(),
  }
}
