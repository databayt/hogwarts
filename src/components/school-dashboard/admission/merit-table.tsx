"use client"

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Award, Clock, RefreshCw, TrendingUp, Users } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { generateMeritList, getMeritListData } from "./actions"
import type { MeritRow } from "./merit-columns"
import { getMeritColumns } from "./merit-columns"

interface MeritTableProps {
  initialData: MeritRow[]
  total: number
  dictionary: Dictionary["school"]["admission"]
  lang: Locale
  perPage?: number
  campaignId?: string
  stats: {
    totalRanked: number
    selected: number
    waitlisted: number
    avgScore: number
  }
}

export function MeritTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  campaignId,
  stats,
}: MeritTableProps) {
  const t = dictionary
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (campaignId) f.campaignId = campaignId
    return f
  }, [campaignId])

  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
  } = usePlatformData<MeritRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getMeritListData({
        ...params,
        campaignId: campaignId || undefined,
      })
      if (result.success) {
        return {
          rows: result.data.rows as MeritRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const columns = useMemo(() => getMeritColumns(t, lang), [t, lang])

  const { table } = useDataTable<MeritRow>({
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

  const handleGenerateMeritList = useCallback(() => {
    if (!campaignId) return
    startTransition(async () => {
      await generateMeritList({ campaignId })
      refresh()
    })
  }, [campaignId, refresh])

  const getStatusBadge = (status: string) => {
    const label = t?.status?.[status as keyof typeof t.status] || status
    const variant =
      status === "SELECTED"
        ? "default"
        : status === "WAITLISTED"
          ? "secondary"
          : status === "REJECTED"
            ? "destructive"
            : "outline"
    return { label, variant: variant as any }
  }

  const toolbarTranslations = {
    search: t?.columns?.applicant || "Search applicants...",
    create: "",
    reset: "Reset",
    tableView: "Table",
    gridView: "Grid",
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.totalRanked || "Total Ranked"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRanked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.selected || "Selected"}
            </CardTitle>
            <Award className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.selected}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.waitlisted || "Waitlisted"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.waitlisted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.meritList?.avgScore || "Avg Score"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgScore.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Merit List Button */}
      {campaignId && (
        <div className="flex justify-end">
          <Button onClick={handleGenerateMeritList} disabled={isPending}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
            {isPending
              ? t?.meritList?.generating || "Generating..."
              : t?.meritList?.generateMeritList || "Generate Merit List"}
          </Button>
        </div>
      )}

      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.columns?.applicant || "Search applicants..."}
        entityName="merit"
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
              title={
                t?.meritList?.noRankedApplications || "No ranked applications"
              }
              description={
                t?.meritList?.noRankedDescription ||
                "Generate a merit list to see ranked applications"
              }
              icon={
                <Image
                  src="/anthropic/graduation-cap.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((merit) => (
                <GridCard
                  key={merit.id}
                  icon="/anthropic/graduation-cap.svg"
                  title={merit.applicantName}
                  description={`#${merit.meritRank}`}
                  subtitle={merit.status}
                  onClick={() => handleView(merit.id)}
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
    </>
  )
}
