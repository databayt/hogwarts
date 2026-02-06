"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
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

import { getApplications } from "./actions"
import type { ApplicationRow } from "./applications-columns"
import { getApplicationColumns } from "./applications-columns"

interface ApplicationsTableProps {
  initialData: ApplicationRow[]
  total: number
  dictionary: Dictionary["school"]["admission"]
  lang: Locale
  perPage?: number
  campaignId?: string
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "SELECTED":
    case "ADMITTED":
      return "default"
    case "SHORTLISTED":
      return "secondary"
    case "REJECTED":
    case "WITHDRAWN":
      return "destructive"
    default:
      return "outline"
  }
}

export function ApplicationsTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  campaignId,
}: ApplicationsTableProps) {
  const t = dictionary
  const router = useRouter()

  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (deferredSearch) f.search = deferredSearch
    if (campaignId) f.campaignId = campaignId
    return f
  }, [deferredSearch, campaignId])

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<ApplicationRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getApplications({
        ...params,
        search: deferredSearch || undefined,
        campaignId: campaignId || undefined,
      })
      if (result.success && result.data) {
        return {
          rows: result.data.rows as ApplicationRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const columns = useMemo(() => getApplicationColumns(t, lang), [t, lang])

  const { table } = useDataTable<ApplicationRow>({
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
      router.push(`/admission/applications/${id}`)
    },
    [router]
  )

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status
    return { label, variant: getStatusVariant(status) as any }
  }

  const toolbarTranslations = {
    search: t?.applications?.searchPlaceholder || "Search applications...",
    create: "",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
    export: t?.applications?.export || "Export",
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
        searchPlaceholder={
          t?.applications?.searchPlaceholder || "Search applications..."
        }
        entityName="applications"
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
              title={t?.applications?.noApplications || "No applications"}
              description={
                t?.applications?.noApplicationsDescription ||
                "Applications will appear here"
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
              {data.map((application) => (
                <GridCard
                  key={application.id}
                  icon="/anthropic/document.svg"
                  title={application.applicantName}
                  description={application.applyingForClass}
                  subtitle={application.status}
                  onClick={() => handleView(application.id)}
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
                {isLoading
                  ? t?.applications?.loading || "Loading..."
                  : t?.applications?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
