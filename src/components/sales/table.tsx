"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { LeadForm } from "@/components/sales/form"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteLead, getLeads } from "./actions"
import { getLeadColumns, type LeadRow } from "./columns"
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  type LeadPriorityKey,
  type LeadStatusKey,
} from "./constants"

interface LeadsTableProps {
  initialData: LeadRow[]
  total: number
  dictionary?: Dictionary["sales"]
  lang: Locale
  perPage?: number
}

export function LeadsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: LeadsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  const isRTL = lang === "ar"

  // Translations with fallbacks
  const t = {
    leads: isRTL ? "العملاء المحتملين" : "Leads",
    addNewLead: isRTL ? "أضف عميلاً محتملاً جديداً" : "Add a new lead to track",
    search: isRTL ? "بحث في العملاء المحتملين..." : "Search leads...",
    create: isRTL ? "إنشاء" : "Create",
    export: isRTL ? "تصدير" : "Export",
    reset: isRTL ? "إعادة تعيين" : "Reset",
    actions: isRTL ? "إجراءات" : "Actions",
    view: isRTL ? "عرض" : "View",
    edit: isRTL ? "تعديل" : "Edit",
    delete: isRTL ? "حذف" : "Delete",
    status: isRTL ? "الحالة" : "Status",
    priority: isRTL ? "الأولوية" : "Priority",
    score: isRTL ? "النتيجة" : "Score",
    loadMore: isRTL ? "تحميل المزيد" : "Load More",
    loading: isRTL ? "جاري التحميل..." : "Loading...",
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
      const result = await getLeads(
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
          createdAt:
            lead.createdAt instanceof Date
              ? lead.createdAt.toISOString()
              : String(lead.createdAt),
        })) as LeadRow[],
        total: result.data.pagination.total,
      }
    },
    filters: searchValue ? { search: searchValue } : undefined,
  })

  // Callback for column delete success
  const handleColumnDeleteSuccess = useCallback(
    (id: string) => {
      optimisticRemove(id)
    },
    [optimisticRemove]
  )

  // Generate columns on the client side
  const columns = useMemo(
    () =>
      getLeadColumns(dictionary, lang, {
        onDeleteSuccess: handleColumnDeleteSuccess,
      }),
    [dictionary, lang, handleColumnDeleteSuccess]
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
      columnVisibility: {
        email: false,
        createdAt: false,
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
        const deleteMsg = isRTL ? `حذف ${lead.name}؟` : `Delete ${lead.name}?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        optimisticRemove(lead.id)

        const result = await deleteLead(lead.id)
        if (result.success) {
          DeleteToast()
        } else {
          refresh()
          ErrorToast(isRTL ? "فشل حذف العميل المحتمل" : "Failed to delete lead")
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : isRTL
              ? "فشل الحذف"
              : "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, isRTL]
  )

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Handle view
  const handleView = useCallback(
    (lead: LeadRow) => {
      router.push(`/sales/${lead.id}`)
    },
    [router]
  )

  // Export CSV wrapper (placeholder)
  const handleExportCSV = useCallback(async () => {
    // TODO: Implement CSV export
    return ""
  }, [])

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
    exportCSV: isRTL ? "تصدير CSV" : "Export CSV",
    exporting: isRTL ? "جاري التصدير..." : "Exporting...",
  }

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (score >= 60)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    if (score >= 40)
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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
        getCSV={handleExportCSV}
        entityName="leads"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.leads}
              description={t.addNewLead}
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
            <GridContainer columns={4}>
              {data.map((lead) => (
                <GridCard
                  key={lead.id}
                  icon="/anthropic/users.svg"
                  title={lead.name}
                  description={lead.company || undefined}
                  onClick={() => handleView(lead)}
                />
              ))}
            </GridContainer>
          )}

          {/* Load more for grid view */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        content={<LeadForm dictionary={dictionary} onSuccess={refresh} />}
      />
    </>
  )
}
