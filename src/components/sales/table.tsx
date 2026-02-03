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
import { LeadForm } from "@/components/sales/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
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
    leads: dictionary?.leads ?? (isRTL ? "العملاء المحتملين" : "Leads"),
    addNewLead:
      dictionary?.addNewLead ??
      (isRTL ? "أضف عميلاً محتملاً جديداً" : "Add a new lead to track"),
    search:
      dictionary?.search ??
      (isRTL ? "بحث في العملاء المحتملين..." : "Search leads..."),
    create: dictionary?.create ?? (isRTL ? "إنشاء" : "Create"),
    export: dictionary?.export ?? (isRTL ? "تصدير" : "Export"),
    reset: dictionary?.reset ?? (isRTL ? "إعادة تعيين" : "Reset"),
    actions: dictionary?.actions ?? (isRTL ? "إجراءات" : "Actions"),
    view: dictionary?.view ?? (isRTL ? "عرض" : "View"),
    edit: dictionary?.edit ?? (isRTL ? "تعديل" : "Edit"),
    delete: dictionary?.delete ?? (isRTL ? "حذف" : "Delete"),
    status: dictionary?.table?.status ?? (isRTL ? "الحالة" : "Status"),
    priority: dictionary?.table?.priority ?? (isRTL ? "الأولوية" : "Priority"),
    score: dictionary?.table?.score ?? (isRTL ? "النتيجة" : "Score"),
    loadMore: dictionary?.loadMore ?? (isRTL ? "تحميل المزيد" : "Load More"),
    loading: dictionary?.loading ?? (isRTL ? "جاري التحميل..." : "Loading..."),
    // Status translations
    NEW: dictionary?.status?.NEW ?? (isRTL ? "جديد" : "New"),
    CONTACTED:
      dictionary?.status?.CONTACTED ?? (isRTL ? "تم التواصل" : "Contacted"),
    QUALIFIED: dictionary?.status?.QUALIFIED ?? (isRTL ? "مؤهل" : "Qualified"),
    PROPOSAL: dictionary?.status?.PROPOSAL ?? (isRTL ? "عرض" : "Proposal"),
    NEGOTIATION:
      dictionary?.status?.NEGOTIATION ?? (isRTL ? "تفاوض" : "Negotiation"),
    CLOSED_WON:
      dictionary?.status?.CLOSED_WON ??
      (isRTL ? "تم الإغلاق (ربح)" : "Closed Won"),
    CLOSED_LOST:
      dictionary?.status?.CLOSED_LOST ??
      (isRTL ? "تم الإغلاق (خسارة)" : "Closed Lost"),
    ARCHIVED: dictionary?.status?.ARCHIVED ?? (isRTL ? "مؤرشف" : "Archived"),
    // Priority translations
    LOW: dictionary?.priority?.LOW ?? (isRTL ? "منخفض" : "Low"),
    MEDIUM: dictionary?.priority?.MEDIUM ?? (isRTL ? "متوسط" : "Medium"),
    HIGH: dictionary?.priority?.HIGH ?? (isRTL ? "عالي" : "High"),
    URGENT: dictionary?.priority?.URGENT ?? (isRTL ? "عاجل" : "Urgent"),
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
        const deleteMsg = (
          dictionary?.deleteConfirm ??
          (isRTL ? "حذف {name}؟" : "Delete {name}?")
        ).replace("{name}", lead.name)
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        optimisticRemove(lead.id)

        const result = await deleteLead(lead.id)
        if (result.success) {
          DeleteToast()
        } else {
          refresh()
          ErrorToast(
            dictionary?.deleteFailed ??
              (isRTL ? "فشل حذف العميل المحتمل" : "Failed to delete lead")
          )
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : (dictionary?.deleteFailedGeneric ??
                (isRTL ? "فشل الحذف" : "Failed to delete"))
        )
      }
    },
    [optimisticRemove, refresh, isRTL, dictionary]
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
    exportCSV: dictionary?.exportCSV ?? (isRTL ? "تصدير CSV" : "Export CSV"),
    exporting:
      dictionary?.exporting ?? (isRTL ? "جاري التصدير..." : "Exporting..."),
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
                    description={lead.company || undefined}
                    subtitle={t[lead.status as keyof typeof t] || lead.status}
                    onClick={() => handleView(lead)}
                  />
                )
              })}
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
