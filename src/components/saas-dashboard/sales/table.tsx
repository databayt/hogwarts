"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getLeadColumns, type LeadRow } from "@/components/sales/columns"
import { PRIORITY_COLORS, STATUS_COLORS } from "@/components/sales/constants"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteOperatorLead, getOperatorLeads } from "./actions"
import { OperatorLeadForm } from "./form"

interface OperatorSalesTableProps {
  initialData: LeadRow[]
  total: number
  perPage: number
  dictionary?: Dictionary["sales"]
  lang: Locale
}

export function OperatorSalesTable({
  initialData,
  total,
  perPage,
  dictionary,
  lang,
}: OperatorSalesTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    search: dictionary?.search || "Search leads...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
    deleteSuccess:
      dictionary?.messages?.deleteSuccess || "Lead deleted successfully",
    deleteError: dictionary?.messages?.deleteError || "Failed to delete lead",
    noLeads: dictionary?.noLeads || "No leads",
    noLeadsDescription:
      dictionary?.noLeadsDescription || "Create a new lead to get started",
    loadMore: dictionary?.loadMore || "Load More",
    loading: dictionary?.loading || "Loading...",
    deleteConfirm: dictionary?.deleteConfirm || "Delete {name}?",
  }

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

  // Search state
  const [searchValue, setSearchValue] = useState("")

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<LeadRow, { search?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getOperatorLeads(
        { search: params.search },
        params.page,
        params.perPage
      )
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return {
        rows: result.data.leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          title: lead.title,
          status: lead.status as LeadRow["status"],
          source: lead.source,
          priority: lead.priority as LeadRow["priority"],
          score: lead.score,
          verified: lead.verified,
          createdAt: lead.createdAt.toISOString(),
        })),
        total: result.data.total,
      }
    },
    filters: searchValue ? { search: searchValue } : undefined,
  })

  // Generate columns on the client side
  const columns = useMemo(
    () => getLeadColumns(dictionary, lang),
    [dictionary, lang]
  )

  // Table instance
  const { table } = useDataTable<LeadRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  })

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      startTransition(() => {
        router.refresh()
      })
    },
    [router]
  )

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (lead: LeadRow) => {
      try {
        const deleteMsg = t.deleteConfirm.replace("{name}", lead.name)
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(lead.id)

        const result = await deleteOperatorLead(lead.id)
        if (result.success) {
          toast.success(t.deleteSuccess)
        } else {
          // Revert on error
          refresh()
          toast.error(result.error || t.deleteError)
        }
      } catch (e) {
        refresh()
        toast.error(e instanceof Error ? e.message : t.deleteError)
      }
    },
    [optimisticRemove, refresh, t.deleteConfirm, t.deleteSuccess, t.deleteError]
  )

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Get status badge
  const getStatusBadge = (status: LeadRow["status"]) => {
    return {
      label: dictionary?.status?.[status] || status,
      variant: STATUS_COLORS[status] as
        | "default"
        | "secondary"
        | "destructive"
        | "outline",
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: LeadRow["priority"]) => {
    return {
      label: dictionary?.priority?.[priority] || priority,
      variant: PRIORITY_COLORS[priority] as
        | "default"
        | "secondary"
        | "destructive"
        | "outline",
    }
  }

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
  }

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        entityName="leads"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 && !isLoading ? (
            <GridEmptyState
              title={t.noLeads}
              description={t.noLeadsDescription}
              icon={
                <Image
                  src="/anthropic/users.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((lead) => {
                const initials = lead.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                return (
                  <GridCard
                    key={lead.id}
                    avatar={{ fallback: initials }}
                    title={lead.name}
                    description={lead.company || lead.email || undefined}
                    subtitle={lead.status}
                    onClick={() => handleEdit(lead.id)}
                  />
                )
              })}
            </GridContainer>
          )}
          {hasMore && !isLoading && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {t.loadMore}
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center py-4">
              <span className="text-muted-foreground">{t.loading}</span>
            </div>
          )}
        </>
      )}

      <Modal
        content={
          <OperatorLeadForm dictionary={dictionary} onSuccess={refresh} />
        }
      />
    </>
  )
}
