"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Building2, CalendarClock, Mail, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ActionMenu, ActionMenuItem } from "@/components/atom/action-menu"
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
  country?: string | null
  tags?: string[]
  status: LeadStatusKey
  source: string
  priority: LeadPriorityKey
  score: number
  verified: boolean
  nextFollowUpAt?: string | null
  createdAt: string
}

type LeadDeleteAction = (
  id: string
) => Promise<
  { success: true; data?: unknown } | { success: false; error: string }
>

interface ColumnOptions {
  onDeleteSuccess?: (id: string) => void
  /**
   * Override delete action. Defaults to the school-scoped `deleteLead` so the
   * school sales table keeps working with no caller change. The operator sales
   * console passes `deleteOperatorLead` so platform leads (schoolId="platform")
   * are deleted with the right tenant scope — calling the school action there
   * throws "Missing school context" because DEVELOPER has no schoolId.
   */
  deleteAction?: LeadDeleteAction
  /**
   * Route the "View" action menu item to a custom path (e.g. `/sales/${id}` on
   * the operator side). When absent we fall back to the school-table behavior.
   */
  viewHref?: (id: string) => string
  /**
   * When set, "Edit" navigates to a route instead of opening a modal. Operator
   * console passes `(id) => /${lang}/sales/${id}`; school-side leaves it
   * undefined to keep its modal flow.
   */
  editHref?: (id: string) => string
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

// Derive A/B/C tier from tags written by prisma/seeds/sales-network.ts.
function deriveTier(tags?: string[] | null): "A" | "B" | "C" | null {
  if (!tags) return null
  const found = tags.find((t) => /^tier-[abc]$/i.test(t))
  if (!found) return null
  return found.split("-")[1].toUpperCase() as "A" | "B" | "C"
}

function tierBadgeClass(tier: "A" | "B" | "C"): string {
  switch (tier) {
    case "A":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
    case "B":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
    case "C":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  }
}

export const getLeadColumns = (
  dictionary?: Dictionary["sales"],
  lang?: Locale,
  options?: ColumnOptions
): ColumnDef<LeadRow>[] => {
  const isRTL = lang === "ar"
  const localeTag = isRTL ? "ar-SA" : "en-US"

  const t = {
    name: dictionary?.table?.name ?? "Name",
    email: dictionary?.table?.email ?? "Email",
    company: dictionary?.table?.company ?? "Company",
    status: dictionary?.table?.status ?? "Status",
    priority: dictionary?.table?.priority ?? "Priority",
    score: dictionary?.table?.score ?? "Score",
    source: dictionary?.table?.source ?? "Source",
    created: dictionary?.table?.created ?? "Created",
    tier: dictionary?.table?.tier ?? "Tier",
    country: dictionary?.table?.country ?? "Country",
    nextFollowUp: dictionary?.table?.nextFollowUp ?? "Follow-up",
    actions: dictionary?.actions ?? "Actions",
    view: dictionary?.view ?? "View",
    edit: dictionary?.edit ?? "Edit",
    delete: dictionary?.delete ?? "Delete",
    // Status translations
    NEW: dictionary?.status?.NEW ?? "New",
    CONTACTED: dictionary?.status?.CONTACTED ?? "Contacted",
    QUALIFIED: dictionary?.status?.QUALIFIED ?? "Qualified",
    PROPOSAL: dictionary?.status?.PROPOSAL ?? "Proposal",
    NEGOTIATION: dictionary?.status?.NEGOTIATION ?? "Negotiation",
    CLOSED_WON: dictionary?.status?.CLOSED_WON ?? "Closed Won",
    CLOSED_LOST: dictionary?.status?.CLOSED_LOST ?? "Closed Lost",
    ARCHIVED: dictionary?.status?.ARCHIVED ?? "Archived",
    // Priority translations
    LOW: dictionary?.priority?.LOW ?? "Low",
    MEDIUM: dictionary?.priority?.MEDIUM ?? "Medium",
    HIGH: dictionary?.priority?.HIGH ?? "High",
    URGENT: dictionary?.priority?.URGENT ?? "Urgent",
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
      accessorKey: "country",
      id: "country",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.country} />
      ),
      cell: ({ row }) => {
        const country = row.original.country
        if (!country) return <span className="text-muted-foreground">-</span>
        const label =
          dictionary?.country?.[
            country as keyof NonNullable<typeof dictionary.country>
          ] ?? country
        return (
          <Badge variant="outline" className="text-xs">
            {label}
          </Badge>
        )
      },
      meta: { label: t.country, variant: "text" },
    },
    {
      id: "tier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.tier} />
      ),
      cell: ({ row }) => {
        const tier = deriveTier(row.original.tags)
        if (!tier)
          return (
            <span className="text-muted-foreground">
              {dictionary?.tier?.none ?? "—"}
            </span>
          )
        return (
          <Badge className={cn("text-xs", tierBadgeClass(tier))}>
            {dictionary?.tier?.[tier] ?? tier}
          </Badge>
        )
      },
      enableSorting: false,
      meta: { label: t.tier, variant: "text" },
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
      id: "nextFollowUpAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.nextFollowUp} />
      ),
      cell: ({ row }) => {
        const raw = row.original.nextFollowUpAt
        if (!raw) return <span className="text-muted-foreground">-</span>
        const date = new Date(raw)
        const overdue = date.getTime() < Date.now()
        return (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs tabular-nums",
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {date.toLocaleDateString(localeTag)}
          </div>
        )
      },
      enableSorting: false,
      meta: { label: t.nextFollowUp, variant: "text" },
    },
    {
      accessorKey: "createdAt",
      id: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.created} />
      ),
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString(localeTag)}
        </span>
      ),
      meta: { label: t.created, variant: "text" },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t.actions}</span>,
      cell: ({ row }) => {
        const lead = row.original
        // Hooks inside cell are fine because TanStack renders `cell` as a React
        // component. Keeping useModal/useRouter co-located with the menu so a
        // single `getLeadColumns(...)` call wires both school + operator tables.
        const { openModal } = useModal()
        const router = useRouter()
        const deleter = options?.deleteAction ?? deleteLead

        const onView = () => {
          if (options?.viewHref) {
            router.push(options.viewHref(lead.id))
            return
          }
          // Fall-through: preserve the school-table behavior that lives in the
          // tenant subdomain — full reload keeps the search string but isn't
          // needed once detail routes exist on every side.
          if (typeof window !== "undefined") {
            const qs = window.location.search || ""
            window.location.href = `/sales/${lead.id}${qs}`
          }
        }

        const onEdit = () => {
          if (options?.editHref) {
            router.push(options.editHref(lead.id))
          } else {
            openModal(lead.id)
          }
        }

        const onDelete = async () => {
          try {
            const deleteMsg = (
              dictionary?.deleteConfirm ?? "Delete {name}?"
            ).replace("{name}", lead.name)
            const ok = await confirmDeleteDialog(deleteMsg)
            if (!ok) return

            const result = await deleter(lead.id)
            if (result.success) {
              DeleteToast()
              options?.onDeleteSuccess?.(lead.id)
            } else {
              ErrorToast(dictionary?.deleteFailed ?? "Failed to delete lead")
            }
          } catch (e) {
            ErrorToast(
              e instanceof Error
                ? e.message
                : (dictionary?.deleteFailedGeneric ?? "Failed to delete")
            )
          }
        }

        return (
          <ActionMenu srLabel={t.actions}>
            <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ActionMenuItem label={t.view} onClick={onView} />
            <ActionMenuItem label={t.edit} onClick={onEdit} />
            <ActionMenuItem label={t.delete} onClick={onDelete} />
          </ActionMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}

// NOTE: Do NOT export pre-generated columns. Always use getLeadColumns()
// inside useMemo in client components to avoid SSR hook issues.
