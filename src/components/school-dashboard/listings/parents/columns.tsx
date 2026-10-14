"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ColumnDef } from "@tanstack/react-table"

import type { NameContact } from "@/lib/name-utils"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { NameContactLine } from "@/components/school-dashboard/shared/name-contact-line"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type ParentRow = {
  id: string
  userId: string | null
  name: string
  emailAddress: string
  phone: string | null
  status: string
  createdAt: string
}

export interface ParentColumnCallbacks {
  onDelete?: (row: ParentRow) => void
  onGenerateCredentials?: (
    parentId: string,
    parentName: string,
    badge?: string
  ) => void
  permissions?: UIPermissions
  /** What shows under the name: the phone (default) or the email. */
  nameContact?: NameContact
}

export const getParentColumns = (
  dictionary?: Dictionary["school"]["parents"],
  lang?: Locale,
  callbacks?: ParentColumnCallbacks
): ColumnDef<ParentRow>[] => {
  const permissions = callbacks?.permissions ?? FULL_UI_PERMISSIONS
  const t = {
    name: dictionary?.name || "Name",
    email: dictionary?.email || "Email",
    status: dictionary?.status || "Status",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    active: dictionary?.active || "Active",
    inactive: dictionary?.inactive || "Inactive",
    generateCredentials:
      (dictionary as any)?.generateCredentials || "Generate Credentials",
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const parent = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              <bdi dir="auto">{parent.name}</bdi>
            </span>
            <NameContactLine
              email={parent.emailAddress !== "-" ? parent.emailAddress : null}
              phone={parent.phone}
              prefer={callbacks?.nameContact ?? "phone"}
            />
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "emailAddress",
      id: "emailAddress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email} />
      ),
      meta: { label: t.email, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "active" },
          { label: t.inactive, value: "inactive" },
        ],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(
            lang === "ar" ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const parent = row.original
        const { openModal } = useModal()
        const onEdit = () => openModal(parent.id)
        const onDelete = () => {
          callbacks?.onDelete?.(parent)
        }
        return (
          <ActionMenu srLabel={t.actions}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/parents/${parent.id}`}
            />
            {permissions.showEditAction && (
              <ActionMenuItem label={t.edit} onClick={onEdit} />
            )}
            {permissions.showAddButton && callbacks?.onGenerateCredentials && (
              <ActionMenuItem
                label={t.generateCredentials}
                onClick={() =>
                  callbacks.onGenerateCredentials?.(
                    parent.id,
                    parent.name,
                    dictionary?.guardian || "Guardian"
                  )
                }
              />
            )}
            {permissions.showDeleteAction && (
              <ActionMenuItem label={t.delete} onClick={onDelete} />
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getParentColumns()
// inside useMemo in client components to avoid SSR hook issues.
