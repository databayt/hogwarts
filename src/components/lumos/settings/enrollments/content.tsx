"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"

import { usePlatformView } from "@/hooks/use-platform-view"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import type { EnrollmentRecord } from "./actions"
import { getEnrollmentColumns } from "./columns"

interface Props {
  dictionary: Record<string, any>
  lang: string
  enrollments: EnrollmentRecord[]
}

export function EnrollmentsContent({ dictionary, lang, enrollments }: Props) {
  const d = dictionary?.enrollments ?? {}
  const { view, toggleView } = usePlatformView()
  const [searchValue, setSearchValue] = useState("")

  // One Intl instance per lang, built outside the render loop.
  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    return (date: Date | string) => fmt.format(new Date(date))
  }, [lang])

  const columns = useMemo(
    () => getEnrollmentColumns({ dictionary, formatDate }),
    [dictionary, formatDate]
  )

  // `getSchoolEnrollments` returns the whole (capped) set, so the table
  // filters and sorts client-side rather than round-tripping.
  const { table } = useDataTable<EnrollmentRecord>({
    data: enrollments,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    enableClientSorting: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: enrollments.length || 20 },
      sorting: [{ id: "createdAt", desc: true }],
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      table.getColumn("student")?.setFilterValue(value || undefined)
    },
    [table]
  )

  return (
    <div className="space-y-6">
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={d.searchPlaceholder || "Search enrollments..."}
        entityName="enrollments"
        showViewToggle={false}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={false}
        translations={{ noResults: d.noEnrollments || "No enrollments yet." }}
      />
    </div>
  )
}
