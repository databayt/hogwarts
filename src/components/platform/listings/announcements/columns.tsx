"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Ellipsis } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModal } from "@/components/atom/modal/context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

/**
 * Callback options for optimistic updates
 * Pass these from the table component for instant UI updates
 */
export interface ColumnCallbacks {
  onDelete?: (announcement: AnnouncementRow) => void
  onTogglePublish?: (announcement: AnnouncementRow) => void
}

// Bilingual row type - both language versions
export type AnnouncementRow = {
  id: string
  titleEn: string | null
  titleAr: string | null
  scope: string
  published: boolean
  createdAt: string
  createdBy: string | null
  priority: string
  pinned: boolean
  featured: boolean
}

/**
 * Get localized title with fallback
 * If preferred locale is missing, falls back to the other language
 */
function getLocalizedTitle(row: AnnouncementRow, locale: Locale): string {
  if (locale === "ar") {
    return row.titleAr || row.titleEn || ""
  }
  return row.titleEn || row.titleAr || ""
}

export const getAnnouncementColumns = (
  dictionary: Dictionary["school"]["announcements"],
  locale: Locale,
  callbacks?: ColumnCallbacks
): ColumnDef<AnnouncementRow>[] => {
  const t = dictionary

  // Map dictionary keys to column structure for easier access
  const columns = {
    title: t.announcementTitle,
    scope: t.scope,
    status: t.status,
    created: t.created,
    actions: t.actions,
  }

  return [
    {
      // Use a custom accessor that returns localized title
      accessorFn: (row) => getLocalizedTitle(row, locale),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.title} />
      ),
      meta: { label: columns.title, variant: "text" },
      id: "title",
      enableColumnFilter: true,
      // Custom filter that searches both languages
      filterFn: (row, id, filterValue: string) => {
        const titleEn = row.original.titleEn?.toLowerCase() || ""
        const titleAr = row.original.titleAr || ""
        const search = filterValue.toLowerCase()
        return titleEn.includes(search) || titleAr.includes(search)
      },
    },
    {
      accessorKey: "scope",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.scope} />
      ),
      cell: ({ getValue }) => {
        const scope = getValue<string>()
        const labels: Record<string, string> = {
          school: t.schoolWide,
          class: t.classSpecific,
          role: t.roleSpecific,
        }
        return <span className="text-sm">{labels[scope] || scope}</span>
      },
      meta: {
        label: columns.scope,
        variant: "select",
        options: [
          { label: t.schoolWide, value: "school" },
          { label: t.classSpecific, value: "class" },
          { label: t.roleSpecific, value: "role" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "published",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.status} />
      ),
      cell: ({ getValue }) => {
        const is = getValue<boolean>()
        return (
          <Badge variant={is ? "default" : "outline"}>
            {is ? t.published : t.draft}
          </Badge>
        )
      },
      meta: {
        label: columns.status,
        variant: "select",
        options: [
          { label: t.published, value: "true" },
          { label: t.draft, value: "false" },
        ],
      },
      id: "published",
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(String(row.getValue(id))),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={columns.created} />
      ),
      meta: { label: columns.created, variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {new Date(getValue<string>()).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{columns.actions}</span>,
      cell: ({ row }) => {
        const announcement = row.original
        const { openModal } = useModal()

        const onEdit = () => openModal(announcement.id)
        const onToggle = () => {
          // Use callback for instant optimistic update
          callbacks?.onTogglePublish?.(announcement)
        }
        const onDelete = () => {
          // Use callback for instant optimistic removal
          callbacks?.onDelete?.(announcement)
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">{t.openMenu}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{columns.actions}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/announcements/${announcement.id}`}>
                  {t.view}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                {locale === "ar" ? "تعديل" : "Edit"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggle}>
                {announcement.published ? t.unpublish : t.publish}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                {locale === "ar" ? "حذف" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
