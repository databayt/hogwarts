"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useRouter } from "next/navigation"

import type { NameContact } from "@/lib/name-utils"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { useModal } from "@/components/atom/modal/context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { CredentialsDialog, openCredentialsDialog } from "../credentials"
import { deleteStaff } from "./actions"
import { getStaffColumns } from "./columns"
import { type StaffRow } from "./types"

interface StaffTableProps {
  data: StaffRow[]
  pageCount: number
  locale: string
  permissions?: UIPermissions
  /** What the Name cell shows under the name (school setting) */
  nameContact?: NameContact
}

export function StaffTable({
  data,
  pageCount,
  locale,
  permissions = FULL_UI_PERMISSIONS,
  nameContact = "email",
}: StaffTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.staffListing as Record<string, any> | undefined
  const tbl = d?.table as Record<string, string> | undefined
  const credentialsLabels = (dictionary?.school?.students as any)
    ?.credentials as Record<string, string> | undefined

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
          onGenerateCredentials: (id, name, badge) =>
            openCredentialsDialog("staff", id, name, badge),
          permissions,
          nameContact,
        },
        locale,
        d
      ),
    [router, openModal, locale, d, tbl, permissions, nameContact]
  )

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableRowSelection: true,
  })

  return (
    <>
      <DataTable table={table} />
      <CredentialsDialog
        labels={credentialsLabels}
        onClosed={() => router.refresh()}
      />
    </>
  )
}
