"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"

import type { ArchiveScope } from "@/lib/archive-scope"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
  SuccessToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  archiveStudent,
  restoreStudent,
} from "@/components/school-dashboard/listings/students/actions"
import { normalizeWizardStep } from "@/components/school-dashboard/listings/students/wizard/config"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

export type StudentRow = {
  id: string
  userId: string | null
  name: string
  studentId: string | null
  classroom: string | null
  gradeName: string | null
  status: string
  createdAt: string
  email: string | null
  dateOfBirth: string | null
  enrollmentDate: string | null
  wizardStep: string | null
  profilePhotoUrl: string | null
}

interface ColumnOptions {
  onDeleteSuccess?: (id: string) => void
  onGenerateAccessCode?: (studentId: string, studentName: string) => void
  onGenerateCredentials?: (studentId: string, studentName: string) => void
  onPurge?: (studentId: string, studentName: string) => void
  gradeOptions?: Array<{ label: string; value: string }>
  scope?: ArchiveScope
  permissions?: UIPermissions
}

export const getStudentColumns = (
  dictionary?: Dictionary["school"]["students"],
  lang?: Locale,
  options?: ColumnOptions
): ColumnDef<StudentRow>[] => {
  // Helper to safely access dictionary keys (JSON may have keys not in TS type)
  const d = dictionary as Record<string, string> | undefined
  const scope = options?.scope ?? "active"
  const permissions = options?.permissions ?? FULL_UI_PERMISSIONS
  const t = {
    name: d?.fullName || "Name",
    studentId: d?.studentId || "Student ID",
    classroom: d?.classroom || "Classroom",
    grade: d?.grade || "Grade",
    status: d?.status || "Status",
    created: d?.created || "Created",
    email: d?.email || "Email",
    dateOfBirth: d?.dateOfBirth || "Date of Birth",
    enrollmentDate: d?.enrollmentDate || "Enrollment Date",
    actions: d?.actions || "Actions",
    view: d?.view || "View",
    edit: d?.edit || "Edit",
    delete: d?.delete || "Delete",
    active: d?.active || "Active",
    unassigned: d?.unassigned || "Unassigned",
    incomplete: d?.incomplete || "Incomplete",
    inactive: d?.inactive || "Inactive",
    suspended: d?.suspended || "Suspended",
    graduated: d?.graduated || "Graduated",
    transferred: d?.transferred || "Transferred",
    droppedOut: d?.droppedOut || "Dropped Out",
    draft: d?.draft || "Draft",
    linkParent: d?.linkParent || "Link Parent",
    generateCredentials: d?.generateCredentials || "Generate Credentials",
    viewGrades: d?.viewGrades || "View Grades",
    viewAttendance: d?.viewAttendance || "View Attendance",
    viewClasses: d?.viewClasses || "View Classes",
    noEmail: d?.noEmail || "No email",
    archive: d?.archive || "Archive",
    restore: d?.restore || "Restore",
    permanentlyDelete: d?.permanentlyDelete || "Permanently delete",
    confirmArchive:
      d?.confirmArchive ||
      "Archive this student? They will be hidden from the active list but can be restored later.",
    confirmRestore: d?.confirmRestore || "Restore this student to active list?",
    archiveSuccess: d?.archiveSuccess || "Student archived",
    restoreSuccess: d?.restoreSuccess || "Student restored",
    archiveFailed: d?.archiveFailed || "Failed to archive student",
    restoreFailed: d?.restoreFailed || "Failed to restore student",
    restoreConflict:
      d?.restoreConflict ||
      "Cannot restore: another active student already uses this ID",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={student.profilePhotoUrl || ""}
                alt={student.name}
              />
              <AvatarFallback className="bg-primary/10 text-xs">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Link
                  href={`/${lang}/profile/${student.userId || student.id}`}
                  className="font-medium hover:underline"
                >
                  {student.name}
                </Link>
              </div>
              <span className="text-muted-foreground max-w-[180px] truncate text-xs">
                {student.email || t.noEmail}
              </span>
            </div>
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
      size: 250,
    },
    {
      accessorKey: "studentId",
      id: "studentId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.studentId} />
      ),
      meta: { label: t.studentId, variant: "text" },
    },
    {
      accessorKey: "gradeName",
      id: "gradeName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.grade} />
      ),
      meta: {
        label: t.grade,
        variant: "select",
        options: options?.gradeOptions || [],
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "classroom",
      id: "classroom",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.classroom} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return <span className="text-muted-foreground">-</span>
        return <span className="text-sm">{val}</span>
      },
      meta: { label: t.classroom, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ row }) => {
        const student = row.original
        const status = student.status

        // Wizard draft overrides display status
        if (student.wizardStep) {
          return (
            <Link
              href={`/${lang}/students/add/${student.id}/${normalizeWizardStep(student.wizardStep)}`}
            >
              <Badge variant="outline">{t.draft}</Badge>
            </Link>
          )
        }

        const variants: Record<
          string,
          "default" | "secondary" | "destructive" | "outline"
        > = {
          active: "default",
          unassigned: "outline",
          incomplete: "secondary",
          inactive: "secondary",
          suspended: "destructive",
          graduated: "outline",
          transferred: "outline",
          dropped_out: "secondary",
        }

        const labels: Record<string, string> = {
          active: t.active,
          unassigned: t.unassigned,
          incomplete: t.incomplete,
          inactive: t.inactive,
          suspended: t.suspended,
          graduated: t.graduated,
          transferred: t.transferred,
          dropped_out: t.droppedOut,
        }

        const label = labels[status] || status.replace("_", " ")
        return <Badge variant={variants[status] || "default"}>{label}</Badge>
      },
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "active" },
          { label: t.unassigned, value: "unassigned" },
          { label: t.incomplete, value: "incomplete" },
          { label: t.draft, value: "draft" },
          { label: t.inactive, value: "inactive" },
          { label: t.suspended, value: "suspended" },
          { label: t.graduated, value: "graduated" },
          { label: t.transferred, value: "transferred" },
          { label: t.droppedOut, value: "dropped_out" },
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
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email} />
      ),
      meta: { label: t.email, variant: "text" },
    },
    {
      accessorKey: "dateOfBirth",
      id: "dateOfBirth",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.dateOfBirth} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return "-"
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(val).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US"
            )}
          </span>
        )
      },
      meta: { label: t.dateOfBirth, variant: "text" },
    },
    {
      accessorKey: "enrollmentDate",
      id: "enrollmentDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.enrollmentDate} />
      ),
      cell: ({ getValue }) => {
        const val = getValue<string | null>()
        if (!val) return "-"
        return (
          <span className="text-muted-foreground text-xs tabular-nums">
            {new Date(val).toLocaleDateString(
              lang === "ar" ? "ar-SA" : "en-US"
            )}
          </span>
        )
      },
      meta: { label: t.enrollmentDate, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const student = row.original
        const onArchive = async () => {
          try {
            const ok = await confirmDeleteDialog(undefined, {
              title: `${t.archive} ${student.name}?`,
              description: t.confirmArchive,
              confirmText: t.archive,
              cancelText: (d as any)?.cancel || "Cancel",
            })
            if (!ok) return
            const result = await archiveStudent({ id: student.id })
            if (result.success) {
              SuccessToast(t.archiveSuccess)
              options?.onDeleteSuccess?.(student.id)
            } else {
              ErrorToast(
                ("error" in result ? result.error : undefined) ||
                  t.archiveFailed
              )
            }
          } catch (e) {
            ErrorToast(e instanceof Error ? e.message : t.archiveFailed)
          }
        }
        const onRestore = async () => {
          try {
            const ok = await confirmDeleteDialog(undefined, {
              title: `${t.restore} ${student.name}?`,
              description: t.confirmRestore,
              confirmText: t.restore,
              cancelText: (d as any)?.cancel || "Cancel",
            })
            if (!ok) return
            const result = await restoreStudent({ id: student.id })
            if (result.success) {
              SuccessToast(t.restoreSuccess)
              options?.onDeleteSuccess?.(student.id)
            } else {
              const code = "code" in result ? result.code : undefined
              ErrorToast(
                code === "STUDENT_RESTORE_CONFLICT"
                  ? t.restoreConflict
                  : ("error" in result ? result.error : undefined) ||
                      t.restoreFailed
              )
            }
          } catch (e) {
            ErrorToast(e instanceof Error ? e.message : t.restoreFailed)
          }
        }
        return (
          <ActionMenu srLabel={t.actions}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.view}
              href={`/${lang}/profile/${student.userId || student.id}`}
            />
            {permissions.showEditAction && (
              <ActionMenuItem
                label={
                  student.wizardStep ? `${t.edit} (${t.incomplete})` : t.edit
                }
                href={`/${lang}/students/add/${student.id}/${normalizeWizardStep(student.wizardStep)}`}
              />
            )}
            <DropdownMenuSeparator />
            <ActionMenuItem
              label={t.viewGrades}
              href={`/${lang}/grades?studentId=${student.id}`}
            />
            <ActionMenuItem
              label={t.viewAttendance}
              href={`/${lang}/attendance?studentId=${student.id}`}
            />
            <ActionMenuItem
              label={t.viewClasses}
              href={`/${lang}/classrooms?studentId=${student.id}`}
            />
            {permissions.showAddButton && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-foreground/70"
                  onSelect={(e) => {
                    e.preventDefault()
                    options?.onGenerateCredentials?.(student.id, student.name)
                  }}
                >
                  {t.generateCredentials}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-foreground/70"
                  onSelect={(e) => {
                    e.preventDefault()
                    options?.onGenerateAccessCode?.(student.id, student.name)
                  }}
                >
                  {t.linkParent}
                </DropdownMenuItem>
              </>
            )}
            {(permissions.showArchiveAction ||
              permissions.showRestoreAction ||
              permissions.showDeleteAction) && <DropdownMenuSeparator />}
            {scope === "archived" ? (
              <>
                {permissions.showRestoreAction && (
                  <ActionMenuItem label={t.restore} onClick={onRestore} />
                )}
                {permissions.showDeleteAction && (
                  <ActionMenuItem
                    label={t.permanentlyDelete}
                    onClick={() => options?.onPurge?.(student.id, student.name)}
                  />
                )}
              </>
            ) : (
              permissions.showArchiveAction && (
                <ActionMenuItem label={t.archive} onClick={onArchive} />
              )
            )}
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getStudentColumns()
// inside useMemo in client components to avoid SSR hook issues.
