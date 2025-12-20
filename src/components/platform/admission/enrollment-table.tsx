"use client"

import { useCallback, useDeferredValue, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Clock, CreditCard, FileText, UserCheck } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { getEnrollmentData } from "./actions"
import type { EnrollmentRow } from "./enrollment-columns"
import { getEnrollmentColumns } from "./enrollment-columns"

interface EnrollmentTableProps {
  initialData: EnrollmentRow[]
  total: number
  dictionary: Dictionary["school"]["admission"]
  lang: Locale
  perPage?: number
  campaignId?: string
  stats: {
    awaitingEnrollment: number
    enrolled: number
    feesPending: number
    documentsPending: number
  }
}

export function EnrollmentTable({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  campaignId,
  stats,
}: EnrollmentTableProps) {
  const t = dictionary
  const router = useRouter()

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
  } = usePlatformData<EnrollmentRow, Record<string, unknown>>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getEnrollmentData({
        ...params,
        campaignId: campaignId || undefined,
      })
      if (result.success) {
        return {
          rows: result.data.rows as EnrollmentRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters,
  })

  const columns = useMemo(() => getEnrollmentColumns(t, lang), [t, lang])

  const { table } = useDataTable<EnrollmentRow>({
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

  const getOfferBadge = (row: EnrollmentRow) => {
    if (row.admissionConfirmed) {
      return {
        label: t?.enrollment?.accepted || "Accepted",
        variant: "default" as const,
      }
    }
    if (row.admissionOffered) {
      const isExpired =
        row.offerExpiryDate && new Date(row.offerExpiryDate) < new Date()
      if (isExpired) {
        return {
          label: t?.enrollment?.expired || "Expired",
          variant: "destructive" as const,
        }
      }
      return {
        label: t?.enrollment?.pending || "Pending",
        variant: "outline" as const,
      }
    }
    return {
      label: t?.enrollment?.offerPending || "Not Offered",
      variant: "secondary" as const,
    }
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
              {t?.enrollment?.awaitingEnrollment || "Awaiting"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.awaitingEnrollment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.enrollment?.enrolled || "Enrolled"}
            </CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.enrolled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.enrollment?.feesPending || "Fees Pending"}
            </CardTitle>
            <CreditCard className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.feesPending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.enrollment?.documentsPending || "Docs Pending"}
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.documentsPending}
            </div>
          </CardContent>
        </Card>
      </div>

      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t?.columns?.applicant || "Search applicants..."}
        entityName="enrollment"
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
              title={t?.enrollment?.noEnrollments || "No enrollment candidates"}
              description={
                t?.enrollment?.noEnrollmentsDescription ||
                "Selected students will appear here"
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
            <GridContainer columns={4}>
              {data.map((enrollment) => (
                <GridCard
                  key={enrollment.id}
                  icon="/anthropic/document.svg"
                  title={enrollment.applicantName}
                  description={enrollment.applyingForClass}
                  onClick={() => handleView(enrollment.id)}
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
