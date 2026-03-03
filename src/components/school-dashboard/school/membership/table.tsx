"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Ban, Download, ShieldCheck } from "lucide-react"

import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import {
  BulkActionsToolbar,
  type BulkAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { bulkActivate, bulkSuspend, exportMembersCSV } from "./actions"
import { ApprovalSection } from "./approval-section"
import { getMemberColumns, type MemberRow } from "./columns"
import { GradeAssignDialog } from "./grade-assign-dialog"
import { InviteDialog } from "./invite-dialog"
import { RoleChangeDialog } from "./role-change-dialog"
import { StatusChangeDialog } from "./status-change-dialog"
import type { MembershipRequestRow, UnifiedMember } from "./types"

interface MembershipTableProps {
  members: UnifiedMember[]
  pendingRequests: MembershipRequestRow[]
  grades: { id: string; name: string }[]
  canManage: boolean
  lang: Locale
  t: Record<string, string>
}

export function MembershipTable({
  members,
  pendingRequests,
  grades,
  canManage,
  lang,
  t,
}: MembershipTableProps) {
  const BATCH_SIZE = 20
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState("")
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [searchValue])

  // Dialog states
  const [roleChangeMember, setRoleChangeMember] = useState<MemberRow | null>(
    null
  )
  const [gradeAssignMember, setGradeAssignMember] = useState<MemberRow | null>(
    null
  )
  const [statusChangeMember, setStatusChangeMember] =
    useState<MemberRow | null>(null)
  const [statusAction, setStatusAction] = useState<
    "suspend" | "activate" | "remove" | null
  >(null)
  const [showInvite, setShowInvite] = useState(false)

  // Convert members to rows with formatted dates
  const data: MemberRow[] = useMemo(() => {
    let filtered = members
    if (searchValue) {
      const q = searchValue.toLowerCase()
      filtered = members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      )
    }
    return filtered.map((m) => ({
      ...m,
      joinedAtStr: m.joinedAt.toLocaleDateString(
        lang === "ar" ? "ar-SA" : "en-US"
      ),
    }))
  }, [members, searchValue, lang])

  const visibleData = useMemo(
    () => data.slice(0, visibleCount),
    [data, visibleCount]
  )
  const hasMore = visibleCount < data.length

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // Column action handlers
  const handleChangeRole = useCallback((member: MemberRow) => {
    setRoleChangeMember(member)
  }, [])

  const handleAssignGrade = useCallback((member: MemberRow) => {
    setGradeAssignMember(member)
  }, [])

  const handleSuspend = useCallback((member: MemberRow) => {
    setStatusChangeMember(member)
    setStatusAction("suspend")
  }, [])

  const handleActivate = useCallback((member: MemberRow) => {
    setStatusChangeMember(member)
    setStatusAction("activate")
  }, [])

  const handleRemove = useCallback((member: MemberRow) => {
    setStatusChangeMember(member)
    setStatusAction("remove")
  }, [])

  // Build grade options for column filter
  const gradeOptions = useMemo(() => {
    const unique = new Map<string, string>()
    for (const m of members) {
      if (m.gradeName) unique.set(m.gradeName, m.gradeName)
    }
    return Array.from(unique.values()).map((g) => ({ label: g, value: g }))
  }, [members])

  // Columns
  const columns = useMemo(
    () => [
      getSelectColumn<MemberRow>(),
      ...getMemberColumns({
        onChangeRole: handleChangeRole,
        onAssignGrade: handleAssignGrade,
        onSuspend: handleSuspend,
        onActivate: handleActivate,
        onRemove: handleRemove,
        canManage,
        t,
        lang,
        gradeOptions,
      }),
    ],
    [
      handleChangeRole,
      handleAssignGrade,
      handleSuspend,
      handleActivate,
      handleRemove,
      canManage,
      t,
      lang,
      gradeOptions,
    ]
  )

  const { table } = useDataTable<MemberRow>({
    data: visibleData,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: visibleData.length || 20 },
      columnVisibility: { joinedAtStr: false },
    },
  })

  // CSV export for PlatformToolbar
  const handleGetCSV = useCallback(async () => {
    const result = await exportMembersCSV()
    if (result.success && result.data) {
      return result.data
    }
    return ""
  }, [])

  // Bulk actions for BulkActionsToolbar
  const bulkActions: BulkAction<MemberRow>[] = useMemo(
    () => [
      {
        id: "bulk-suspend",
        label: t.bulkSuspend || "Suspend",
        icon: <Ban className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (rows) => {
          const ids = rows.map((r) => r.id)
          const result = await bulkSuspend({ userIds: ids })
          if (result.success) {
            SuccessToast(
              `${result.data?.count || 0} ${t.memberSuspended || "members suspended"}`
            )
            table.toggleAllPageRowsSelected(false)
            handleRefresh()
          }
        },
      },
      {
        id: "bulk-activate",
        label: t.bulkActivate || "Activate",
        icon: <ShieldCheck className="h-4 w-4" />,
        variant: "default" as const,
        onClick: async (rows) => {
          const ids = rows.map((r) => r.id)
          const result = await bulkActivate({ userIds: ids })
          if (result.success) {
            SuccessToast(
              `${result.data?.count || 0} ${t.memberActivated || "members activated"}`
            )
            table.toggleAllPageRowsSelected(false)
            handleRefresh()
          }
        },
      },
      {
        id: "bulk-export",
        label: t.export || "Export",
        icon: <Download className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: async (rows) => {
          const header = "Name,Email,Role,Status"
          const csvRows = rows.map(
            (r) =>
              `"${r.name}","${r.email || ""}","${r.role}","${r.memberStatus}"`
          )
          const csv = [header, ...csvRows].join("\n")
          const blob = new Blob([csv], { type: "text/csv" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "members-selected.csv"
          a.click()
          URL.revokeObjectURL(url)
        },
      },
    ],
    [t, table, handleRefresh]
  )

  return (
    <div className="space-y-6">
      {/* Approval Section */}
      <ApprovalSection
        requests={pendingRequests}
        onSuccess={handleRefresh}
        t={t}
        lang={lang}
      />

      {/* Toolbar */}
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder={t.searchMembers || "Search members..."}
        onCreate={canManage ? () => setShowInvite(true) : undefined}
        getCSV={handleGetCSV}
        entityName="members"
        translations={{
          search: t.searchMembers || "Search members...",
          create: t.inviteMember || "Invite",
          reset: t.reset || "Reset",
          export: t.export || "Export",
          exportCSV: t.exportCSV || "Export CSV",
          exporting: t.exporting || "Exporting...",
          view: t.view || "View",
          searchColumns: t.searchColumns || "Search columns...",
          noColumns: t.noColumns || "No columns found.",
          all: t.all || "All",
        }}
      />

      {/* DataTable */}
      <DataTable
        table={table}
        isLoading={isPending}
        paginationMode="load-more"
      />

      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            className="hover:underline"
            onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
          >
            {t.seeMore || "See More"}
          </Button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {canManage && (
        <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
      )}

      {/* Dialogs */}
      <InviteDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        onSuccess={handleRefresh}
        t={t}
      />
      <RoleChangeDialog
        member={roleChangeMember}
        open={!!roleChangeMember}
        onOpenChange={(open) => !open && setRoleChangeMember(null)}
        onSuccess={handleRefresh}
        t={t}
      />
      <GradeAssignDialog
        member={gradeAssignMember}
        open={!!gradeAssignMember}
        onOpenChange={(open) => !open && setGradeAssignMember(null)}
        onSuccess={handleRefresh}
        grades={grades}
        t={t}
      />
      <StatusChangeDialog
        member={statusChangeMember}
        action={statusAction}
        open={!!statusChangeMember && !!statusAction}
        onOpenChange={(open) => {
          if (!open) {
            setStatusChangeMember(null)
            setStatusAction(null)
          }
        }}
        onSuccess={handleRefresh}
        t={t}
      />
    </div>
  )
}
