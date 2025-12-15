"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Building2, Ellipsis, Mail, Phone, Star } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { useModal } from "@/components/atom/modal/context"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { deleteLead } from "@/components/sales/actions"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  type LeadPriorityKey,
  type LeadStatusKey,
} from "./constants"

export type LeadRow = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  title?: string | null
  status: LeadStatusKey
  source: string
  priority: LeadPriorityKey
  score: number
  verified: boolean
  createdAt: string
}

interface ColumnOptions {
  onDeleteSuccess?: (id: string) => void
}

// Score badge color based on value
function getScoreColor(score: number): string {
  if (score >= 80)
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  if (score >= 60)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  if (score >= 40)
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
}

export const getLeadColumns = (
  dictionary?: Dictionary["sales"],
  lang?: Locale,
  options?: ColumnOptions
): ColumnDef<LeadRow>[] => {
  const isRTL = lang === "ar"

  const t = {
    name: isRTL ? "الاسم" : "Name",
    email: isRTL ? "البريد الإلكتروني" : "Email",
    company: isRTL ? "الشركة" : "Company",
    status: isRTL ? "الحالة" : "Status",
    priority: isRTL ? "الأولوية" : "Priority",
    score: isRTL ? "النتيجة" : "Score",
    source: isRTL ? "المصدر" : "Source",
    created: isRTL ? "تاريخ الإنشاء" : "Created",
    actions: isRTL ? "إجراءات" : "Actions",
    view: isRTL ? "عرض" : "View",
    edit: isRTL ? "تعديل" : "Edit",
    delete: isRTL ? "حذف" : "Delete",
    // Status translations
    NEW: isRTL ? "جديد" : "New",
    CONTACTED: isRTL ? "تم التواصل" : "Contacted",
    QUALIFIED: isRTL ? "مؤهل" : "Qualified",
    PROPOSAL: isRTL ? "عرض" : "Proposal",
    NEGOTIATION: isRTL ? "تفاوض" : "Negotiation",
    CLOSED_WON: isRTL ? "تم الإغلاق (ربح)" : "Closed Won",
    CLOSED_LOST: isRTL ? "تم الإغلاق (خسارة)" : "Closed Lost",
    ARCHIVED: isRTL ? "مؤرشف" : "Archived",
    // Priority translations
    LOW: isRTL ? "منخفض" : "Low",
    MEDIUM: isRTL ? "متوسط" : "Medium",
    HIGH: isRTL ? "عالي" : "High",
    URGENT: isRTL ? "عاجل" : "Urgent",
  }

  return [
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      cell: ({ row }) => {
        const lead = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{lead.name}</span>
            {lead.title && (
              <span className="text-muted-foreground text-xs">
                {lead.title}
              </span>
            )}
          </div>
        )
      },
      meta: { label: t.name, variant: "text" },
      enableColumnFilter: true,
    },
    {
      accessorKey: "company",
      id: "company",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.company} />
      ),
      cell: ({ row }) => {
        const company = row.getValue("company") as string | null
        if (!company) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-4 w-4" />
            <span>{company}</span>
          </div>
        )
      },
      meta: { label: t.company, variant: "text" },
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.email} />
      ),
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null
        if (!email) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground h-4 w-4" />
            <a href={`mailto:${email}`} className="text-sm hover:underline">
              {email}
            </a>
          </div>
        )
      },
      meta: { label: t.email, variant: "text" },
    },
    {
      accessorKey: "status",
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as LeadStatusKey
        return (
          <Badge className={cn("text-xs", STATUS_COLORS[status])}>
            {t[status] || status}
          </Badge>
        )
      },
      meta: {
        label: t.status,
        variant: "select",
        options: Object.keys(STATUS_COLORS).map((s) => ({
          label: t[s as LeadStatusKey] || s,
          value: s,
        })),
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "priority",
      id: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.priority} />
      ),
      cell: ({ row }) => {
        const priority = row.getValue("priority") as LeadPriorityKey
        return (
          <Badge
            variant="outline"
            className={cn("text-xs", PRIORITY_COLORS[priority])}
          >
            {t[priority] || priority}
          </Badge>
        )
      },
      meta: {
        label: t.priority,
        variant: "select",
        options: Object.keys(PRIORITY_COLORS).map((p) => ({
          label: t[p as LeadPriorityKey] || p,
          value: p,
        })),
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: "score",
      id: "score",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.score} />
      ),
      cell: ({ row }) => {
        const score = row.getValue("score") as number
        return (
          <div className="flex items-center gap-2">
            <Star className="text-muted-foreground h-4 w-4" />
            <Badge className={cn("text-xs tabular-nums", getScoreColor(score))}>
              {score}
            </Badge>
          </div>
        )
      },
      meta: { label: t.score, variant: "text" },
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
            isRTL ? "ar-SA" : "en-US"
          )}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const lead = row.original
        const { openModal } = useModal()

        const onView = () => {
          // Navigate to lead detail page
          const qs =
            typeof window !== "undefined" ? window.location.search || "" : ""
          window.location.href = `/sales/${lead.id}${qs}`
        }

        const onEdit = () => openModal(lead.id)

        const onDelete = async () => {
          try {
            const deleteMsg = isRTL
              ? `حذف ${lead.name}؟`
              : `Delete ${lead.name}?`
            const ok = await confirmDeleteDialog(deleteMsg)
            if (!ok) return

            const result = await deleteLead(lead.id)
            if (result.success) {
              DeleteToast()
              options?.onDeleteSuccess?.(lead.id)
            } else {
              ErrorToast(
                isRTL ? "فشل حذف العميل المحتمل" : "Failed to delete lead"
              )
            }
          } catch (e) {
            ErrorToast(
              e instanceof Error
                ? e.message
                : isRTL
                  ? "فشل الحذف"
                  : "Failed to delete"
            )
          }
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.actions}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onView}>{t.view}</DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>{t.edit}</DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>{t.delete}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getLeadColumns()
// inside useMemo in client components to avoid SSR hook issues.
