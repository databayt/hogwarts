"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, Eye, Settings } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { TeacherVideo } from "./actions"
import { VideoSettingsDialog } from "./video-settings-dialog"

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  APPROVED: "default",
  PENDING: "secondary",
  REJECTED: "destructive",
}

export interface VideoColumnOptions {
  /** The `lumos` dictionary subtree — `teachVideos.*` holds these labels. */
  dictionary: Record<string, unknown>
  /** Pre-built date formatter (one Intl instance for the whole table). */
  formatDate: (date: Date | string) => string
  onUpdate: () => void
}

export function getVideoColumns({
  dictionary,
  formatDate,
  onUpdate,
}: VideoColumnOptions): ColumnDef<TeacherVideo>[] {
  const d = (dictionary as Record<string, any>)?.teachVideos ?? {}

  const statusLabel: Record<string, string> = {
    APPROVED: d.statusApproved ?? "Live",
    PENDING: d.statusPending ?? "Publishing",
    REJECTED: d.statusRejected ?? "Needs changes",
  }

  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.colTitle ?? "Title"} />
      ),
      meta: {
        label: d.colTitle ?? "Title",
        variant: "text",
        placeholder: d.searchPlaceholder ?? "Search videos...",
      },
      enableColumnFilter: true,
      filterFn: (row, _id, filterValue: string) =>
        row.original.title.toLowerCase().includes(filterValue.toLowerCase()),
      cell: ({ row }) => {
        const video = row.original
        const showRejection =
          video.approvalStatus === "REJECTED" && !!video.rejectionReason

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              {video.isFeatured && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  {d.featured ?? "Featured"}
                </Badge>
              )}
              {video.title}
            </div>
            {/* The old table carried this in an extra full-width row, which a
                DataTable can't express — it rides under the title instead. */}
            {showRejection && (
              <span className="text-destructive flex items-start gap-1.5 text-xs">
                <AlertCircle className="mt-0.5 size-3 shrink-0" />
                <span>
                  <span className="font-medium">
                    {d.rejectionReasonLabel ?? "What to fix"}:{" "}
                  </span>
                  {video.rejectionReason}
                </span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "subject",
      accessorFn: (row) => row.lesson.chapter.subject.name,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.colSubject ?? "Subject"}
        />
      ),
      meta: { label: d.colSubject ?? "Subject" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "lesson",
      accessorFn: (row) => row.lesson.name,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.colLesson ?? "Lesson"}
        />
      ),
      meta: { label: d.colLesson ?? "Lesson" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "approvalStatus",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.colStatus ?? "Status"}
        />
      ),
      // variant + options make the toolbar render this as a faceted filter —
      // it replaces the status tab strip this table used to carry.
      meta: {
        label: d.colStatus ?? "Status",
        variant: "multiSelect",
        options: [
          { label: statusLabel.APPROVED, value: "APPROVED" },
          { label: statusLabel.PENDING, value: "PENDING" },
          { label: statusLabel.REJECTED, value: "REJECTED" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, filterValue: string[]) =>
        !filterValue?.length || filterValue.includes(row.getValue<string>(id)),
      cell: ({ getValue }) => {
        const status = getValue<string>()
        return (
          <Badge variant={statusVariant[status] ?? "outline"}>
            {statusLabel[status] ?? status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "visibility",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.colVisibility ?? "Visibility"}
        />
      ),
      meta: {
        label: d.colVisibility ?? "Visibility",
        variant: "multiSelect",
        options: ["PRIVATE", "SCHOOL", "PUBLIC", "PAID"].map((v) => ({
          label: v,
          value: v,
        })),
      },
      enableColumnFilter: true,
      filterFn: (row, id, filterValue: string[]) =>
        !filterValue?.length || filterValue.includes(row.getValue<string>(id)),
      cell: ({ getValue }) => (
        <Badge variant="outline">{getValue<string>()}</Badge>
      ),
    },
    {
      id: "pricing",
      accessorFn: (row) => row.price ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={d.colPricing ?? "Pricing"}
        />
      ),
      meta: { label: d.colPricing ?? "Pricing" },
      cell: ({ row }) => {
        const video = row.original
        const isPaid =
          video.visibility === "PAID" ||
          (video.price != null && video.price > 0)
        return (
          <span className="text-sm">
            {isPaid && video.price != null
              ? `${video.price.toFixed(2)} ${video.currency ?? ""}`
              : (d.free ?? "Free")}
          </span>
        )
      },
    },
    {
      accessorKey: "viewCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.colViews ?? "Views"} />
      ),
      meta: { label: d.colViews ?? "Views" },
      cell: ({ getValue }) => (
        <span className="flex items-center gap-1">
          <Eye className="size-3" />
          {getValue<number>()}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={d.colDate ?? "Date"} />
      ),
      meta: { label: d.colDate ?? "Date" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(getValue<string | Date>())}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const video = row.original
        return (
          <VideoSettingsDialog
            video={{
              id: video.id,
              title: video.title,
              visibility: video.visibility,
              approvalStatus: video.approvalStatus,
              viewCount: video.viewCount,
              lessonName: video.lesson.name,
              courseName: video.lesson.chapter.subject.name,
            }}
            onUpdate={onUpdate}
            dictionary={dictionary as Record<string, any>}
          >
            <Button variant="ghost" size="icon" className="size-8">
              <Settings className="size-3.5" />
            </Button>
          </VideoSettingsDialog>
        )
      },
    },
  ]
}
