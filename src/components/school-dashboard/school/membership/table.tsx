"use client"

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import { Ban, Download, ShieldCheck } from "lucide-react"

import { initialsOf, type NameContact } from "@/lib/name-utils"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { formatConsoleDate } from "@/components/school-dashboard/school/format"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
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
import { fillT, roleLabel } from "./labels"
import { ResetPasswordDialog } from "./reset-password-dialog"
import { RoleChangeDialog } from "./role-change-dialog"
import { StatusChangeDialog } from "./status-change-dialog"
import type { MembershipRequestRow, UnifiedMember } from "./types"

/**
 * Fold the spellings people type interchangeably: case, Arabic diacritics,
 * hamza forms of alef, ى/ي, ة/ه, and Arabic-Indic digits (login codes and
 * phones are often typed on an Arabic keypad).
 */
function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

interface MembershipTableProps {
  members: UnifiedMember[]
  pendingRequests: MembershipRequestRow[]
  grades: { id: string; name: string }[]
  canManage: boolean
  /** What shows under each name — School → Configuration → Contact under name. */
  nameContact?: NameContact
  lang: Locale
  t: Record<string, string>
  /** `school.students.credentials` — shared with the credentials dialog. */
  credentialsLabels?: Record<string, string>
  /** The signed-in admin — their own row has no "Reset password". */
  currentUserId?: string
}

export function MembershipTable({
  members,
  pendingRequests,
  grades,
  canManage,
  nameContact = "phone",
  lang,
  t,
  credentialsLabels,
  currentUserId,
}: MembershipTableProps) {
  const BATCH_SIZE = 20
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState("")
  // Typing stays responsive on big schools: the filter runs on the deferred
  // value, a beat behind the input.
  const deferredSearch = useDeferredValue(searchValue)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

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
  const [resetPasswordMember, setResetPasswordMember] =
    useState<MemberRow | null>(null)
  const [showInvite, setShowInvite] = useState(false)

  // Rows + a search index built once per member list, not per keystroke:
  // name, login code, email, phone, translated role, grade and details,
  // Arabic-normalised so "احمد" finds "أحمد".
  const { rows, searchIndex } = useMemo(() => {
    const rows: MemberRow[] = members.map((m) => ({
      ...m,
      joinedAtStr: formatConsoleDate(m.joinedAt, lang),
    }))
    const searchIndex = new Map(
      rows.map((r) => [
        r.id,
        normalizeSearch(
          [
            r.name,
            r.username,
            r.email,
            r.phone?.replace(/\D/g, ""),
            roleLabel(t, r.role),
            r.role,
            r.gradeName,
            r.contextInfo,
          ]
            .filter(Boolean)
            .join(" ")
        ),
      ])
    )
    return { rows, searchIndex }
  }, [members, lang, t])

  const data = useMemo(() => {
    const terms = normalizeSearch(deferredSearch).split(/\s+/).filter(Boolean)
    if (terms.length === 0) return rows
    return rows.filter((r) => {
      const hay = searchIndex.get(r.id) ?? ""
      return terms.every((term) => hay.includes(term))
    })
  }, [rows, searchIndex, deferredSearch])

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

  const handleResetPassword = useCallback((member: MemberRow) => {
    setResetPasswordMember(member)
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
        onResetPassword: handleResetPassword,
        currentUserId,
        canManage,
        nameContact,
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
      handleResetPassword,
      currentUserId,
      canManage,
      nameContact,
      t,
      lang,
      gradeOptions,
    ]
  )

  const { table } = useDataTable<MemberRow>({
    // Every member goes in: role/status/grade filters, sorting and facet
    // counts cover the whole school; only `pageSize` rows render.
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    enableClientSorting: true,
    enableClientPagination: true,
    // Always page 0 — TanStack's auto-reset would write page=1 to the URL on
    // every filter/sort recompute, which re-parses URL state and loops.
    autoResetPageIndex: false,
    initialState: {
      pagination: { pageIndex: 0, pageSize: BATCH_SIZE },
      columnVisibility: { email: false, joinedAtStr: false },
    },
  })

  // "See more" grows the page; a new search starts again from one batch.
  const pageSize = table.getState().pagination.pageSize
  const matchCount = table.getPrePaginationRowModel().rows.length
  const hasMore = matchCount > pageSize
  const visibleRows = table.getRowModel().rows
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      if (table.getState().pagination.pageSize !== BATCH_SIZE)
        table.setPageSize(BATCH_SIZE)
    },
    [table]
  )

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
        label: t.bulkSuspend,
        icon: <Ban className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (rows) => {
          const ids = rows.map((r) => r.id)
          const result = await bulkSuspend({ userIds: ids })
          if (result.success) {
            SuccessToast(
              fillT(t.membersSuspended, { count: result.data?.count || 0 })
            )
            table.toggleAllPageRowsSelected(false)
            handleRefresh()
          }
        },
      },
      {
        id: "bulk-activate",
        label: t.bulkActivate,
        icon: <ShieldCheck className="h-4 w-4" />,
        variant: "default" as const,
        onClick: async (rows) => {
          const ids = rows.map((r) => r.id)
          const result = await bulkActivate({ userIds: ids })
          if (result.success) {
            SuccessToast(
              fillT(t.membersActivated, { count: result.data?.count || 0 })
            )
            table.toggleAllPageRowsSelected(false)
            handleRefresh()
          }
        },
      },
      {
        id: "bulk-export",
        label: t.export,
        icon: <Download className="h-4 w-4" />,
        variant: "outline" as const,
        onClick: async (rows) => {
          const header = [t.name, t.email, t.role, t.status].join(",")
          const csvRows = rows.map(
            (r) =>
              `"${r.name}","${r.email || ""}","${roleLabel(t, r.role)}","${t[r.memberStatus] ?? r.memberStatus}"`
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
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.searchMembers}
        onCreate={canManage ? () => setShowInvite(true) : undefined}
        getCSV={handleGetCSV}
        entityName="members"
        translations={{
          search: t.searchMembers,
          create: t.inviteMember,
          reset: t.reset,
          export: t.export,
          exportCSV: t.exportCSV,
          exporting: t.exporting,
          view: t.view,
          searchColumns: t.searchColumns,
          noColumns: t.noColumns,
          all: t.all,
        }}
      />

      {/* Table / Grid View */}
      {view === "grid" ? (
        visibleRows.length > 0 ? (
          <GridContainer columns={4}>
            {visibleRows.map(({ original: member }) => (
              <GridCard
                key={member.id}
                avatar={{
                  src: member.image,
                  fallback: initialsOf(member.name),
                }}
                title={member.name}
                description={roleLabel(t, member.role)}
                subtitle={member.email || undefined}
                href={`/${lang}/profile/${member.id}`}
              />
            ))}
          </GridContainer>
        ) : (
          <GridEmptyState
            title={t.noMembers}
            description={t.noMembersDescription}
          />
        )
      ) : (
        <DataTable
          table={table}
          isLoading={isPending}
          paginationMode="load-more"
        />
      )}

      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            className="hover:underline"
            onClick={() => table.setPageSize(pageSize + BATCH_SIZE)}
          >
            {t.seeMore}
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
      <ResetPasswordDialog
        member={resetPasswordMember}
        open={!!resetPasswordMember}
        onOpenChange={(open) => !open && setResetPasswordMember(null)}
        t={t}
        labels={credentialsLabels}
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
