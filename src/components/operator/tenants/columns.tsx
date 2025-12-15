"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import { TenantDetail } from "./detail"

export type TenantRow = {
  id: string
  name: string
  subdomain: string
  isActive: boolean
  planType: "TRIAL" | "BASIC" | "PREMIUM" | "ENTERPRISE"
  studentCount: number
  teacherCount: number
  createdAt: string
  trialEndsAt?: string | null
}

export const tenantColumns: ColumnDef<TenantRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: "Name", variant: "text", placeholder: "Search name" },
  },
  {
    accessorKey: "subdomain",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Subdomain" />
    ),
    cell: ({ getValue }) => (
      <span className="font-mono text-sm">
        {getValue<string>()}.databayt.org
      </span>
    ),
    meta: {
      label: "Subdomain",
      variant: "text",
      placeholder: "Search subdomain",
    },
  },
  {
    accessorKey: "planType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Plan" />
    ),
    cell: ({ getValue }) => {
      const plan = getValue<string>()
      return (
        <span
          className={`rounded px-2 py-1 text-xs font-medium ${
            plan === "ENTERPRISE"
              ? "bg-purple-100 text-purple-800"
              : plan === "PREMIUM"
                ? "bg-blue-100 text-blue-800"
                : plan === "BASIC"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {plan}
        </span>
      )
    },
    meta: {
      label: "Plan",
      variant: "select",
      placeholder: "Plan type",
      options: [
        { label: "Trial", value: "TRIAL" },
        { label: "Basic", value: "BASIC" },
        { label: "Premium", value: "PREMIUM" },
        { label: "Enterprise", value: "ENTERPRISE" },
      ],
    },
  },
  {
    id: "users",
    header: "Users",
    cell: ({ row }) => {
      const tenant = row.original
      return (
        <div className="text-sm">
          <div>{tenant.studentCount.toLocaleString()} students</div>
          <div className="text-muted-foreground">
            {tenant.teacherCount.toLocaleString()} teachers
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ getValue }) => (
      <span className="text-xs font-medium">
        {getValue<boolean>() ? "Active" : "Inactive"}
      </span>
    ),
    meta: {
      label: "Status",
      variant: "select",
      placeholder: "Active/Inactive",
      options: [
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
    meta: { label: "Created", variant: "text" },
  },
  {
    accessorKey: "trialEndsAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trial Ends" />
    ),
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-xs tabular-nums">
        {(() => {
          const v = getValue<string | null | undefined>()
          return v ? new Date(v).toLocaleDateString() : "-"
        })()}
      </span>
    ),
    enableSorting: false,
    meta: { label: "Trial Ends", variant: "text" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const tenant = row.original as TenantRow
      const onStartImpersonation = async () => {
        try {
          const reason = prompt(`Reason to impersonate ${tenant.name}?`) || ""
          const res = await fetch(
            `/operator/actions/impersonation/${tenant.id}/start`,
            {
              method: "POST",
              body: (() => {
                const fd = new FormData()
                fd.set("reason", reason)
                return fd
              })(),
            }
          )
          if (!res.ok) throw new Error("Failed to start impersonation")
          SuccessToast("Impersonation started successfully")
        } catch (e) {
          ErrorToast(
            e instanceof Error ? e.message : "Failed to start impersonation"
          )
        }
      }
      const onToggleActive = async () => {
        try {
          const reason =
            prompt(
              `Reason to ${tenant.isActive ? "suspend" : "activate"} ${tenant.name}?`
            ) || ""
          const res = await fetch(
            `/operator/actions/tenants/${tenant.id}/toggle-active`,
            {
              method: "POST",
              body: (() => {
                const fd = new FormData()
                fd.set("reason", reason)
                return fd
              })(),
            }
          )
          if (!res.ok) throw new Error("Failed to toggle status")
          SuccessToast("Status toggled successfully")
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to toggle status")
        }
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/operator/tenants?impersonate=${tenant.id}`}>
                Impersonate
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onStartImpersonation}>
              Start impersonation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {tenant.isActive ? "Suspend" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <div className="px-0">
                <TenantDetail
                  tenantId={tenant.id}
                  name={tenant.name}
                  domain={tenant.subdomain}
                  planType={tenant.planType}
                  isActive={tenant.isActive}
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
