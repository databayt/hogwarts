"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { BarChart3, BookOpen, GraduationCap, Layers } from "lucide-react"

import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import { SeeMore } from "@/components/atom/see-more"
import { PlatformToolbar } from "@/components/school-dashboard/shared/platform-toolbar"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { catalogColumns, type CatalogSubjectRow } from "./columns"
import { CreateSubjectForm } from "./create-subject-dialog"

interface Props {
  data: CatalogSubjectRow[]
  stats?: {
    subjects: number
    chapters: number
    lessons: number
  }
}

export function CatalogTable({ data, stats }: Props) {
  const columns = useMemo(() => catalogColumns, [])
  const { view, toggleView } = usePlatformView()
  const { openModal } = useModal()
  const [search, setSearch] = useState("")
  const PAGE_SIZE = 20
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.department?.toLowerCase().includes(q)
    )
  }, [data, search])

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )

  const { table } = useDataTable<CatalogSubjectRow>({
    data: visible,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: visible.length || PAGE_SIZE },
      columnVisibility: { department: false },
    },
  })

  const [statsOpen, setStatsOpen] = useState(false)

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search subjects..."
        onCreate={() => openModal()}
        showColumnToggle
        translations={{
          search: "Search subjects...",
          create: "Create Subject",
        }}
        additionalActions={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setStatsOpen(true)}
            aria-label="Catalog Stats"
            title="Catalog Stats"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
        }
      />

      <DataTable table={table} />

      <SeeMore
        hasMore={visibleCount < filtered.length}
        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
      />

      <Modal content={<CreateSubjectForm />} />

      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Catalog Overview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <GraduationCap className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-2xl font-bold">{stats?.subjects ?? 0}</p>
                <p className="text-muted-foreground text-sm">
                  Global catalog subjects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Layers className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-2xl font-bold">{stats?.chapters ?? 0}</p>
                <p className="text-muted-foreground text-sm">
                  Across all subjects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <BookOpen className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-2xl font-bold">{stats?.lessons ?? 0}</p>
                <p className="text-muted-foreground text-sm">
                  Total curriculum lessons
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
