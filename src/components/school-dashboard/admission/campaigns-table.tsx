"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteCampaign, getCampaigns } from "./actions"
import { CampaignForm } from "./campaign-form"
import type { CampaignRow } from "./campaigns-columns"
import { getCampaignColumns } from "./campaigns-columns"

interface CampaignsTableProps {
  initialData: CampaignRow[]
  total: number
  dictionary: Dictionary["school"]["admission"]
  lang: Locale
  perPage?: number
}

export function CampaignsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: CampaignsTableProps) {
  const t = dictionary
  const router = useRouter()
  const { openModal } = useModal()

  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (deferredSearch) f.name = deferredSearch
    return f
  }, [deferredSearch])

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<CampaignRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getCampaigns({
        ...params,
        name: deferredSearch || undefined,
      })
      if (result.success) {
        return {
          rows: result.data.rows as CampaignRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteCampaign({ id })
      if (result.success) {
        toast.success(lang === "ar" ? "تم حذف الحملة" : "Campaign deleted")
        refresh()
      } else {
        toast.error(result.error)
      }
    },
    [lang, refresh]
  )

  const columns = useMemo(
    () =>
      getCampaignColumns(t, lang, {
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [t, lang, handleEdit, handleDelete]
  )

  const { table } = useDataTable<CampaignRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const handleView = useCallback(
    (id: string) => {
      router.push(`/admission/campaigns/${id}`)
    },
    [router]
  )

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status
    const variant =
      status === "OPEN"
        ? "default"
        : status === "DRAFT"
          ? "outline"
          : "secondary"
    return { label, variant: variant as "default" | "outline" | "secondary" }
  }

  const toolbarTranslations = {
    search: t?.campaigns?.campaignName || "Campaign name",
    create: t?.campaigns?.createCampaign || "Create Campaign",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  }

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.campaigns?.campaignName || "Search campaigns..."}
        onCreate={() => openModal()}
        entityName="campaigns"
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
          {data.length === 0 ? (
            <GridEmptyState
              title={t?.campaigns?.title || "Campaigns"}
              description={
                t?.campaigns?.createCampaign ||
                "Create a campaign to get started"
              }
              icon={
                <Image
                  src="/anthropic/document.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((campaign) => (
                <GridCard
                  key={campaign.id}
                  icon="/anthropic/document.svg"
                  title={campaign.name}
                  description={campaign.academicYear}
                  subtitle={`${campaign.applicationsCount} ${t?.nav?.applications || "applications"}`}
                  onClick={() => handleView(campaign.id)}
                />
              ))}
            </GridContainer>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        content={
          <CampaignForm onSuccess={refresh} lang={lang} dictionary={t} />
        }
      />
    </>
  )
}
