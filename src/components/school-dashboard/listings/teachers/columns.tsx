"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { CheckCircle, Ellipsis, XCircle } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

// Enhanced TeacherRow with practical fields
export type TeacherRow = {
  id: string
  name: string
  givenName: string
  surname: string
  emailAddress: string
  phone: string | null
  department: string | null
  departmentId: string | null
  subjectCount: number
  classCount: number
  employmentStatus: string
  employmentType: string
  hasAccount: boolean
  userId: string | null
  profilePhotoUrl: string | null
  joiningDate: string | null
  wizardStep: string | null
  createdAt: string
}

export interface TeacherColumnCallbacks {
  onView?: (row: TeacherRow) => void
  onEdit?: (row: TeacherRow) => void
  onDelete?: (row: TeacherRow) => void
  onToggleStatus?: (row: TeacherRow) => void
}

export const getTeacherColumns = (
  dictionary?: Dictionary["school"]["teachers"],
  lang?: Locale,
  callbacks?: TeacherColumnCallbacks
): ColumnDef<TeacherRow>[] => {
  const isRtl = lang === "ar"

  const t = {
    name: dictionary?.fullName || "Name",
    email: dictionary?.email || "Email",
    phone: dictionary?.phone || "Phone",
    department: dictionary?.department || "Department",
    subjects: dictionary?.subjects || "Subjects",
    classes: dictionary?.classes || "Classes",
    status: dictionary?.status || "Status",
    account: dictionary?.account || "Account",
    joined: dictionary?.joined || "Joined",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View Profile",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    activate: dictionary?.activate || "Activate",
    deactivate: dictionary?.deactivate || "Deactivate",
    active: dictionary?.active || "Active",
    inactive: dictionary?.inactive || "Inactive",
    fullTime: dictionary?.fullTime || "Full-time",
    partTime: dictionary?.partTime || "Part-time",
    contract: dictionary?.contract || "Contract",
    hasAccount: dictionary?.hasAccount || "Has Account",
    noAccount: dictionary?.noAccount || "No Account",
    noDepartment: dictionary?.noDepartment || "Unassigned",
    incomplete: (dictionary as any)?.incomplete || "Incomplete",
    completeProfile: (dictionary as any)?.completeProfile || "Complete Profile",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  const getStatusBadge = (status: string, hasWizardStep: boolean) => {
    if (hasWizardStep) {
      return {
        label: t.incomplete,
        className: "border-amber-300 bg-amber-50 text-amber-700",
        icon: XCircle,
      }
    }
    switch (status) {
      case "ACTIVE":
        return {
          label: t.active,
          className: "bg-green-100 text-green-800",
          icon: CheckCircle,
        }
      case "ON_LEAVE":
        return {
          label: (dictionary as any)?.onLeave || "On Leave",
          className: "bg-yellow-100 text-yellow-800",
          icon: XCircle,
        }
      case "TERMINATED":
        return {
          label: (dictionary as any)?.terminated || "Terminated",
          className: "bg-red-100 text-red-800",
          icon: XCircle,
        }
      case "RETIRED":
        return {
          label: (dictionary as any)?.retired || "Retired",
          className: "bg-gray-100 text-gray-600",
          icon: XCircle,
        }
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-600",
          icon: XCircle,
        }
    }
  }

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return { label: t.fullTime, className: "bg-blue-100 text-blue-800" }
      case "PART_TIME":
        return { label: t.partTime, className: "bg-purple-100 text-purple-800" }
      case "CONTRACT":
        return { label: t.contract, className: "bg-orange-100 text-orange-800" }
      default:
        return { label: type, className: "bg-gray-100 text-gray-600" }
    }
  }

  return [
    // Teacher Name with Avatar
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const teacher = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={teacher.profilePhotoUrl || ""}
                alt={teacher.name}
              />
              <AvatarFallback className="bg-primary/10 text-xs">
                {getInitials(teacher.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${lang}/profile/${teacher.userId || teacher.id}`}
                  className="font-medium hover:underline"
                >
                  {teacher.name}
                </Link>
              </div>
              <span className="text-muted-foreground text-xs">
                {teacher.emailAddress !== "-" ? teacher.emailAddress : ""}
              </span>
            </div>
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
      size: 250,
    },

    // Department
    {
      accessorKey: "department",
      id: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.department} />
      ),
      cell: ({ row }) => {
        const dept = row.original.department
        if (!dept) {
          return (
            <span className="text-muted-foreground text-xs italic">
              {t.noDepartment}
            </span>
          )
        }
        return <span className="text-sm">{dept}</span>
      },
      meta: { label: t.department, variant: "text" },
      enableColumnFilter: true,
    },

    // Contact (Phone)
    {
      accessorKey: "phone",
      id: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.phone} />
      ),
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <span className="font-mono text-sm" dir="ltr">
            {phone}
          </span>
        )
      },
      meta: { label: t.phone, variant: "text" },
    },

    // Subjects & Classes Count
    {
      id: "workload",
      header: () => <span>{t.subjects}</span>,
      cell: ({ row }) => {
        const { subjectCount, classCount } = row.original
        return (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{subjectCount}</span>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-sm font-medium">{classCount}</span>
          </div>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },

    // Employment Status
    {
      accessorKey: "employmentStatus",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ row }) => {
        const teacher = row.original
        const badge = getStatusBadge(
          teacher.employmentStatus,
          !!teacher.wizardStep
        )
        const Icon = badge.icon
        return (
          <Badge variant="secondary" className={`gap-1 ${badge.className}`}>
            <Icon className="h-3 w-3" />
            {badge.label}
          </Badge>
        )
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "ACTIVE" },
          {
            label: (dictionary as any)?.onLeave || "On Leave",
            value: "ON_LEAVE",
          },
          {
            label: (dictionary as any)?.terminated || "Terminated",
            value: "TERMINATED",
          },
          {
            label: (dictionary as any)?.retired || "Retired",
            value: "RETIRED",
          },
          { label: t.incomplete, value: "incomplete" },
        ],
      },
      enableColumnFilter: true,
    },

    // Account Status
    {
      accessorKey: "hasAccount",
      id: "account",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.account} />
      ),
      cell: ({ row }) => {
        const hasAccount = row.original.hasAccount
        return (
          <Badge
            variant="outline"
            className={
              hasAccount
                ? "border-green-300 text-green-700"
                : "border-gray-300 text-gray-500"
            }
          >
            {hasAccount ? t.hasAccount : t.noAccount}
          </Badge>
        )
      },
      enableSorting: false,
    },

    // Joined Date
    {
      accessorKey: "joiningDate",
      id: "joiningDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.joined} />
      ),
      cell: ({ row }) => {
        const date = row.original.joiningDate
        if (!date) return <span className="text-muted-foreground">-</span>
        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {new Date(date).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
              year: "numeric",
              month: "short",
            })}
          </span>
        )
      },
      meta: { label: t.joined, variant: "text" },
    },

    // Completion status (visible when viewing incomplete records)
    {
      id: "completion",
      header: () => (
        <span>{(dictionary as any)?.completion || "Completion"}</span>
      ),
      cell: ({ row }) => {
        const teacher = row.original
        if (!teacher.wizardStep) {
          return (
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {(dictionary as any)?.complete || "Complete"}
            </Badge>
          )
        }
        return (
          <Link
            href={`/${lang}/teachers/add/${teacher.id}/${teacher.wizardStep}`}
          >
            <Badge variant="secondary" className="gap-1">
              {teacher.wizardStep}
            </Badge>
          </Link>
        )
      },
      meta: {
        label: (dictionary as any)?.completion || "Completion",
        variant: "text",
      },
    },

    // Actions
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const teacher = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRtl ? "start" : "end"}>
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href={`/${lang}/profile/${teacher.userId || teacher.id}`}>
                  {t.view}
                </Link>
              </DropdownMenuItem>

              {teacher.wizardStep ? (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${lang}/teachers/add/${teacher.id}/${teacher.wizardStep}`}
                  >
                    {t.completeProfile || "Complete Profile"}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => callbacks?.onEdit?.(teacher)}>
                  {t.edit}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => callbacks?.onToggleStatus?.(teacher)}
              >
                {teacher.employmentStatus === "ACTIVE"
                  ? t.deactivate
                  : t.activate}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => callbacks?.onDelete?.(teacher)}>
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getTeacherColumns()
// inside useMemo in client components to avoid SSR hook issues.
