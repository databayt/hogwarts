"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/components/internationalization/config"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { bulkSuspend, exportMembersCSV, inviteMember } from "./actions"
import { ApprovalSection } from "./approval-section"
import { getMemberColumns, type MemberRow } from "./columns"
import { GradeAssignDialog } from "./grade-assign-dialog"
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
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState("")

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

  // Invite state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("STAFF")

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
    ]
  )

  const { table } = useDataTable<MemberRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 20 },
      columnVisibility: { joinedAtStr: false },
    },
  })

  // Export handler
  const handleExport = useCallback(async () => {
    const result = await exportMembersCSV()
    if (result.success && result.data) {
      const blob = new Blob([result.data], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "members.csv"
      link.click()
    }
  }, [])

  // Invite handler
  const handleInvite = useCallback(async () => {
    if (!inviteEmail) return
    const result = await inviteMember({
      email: inviteEmail,
      role: inviteRole as
        | "ADMIN"
        | "TEACHER"
        | "STUDENT"
        | "GUARDIAN"
        | "ACCOUNTANT"
        | "STAFF",
    })
    if (result.success) {
      setShowInvite(false)
      setInviteEmail("")
      handleRefresh()
    }
  }, [inviteEmail, inviteRole, handleRefresh])

  // Bulk suspend selected
  const handleBulkSuspend = useCallback(async () => {
    const selected = table.getSelectedRowModel().rows.map((r) => r.original.id)
    if (selected.length === 0) return
    await bulkSuspend({ userIds: selected })
    table.toggleAllPageRowsSelected(false)
    handleRefresh()
  }, [table, handleRefresh])

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
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={t.searchMembers || "Search members..."}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              {table.getSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkSuspend}
                  disabled={isPending}
                >
                  {t.bulkSuspend || "Bulk Suspend"}(
                  {table.getSelectedRowModel().rows.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInvite(!showInvite)}
              >
                <UserPlus className="me-2 h-4 w-4" />
                {t.inviteMember || "Invite"}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="me-2 h-4 w-4" />
            {t.export || "Export"}
          </Button>
        </div>
      </div>

      {/* Inline invite form */}
      {showInvite && (
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Input
            placeholder={t.emailPlaceholder || "Email address"}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="max-w-xs"
            type="email"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-2 text-sm"
          >
            <option value="STAFF">Staff</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="STUDENT">Student</option>
            <option value="GUARDIAN">Guardian</option>
          </select>
          <Button size="sm" onClick={handleInvite} disabled={!inviteEmail}>
            {t.sendInvite || "Send Invite"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowInvite(false)}
          >
            {t.cancel || "Cancel"}
          </Button>
        </div>
      )}

      {/* DataTable */}
      <DataTable table={table} isLoading={isPending} />

      {/* Dialogs */}
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
