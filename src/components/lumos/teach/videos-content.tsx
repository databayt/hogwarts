"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Eye, Film } from "lucide-react"

import { usePlatformView } from "@/hooks/use-platform-view"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import type { TeacherVideo } from "./actions"
import type { ProposableGrade } from "./get-proposable-lessons"
import { ProposeVideoDialog } from "./propose-video-dialog"
import { getVideoColumns } from "./videos-columns"

interface Props {
  dictionary: Record<string, unknown>
  lang: string
  videos: TeacherVideo[]
  subdomain: string
  // Subjects the caller may upload into — powers the upload button. The
  // lessons themselves are searched from inside the dialog.
  proposableGrades?: ProposableGrade[]
  /** The school's own currency (School.currency) — what a paid video is priced in. */
  currency?: string
}

export function TeachVideosContent({
  dictionary,
  lang,
  videos,
  proposableGrades = [],
  currency,
}: Props) {
  const router = useRouter()
  const { view, toggleView } = usePlatformView()
  const [searchValue, setSearchValue] = useState("")
  // The settings page passes the `lumos` subtree as `dictionary`.
  const d = (dictionary as Record<string, any>)?.teachVideos ?? {}

  // No proposable catalog = no upload button. That state is REACHABLE and was
  // silent: a freshly-onboarded school has no active SubjectSelection yet, so
  // an admin landed on an empty video library with no control and no reason
  // given. Say what is missing and where to fix it instead of rendering
  // nothing. (`getProposableCatalog` also drops subjects with zero visible
  // lessons, so a school that hid everything lands here too.)
  const uploadButton =
    proposableGrades.length > 0 ? (
      <ProposeVideoDialog
        grades={proposableGrades}
        lang={lang}
        dictionary={dictionary as Record<string, any>}
        {...(currency ? { currency } : {})}
      />
    ) : (
      <Link
        href={`/${lang}/subjects`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {(dictionary as Record<string, any>)?.proposeVideo?.empty ||
          "No lessons available to upload to."}
      </Link>
    )

  // Build the formatter once per lang (was constructing a new
  // Intl.DateTimeFormat per row inside the render loop).
  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    return (date: Date | string) => fmt.format(new Date(date))
  }, [lang])

  const handleUpdate = useCallback(() => router.refresh(), [router])

  const columns = useMemo(
    () => getVideoColumns({ dictionary, formatDate, onUpdate: handleUpdate }),
    [dictionary, formatDate, handleUpdate]
  )

  const counts = useMemo(
    () => ({
      all: videos.length,
      APPROVED: videos.filter((v) => v.approvalStatus === "APPROVED").length,
      PENDING: videos.filter((v) => v.approvalStatus === "PENDING").length,
    }),
    [videos]
  )

  const totalViews = useMemo(
    () => videos.reduce((sum, v) => sum + v.viewCount, 0),
    [videos]
  )

  // Every row is already in memory (getMyVideos returns the full set), so the
  // table filters and sorts client-side rather than round-tripping.
  const { table } = useDataTable<TeacherVideo>({
    data: videos,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    enableClientSorting: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: videos.length || 20 },
      sorting: [{ id: "createdAt", desc: true }],
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      table.getColumn("title")?.setFilterValue(value || undefined)
    },
    [table]
  )

  const stats = [
    { icon: Film, value: counts.all, label: d.statTotal ?? "Total" },
    {
      icon: CheckCircle2,
      value: counts.APPROVED,
      label: d.statApproved ?? "Live",
      className: "text-green-600",
    },
    {
      icon: Clock,
      value: counts.PENDING,
      label: d.statPending ?? "Publishing",
      className: "text-yellow-600",
    },
    {
      icon: Eye,
      value: totalViews.toLocaleString(),
      label: d.statTotalViews ?? "Total Views",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ icon: Icon, value, label, className }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-4">
              <Icon className={className ?? "text-muted-foreground"} />
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={d.searchPlaceholder ?? "Search videos..."}
        entityName="videos"
        showViewToggle={false}
        additionalActions={uploadButton}
      />

      <DataTable table={table} paginationMode="load-more" hasMore={false} />

      {/* Ownership reminder */}
      <p className="text-muted-foreground text-center text-xs">
        {d.ownershipNote ??
          "You retain full ownership of all your videos. Use the settings button to manage visibility or delete."}
      </p>
    </div>
  )
}
